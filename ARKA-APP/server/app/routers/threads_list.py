from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.deps.db import get_db


router = APIRouter()


def _table_exists(db: Session, regclass: str) -> bool:
    return bool(db.execute(text("SELECT to_regclass(:name)"), {"name": regclass}).scalar())


def _iso(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


@router.get('/threads')
def list_threads(
    project_key: Optional[str] = Query(None, description='clé projet (ex: ACME-CORE)'),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> Dict[str, List[Dict[str, Optional[str]]]]:
    if not _table_exists(db, 'messages.threads'):
        return {'items': []}
    if not _table_exists(db, 'projects.projects'):
        return {'items': []}

    rows = db.execute(
        text(
            """
            SELECT t.id        AS thread_id,
                   p.key       AS project_key,
                   t.title     AS title,
                   COALESCE(MAX(m.created_at), t.created_at) AS last_activity
            FROM messages.threads t
            JOIN projects.projects p ON p.id = t.project_id
            LEFT JOIN messages.messages m ON m.thread_id = t.id
            WHERE (:project_key IS NULL OR p.key = :project_key)
            GROUP BY t.id, p.key, t.title, t.created_at
            ORDER BY last_activity DESC NULLS LAST
            LIMIT :limit
            """
        ),
        {"project_key": project_key, "limit": limit},
    ).mappings()

    items: List[Dict[str, Optional[str]]] = []
    for row in rows:
        items.append(
            {
                'thread_id': row['thread_id'],
                'project_key': row['project_key'],
                'title': row['title'],
                'last_activity': _iso(row['last_activity']),
            }
        )
    return {'items': items}

