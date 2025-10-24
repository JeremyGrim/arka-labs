from __future__ import annotations

import shlex
import subprocess
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, List, Optional
import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator

from app.config import ARKA_OS_ROOT


router = APIRouter()

DEFAULT_PROVIDER = "codex"
SESSION_PREFIX = "arka"
REPO_ROOT = Path(__file__).resolve().parents[2]
MANAGE_SCRIPT_PATH = "ARKA_OS/ARKA_CORE/management/sessions_agents/Manage-ArkaAgents.ps1"


def _run_tmux(args: Iterable[str]) -> subprocess.CompletedProcess[str]:
    try:
        result = subprocess.run(
            ["tmux", *args],
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"tmux indisponible sur le serveur (installe tmux ou bascule via {MANAGE_SCRIPT_PATH}).",
        ) from exc
    return result


def _slug(value: str) -> str:
    cleaned = "".join(ch if ch.isalnum() else "-" for ch in (value or ""))
    return "-".join(part for part in cleaned.lower().split("-") if part)


def _session_name(client: str, agent_id: str, provider: str) -> str:
    return f"{SESSION_PREFIX}-{_slug(client)}-{_slug(agent_id)}-{_slug(provider or DEFAULT_PROVIDER)}"


def _session_exists(session: str) -> bool:
    result = _run_tmux(["has-session", "-t", session])
    return result.returncode == 0


def _ensure_tmux() -> None:
    try:
        result = subprocess.run(["tmux", "-V"], capture_output=True, text=True, check=False)
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"tmux indisponible sur le serveur (installe tmux ou utilise {MANAGE_SCRIPT_PATH}).",
        ) from exc
    if result.returncode != 0:
        raise HTTPException(status_code=503, detail="tmux indisponible sur le serveur")


def _format_tmux_error(result: subprocess.CompletedProcess[str]) -> str:
    output = result.stderr.strip() or result.stdout.strip()
    return output or "erreur tmux inconnue"


def _start_session(session: str, command: str, workdir: Optional[Path] = None) -> str:
    args: List[str] = ["new-session", "-d", "-s", session]
    if workdir:
        args.extend(["-c", str(workdir)])
    args.append(command)
    result = _run_tmux(args)
    if result.returncode != 0:
        raise RuntimeError(_format_tmux_error(result))
    time.sleep(0.1)
    if not _session_exists(session):
        detail = result.stderr.strip() or result.stdout.strip() or ""
        raise RuntimeError(
            "session tmux non créée (vérifie le backend)" + (f" — {detail}" if detail else "")
        )
    return command


def _kill_session(session: str) -> None:
    result = _run_tmux(["kill-session", "-t", session])
    if result.returncode != 0:
        raise RuntimeError(_format_tmux_error(result))


def _tmux_send_lines(session: str, lines: Iterable[str]) -> None:
    for line in lines:
        result = _run_tmux(["send-keys", "-t", session, "--", line])
        if result.returncode != 0:
            raise RuntimeError(_format_tmux_error(result))
        _run_tmux(["send-keys", "-t", session, "Enter"])


def _onboarding_path(client: str, agent_id: str) -> Optional[Path]:
    candidate = (
        ARKA_OS_ROOT
        / "ARKA_AGENT"
        / "clients"
        / client
        / "agents"
        / agent_id
        / "onboarding.yaml"
    )
    if candidate.exists():
        return candidate
    return None


