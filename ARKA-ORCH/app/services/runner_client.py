# app/services/runner_client.py
import requests, uuid
from typing import Dict, Any
from app.utils.config import RUNNER_URL, RUNNER_API_KEY

HEADERS = {"X-API-Key": RUNNER_API_KEY} if RUNNER_API_KEY else {}

class RunnerError(RuntimeError): ...

def ensure_runner_session(client: str, flow_ref: str) -> str:
    r = requests.post(
        f"{RUNNER_URL}/runner/session",
        json={"client": client, "flow_ref": flow_ref},
        headers=HEADERS,
        timeout=10,
    )
    if r.status_code not in (200,201):
        raise RunnerError(f"runner session: {r.status_code} {r.text[:200]}")
    return r.json().get("id")

def run_step(session_id: str, agent_ref: str, flow_ref: str, step: Dict[str,Any]) -> Dict[str,Any]:
    payload = {
        "session_id": session_id,
        "agent_ref": agent_ref,
        "flow_ref": flow_ref,
        "step": step,
        "payload": step.get("payload",{}),
        "provider_policy": step.get("provider_policy",{})
    }
    r = requests.post(
        f"{RUNNER_URL}/runner/step",
        json=payload,
        headers=HEADERS,
        timeout=120,
    )
    if r.status_code >= 400:
        raise RunnerError(f"runner step: {r.status_code} {r.text[:200]}")
    return r.json()
