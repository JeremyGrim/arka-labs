from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import requests
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import ORCH_API_KEY, ORCH_URL, SESSIONS_SOURCE
from app.deps.db import get_db


router = APIRouter()


def _table_exists(db: Session, regclass: str) -> bool:
    return bool(db.execute(text("SELECT to_regclass(:name)"), {"name": regclass}).scalar())


def _iso_or_none(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


def _parse_datetime(label: str, raw: Optional[str]) -> Optional[datetime]:
    if not raw:
        return None
    candidate = raw.strip()
    if candidate.endswith('Z'):
        candidate = candidate[:-1] + '+00:00'
    try:
        return datetime.fromisoformat(candidate)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"{label} invalide: {raw}") from exc


def _fetch_db(
    db: Session,
    *,
    status: Optional[str],
    client: Optional[str],
    limit: int,
    date_from: Optional[datetime],
    date_to: Optional[datetime],
) -> Dict[str, Any]:
    if not _table_exists(db, 'runtime.orch_sessions'):
        return {"items": [], "source": "db"}

    rows = db.execute(
        text(
            """
            SELECT id::text AS id,
                   client,
                   flow_ref,
                   status,
                   COALESCE(current_index, 0) AS current_index,
                   updated_at,
                   created_at
            FROM runtime.orch_sessions
            WHERE (:status IS NULL OR status = :status)
              AND (:client IS NULL OR client = :client)
              AND (:date_from IS NULL OR updated_at >= :date_from)
              AND (:date_to   IS NULL OR updated_at <  :date_to)
            ORDER BY updated_at DESC
            LIMIT :limit
            """
        ),
        {
            "status": status,
            "client": client,
            "date_from": date_from,
            "date_to": date_to,
            "limit": limit,
        },
    ).mappings()

    items: List[Dict[str, Any]] = []
    for row in rows:
        items.append(
            {
                "id": row["id"],
                "client": row["client"],
                "flow_ref": row["flow_ref"],
                "status": row["status"],
                "current_index": int(row["current_index"] or 0),
                "updated_at": _iso_or_none(row["updated_at"]),
                "created_at": _iso_or_none(row["created_at"]),
            }
        )
    return {"items": items, "source": "db"}


def _fetch_orchestrator(
    *,
    status: Optional[str],
    client: Optional[str],
    limit: int,
    date_from: Optional[str],
    date_to: Optional[str],
) -> Dict[str, Any]:
    params: Dict[str, Any] = {"limit": limit}
    if status:
        params["status"] = status
    if client:
        params["client"] = client
    if date_from:
        params["date_from"] = date_from
    if date_to:
        params["date_to"] = date_to

    headers: Dict[str, str] = {}
    if ORCH_API_KEY:
        headers["X-API-Key"] = ORCH_API_KEY

    try:
        response = requests.get(
            f"{ORCH_URL.rstrip('/')}/sessions",
            params=params,
            headers=headers or None,
            timeout=5,
        )
        response.raise_for_status()
    except Exception:
        return {"items": [], "source": "orch"}

    if not response.headers.get('content-type', '').startswith('application/json'):
        return {"items": [], "source": "orch"}

    payload = response.json()
    items: List[Dict[str, Any]] = []
    for session in payload.get("items", []):
        items.append(
            {
                "id": session.get("id") or session.get("session_id"),
                "client": session.get("client"),
                "flow_ref": session.get("flow_ref"),
                "status": session.get("status"),
                "current_index": session.get("current_index", 0),
                "updated_at": session.get("updated_at"),
                "created_at": session.get("created_at"),
            }
        )
    return {"items": items, "source": "orch"}


@router.get('/orch/sessions')
def list_sessions(
    status: Optional[str] = Query(None, pattern='^(running|paused|completed|failed)$'),
    client: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None, description='ISO8601 datetime'),
    date_to: Optional[str] = Query(None, description='ISO8601 datetime'),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    parsed_from = _parse_datetime('date_from', date_from)
    parsed_to = _parse_datetime('date_to', date_to)

    if SESSIONS_SOURCE == 'db':
        return _fetch_db(db, status=status, client=client, limit=limit, date_from=parsed_from, date_to=parsed_to)
    if SESSIONS_SOURCE == 'orch':
        return _fetch_orchestrator(status=status, client=client, limit=limit, date_from=date_from, date_to=date_to)

    db_payload = _fetch_db(db, status=status, client=client, limit=limit, date_from=parsed_from, date_to=parsed_to)
    if db_payload.get('items'):
        return db_payload

    orch_payload = _fetch_orchestrator(status=status, client=client, limit=limit, date_from=date_from, date_to=date_to)
    if orch_payload.get('items'):
        orch_payload['fallback'] = 'orch'
        return orch_payload

    db_payload.setdefault('fallback', 'db')
    return db_payload

