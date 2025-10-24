
from __future__ import annotations

from pathlib import Path
from typing import List, Optional, Literal

import yaml
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import AGENTS_SOURCE, ARKA_OS_ROOT
from app.deps.db import get_db
from pydantic import BaseModel


router = APIRouter()


def _fetch_agents_db(db: Session, client: str) -> List[dict]:
    rows = db.execute(
        text(
            """
            SELECT client_code, agent_id, role, ref, onboarding_path, state, context_status, created_at
            FROM projects.v_client_agents
            WHERE client_code = :code
            ORDER BY agent_id
            """
        ),
        {"code": client},
    ).mappings()
    return [dict(row) for row in rows]


def _fetch_agents_fs(client: str) -> List[dict]:
    base_dir = ARKA_OS_ROOT / 'ARKA_AGENT' / 'clients' / client / 'agents'
    agents: List[dict] = []
    if not base_dir.exists():
        return agents
    for agent_dir in sorted(p for p in base_dir.iterdir() if p.is_dir()):
        agent_id = agent_dir.name
        onboarding = agent_dir / 'onboarding.yaml'
        role = None
        meta = agent_dir / 'agent.yaml'
        if meta.exists():
            try:
                payload = yaml.safe_load(meta.read_text(encoding='utf-8')) or {}
                role = payload.get('role') or payload.get('name')
            except Exception:  # pragma: no cover - best effort only
                role = None
        agents.append(
            {
                'client_code': client,
                'agent_id': agent_id,
                'role': role,
                'ref': f'clients/{client}/agents/{agent_id}',
                'onboarding_path': str(onboarding),
                'state': 'awake',
                'context_status': 'nominal',
                'created_at': None,
            }
        )
    return agents


class AgentStatusUpdate(BaseModel):
    client: str
    agent_id: str
    state: Optional[Literal['awake', 'sleep', 'degraded']] = None
    context_status: Optional[Literal['nominal', 'low', 'critical']] = None


@router.get('/agents/directory')
def agents_directory(
    client: str = Query(..., description='Code client, ex: ACME'),
    db: Session = Depends(get_db),
) -> dict:
    source = AGENTS_SOURCE
    db_error: Optional[Exception] = None

    if source in ('db', 'auto'):
        try:
            items = _fetch_agents_db(db, client)
            if items or source == 'db':
                return {'client': client, 'agents': items, 'source': 'db'}
        except Exception as exc:  # pragma: no cover
            db_error = exc
            if source == 'db':
                source = 'auto'  # allow graceful fallback

    if source in ('fs', 'auto') or db_error is not None:
        try:
            items = _fetch_agents_fs(client)
            if items or source == 'fs' or db_error is not None:
                payload = {'client': client, 'agents': items, 'source': 'fs'}
                if db_error is not None:
                    payload['fallback'] = 'fs'
                    payload['errors'] = {'db': str(db_error)}
                elif source == 'auto':
                    payload['fallback'] = 'fs'
                return payload
        except Exception as exc:  # pragma: no cover
            if source in ('fs', 'auto') or db_error is not None:
                detail = f'agents_directory FS error: {exc}'
                if db_error is not None:
                    detail = f'agents_directory fallback failed (DB error: {db_error}; FS error: {exc})'
                raise HTTPException(status_code=500, detail=detail)

    if db_error is not None:
        raise HTTPException(status_code=500, detail=f'agents_directory unavailable (DB error: {db_error})')

    raise HTTPException(status_code=404, detail=f'Aucun agent pour le client {client}')


@router.patch('/agents/directory')
def update_agent_state(
    payload: AgentStatusUpdate,
    db: Session = Depends(get_db),
) -> dict:
    params = {
        'client': payload.client,
        'agent_id': payload.agent_id,
        'state': payload.state,
        'context_status': payload.context_status,
    }
    result = db.execute(
        text(
            """
            UPDATE projects.agent_refs ar
            SET state = COALESCE(:state, ar.state),
                context_status = COALESCE(:context_status, ar.context_status)
            FROM projects.clients c
            WHERE c.id = ar.client_id
              AND c.code = :client
              AND ar.agent_id = :agent_id
            RETURNING ar.agent_id, ar.state, ar.context_status
            """
        ),
        params,
    ).mappings().first()
    if not result:
        raise HTTPException(status_code=404, detail="Agent introuvable pour ce client")
    return {'agent_id': result['agent_id'], 'state': result['state'], 'context_status': result['context_status']}


@router.get('/agents/onboarding')
def get_agent_onboarding(
    client: str = Query(..., description='Code client, ex: ACME'),
    agent_id: str = Query(..., description="Identifiant de l'agent"),
    db: Session = Depends(get_db),
) -> dict:
    if '/' in agent_id or '\\' in agent_id:
        raise HTTPException(status_code=400, detail='Identifiant agent invalide')
    record = db.execute(
        text(
            """
            SELECT ar.onboarding_path, ar.ref
            FROM projects.agent_refs ar
            JOIN projects.clients c ON c.id = ar.client_id
            WHERE c.code = :client AND ar.agent_id = :agent_id
            """
        ),
        {'client': client, 'agent_id': agent_id},
    ).mappings().first()

    onboarding_candidates = []
    if record and record.get('onboarding_path'):
        onboarding_candidates.append(Path(record['onboarding_path']))

    # Fallback: filesystem reference under ARKA_OS/ARKA_AGENT
    onboarding_candidates.append(
        ARKA_OS_ROOT / 'ARKA_AGENT' / 'clients' / client / 'agents' / agent_id / 'onboarding.yaml'
    )

    resolved_path: Optional[Path] = None
    errors = []
    root = ARKA_OS_ROOT.resolve()
    for candidate in onboarding_candidates:
        try:
            if candidate.is_absolute():
                path = candidate.resolve()
            else:
                parts = candidate.parts
                if parts and parts[0] == 'ARKA_OS':
                    path = (root.parent / Path(*parts)).resolve()
                else:
                    path = (root / candidate).resolve()
        except OSError as exc:
            errors.append(str(exc))
            continue
        try:
            path.relative_to(root)
        except ValueError:
            errors.append(f'candidate outside ARKA_OS: {path}')
            continue
        if path.exists():
            resolved_path = path
            break

    if not resolved_path:
        detail = 'Onboarding introuvable pour cet agent'
        if errors:
            detail += f" (candidates: {', '.join(errors)})"
        raise HTTPException(status_code=404, detail=detail)

    try:
        content = resolved_path.read_text(encoding='utf-8')
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f'Lecture onboarding impossible: {exc}') from exc
    return {
        'client': client,
        'agent_id': agent_id,
        'ref': record['ref'] if record else f'clients/{client}/agents/{agent_id}',
        'filename': resolved_path.name,
        'content': content,
    }