class RuntimeActionPayload(BaseModel):
    client: str = Field(..., min_length=1)
    agents: List[str] = Field(..., min_items=1)
    provider: Optional[str] = None

    @validator("agents", each_item=True)
    def _check_agent(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("identifiant agent vide")
        return value.strip()

    @validator("client")
    def _normalize_client(cls, value: str) -> str:
        return value.strip()


@dataclass
class RuntimeResult:
    agent_id: str
    session: str
    status: str
    detail: Optional[str] = None

    def as_dict(self) -> dict:
        payload = {
            "agent_id": self.agent_id,
            "session": self.session,
            "status": self.status,
        }
        if self.detail:
            payload["detail"] = self.detail
        return payload


def _compute_command(agent_id: str, session: str) -> str:
    # Pour l'instant, on démarre une session minimale qui reste attachée (sleep infinity).
    # Les messages de wake-up fourniront le contexte détaillé.
    return "sleep infinity"


def _list_sessions_raw() -> List[str]:
    result = _run_tmux(["list-sessions", "-F", "#S"])
    if result.returncode != 0:
        message = (result.stderr or result.stdout or "").strip().lower()
        if "no server running" in message:
            return []
        raise HTTPException(status_code=500, detail=_format_tmux_error(result))
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def _get_session_created(session: str) -> Optional[int]:
    result = _run_tmux(["display-message", "-p", "-t", session, "#{session_created}"])
    if result.returncode != 0:
        return None
    raw = result.stdout.strip()
    if not raw:
        return None
    try:
        return int(raw)
    except ValueError:
        return None


@router.get("/agents/runtime/sessions")
def list_runtime_sessions(client: Optional[str] = None, provider: Optional[str] = None) -> dict:
    _ensure_tmux()
    provider_slug = _slug(provider or DEFAULT_PROVIDER)
    target_client_slug = _slug(client) if client else None

    sessions_payload: List[dict] = []
    for name in _list_sessions_raw():
        if not name.startswith(f"{SESSION_PREFIX}-"):
            continue
        remainder = name[len(SESSION_PREFIX) + 1 :]
        parts = remainder.split("-")
        if len(parts) < 2:
            continue
        session_provider = parts[-1]
        session_client = parts[0]
        agent_slug = "-".join(parts[1:-1]) if len(parts) > 2 else ""

        if target_client_slug and session_client != target_client_slug:
            continue
        if provider and session_provider != provider_slug:
            continue

        created_ts = _get_session_created(name)
        created_at = None
        uptime_seconds = None
        if created_ts:
            created_at = datetime.fromtimestamp(created_ts, timezone.utc).isoformat()
            uptime_seconds = max(0, int(time.time() - created_ts))

        sessions_payload.append(
            {
                "session": name,
                "client_slug": session_client,
                "agent_slug": agent_slug,
                "provider_slug": session_provider,
                "created_at": created_at,
                "uptime_seconds": uptime_seconds,
            }
        )

    return {
        "client": client,
        "provider": provider or DEFAULT_PROVIDER,
        "count": len(sessions_payload),
        "sessions": sessions_payload,
        "fallback": MANAGE_SCRIPT_PATH,
    }


@router.post("/agents/runtime/start")
def start_agents(payload: RuntimeActionPayload) -> dict:
    _ensure_tmux()
    provider = payload.provider or DEFAULT_PROVIDER
    results: List[RuntimeResult] = []

    for agent in payload.agents:
        session = _session_name(payload.client, agent, provider)
        if _session_exists(session):
            results.append(RuntimeResult(agent, session, "already_running"))
            continue
        try:
            command = _compute_command(agent, session)
            _start_session(session, command, workdir=REPO_ROOT)
            results.append(RuntimeResult(agent, session, "started", detail=command))
        except Exception as exc:
            results.append(RuntimeResult(agent, session, "error", detail=str(exc)))

    return {
        "client": payload.client,
        "provider": provider,
        "results": [entry.as_dict() for entry in results],
        "fallback": MANAGE_SCRIPT_PATH,
    }


@router.post("/agents/runtime/stop")
def stop_agents(payload: RuntimeActionPayload) -> dict:
    _ensure_tmux()
    provider = payload.provider or DEFAULT_PROVIDER
    results: List[RuntimeResult] = []

    for agent in payload.agents:
        session = _session_name(payload.client, agent, provider)
        if not _session_exists(session):
            results.append(RuntimeResult(agent, session, "not_found"))
            continue
        try:
            _kill_session(session)
            results.append(RuntimeResult(agent, session, "stopped"))
        except Exception as exc:
            results.append(RuntimeResult(agent, session, "error", detail=str(exc)))

    return {
        "client": payload.client,
        "provider": provider,
        "results": [entry.as_dict() for entry in results],
        "fallback": MANAGE_SCRIPT_PATH,
    }


@router.post("/agents/runtime/wakeup")
def wakeup_agents(payload: RuntimeActionPayload) -> dict:
    _ensure_tmux()
    provider = payload.provider or DEFAULT_PROVIDER
    results: List[RuntimeResult] = []

    for agent in payload.agents:
        session = _session_name(payload.client, agent, provider)
        if not _session_exists(session):
            results.append(RuntimeResult(agent, session, "not_found"))
            continue

        onboard_path = _onboarding_path(payload.client, agent)
        if onboard_path:
            target_ref = onboard_path.relative_to(REPO_ROOT)
            message = f"Voici ton rôle et contexte projet, lis tous les docs et présente-moi ton rôle : {target_ref}"
        else:
            message = (
                f"Wake-up déclenché mais onboarding introuvable pour {agent}. "
                f"Référence attendue: ARKA_OS/ARKA_AGENT/clients/{payload.client}/agents/{agent}/onboarding.yaml"
            )

        try:
            _tmux_send_lines(session, [message, ""])
            results.append(RuntimeResult(agent, session, "wakeup_sent", detail=message))
        except Exception as exc:
            results.append(RuntimeResult(agent, session, "error", detail=str(exc)))

    return {
        "client": payload.client,
        "provider": provider,
        "results": [entry.as_dict() for entry in results],
        "fallback": MANAGE_SCRIPT_PATH,
    }
