
from __future__ import annotations

from pathlib import Path
from typing import List

import yaml
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import AGENTS_SOURCE, ARKA_OS_ROOT
from app.deps.db import get_db


router = APIRouter()


def _fetch_agents_db(db: Session, client: str) -> List[dict]:
    rows = db.execute(
        text(
            """
            SELECT client_code, agent_id, role, ref, onboarding_path, created_at
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
                'created_at': None,
            }
        )
    return agents


@router.get('/agents/directory')
def agents_directory(
    client: str = Query(..., description='Code client, ex: ACME'),
    db: Session = Depends(get_db),
) -> dict:
    source = AGENTS_SOURCE
    if source in ('db', 'auto'):
        try:
            items = _fetch_agents_db(db, client)
            if items or source == 'db':
                return {'client': client, 'agents': items, 'source': 'db'}
        except Exception as exc:  # pragma: no cover
            if source == 'db':
                raise HTTPException(status_code=500, detail=f'agents_directory DB error: {exc}')
    if source in ('fs', 'auto'):
        try:
            items = _fetch_agents_fs(client)
            if items or source == 'fs':
                payload = {'client': client, 'agents': items, 'source': 'fs'}
                if source == 'auto':
                    payload['fallback'] = 'fs'
                return payload
        except Exception as exc:  # pragma: no cover
            if source == 'fs':
                raise HTTPException(status_code=500, detail=f'agents_directory FS error: {exc}')
    raise HTTPException(status_code=404, detail=f'Aucun agent pour le client {client}')
