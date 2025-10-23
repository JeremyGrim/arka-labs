
from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
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


def _to_text(content: object) -> str:
    if isinstance(content, dict):
        for key in ("text", "message", "body", "content"):
            val = content.get(key)
            if isinstance(val, str):
                return val
        return str(content)
    if isinstance(content, list):
        return " ".join(str(part) for part in content)
    if content is None:
        return ""
    return str(content)


@router.get('/meta/recent')
def recent_meta(
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
) -> Dict[str, List[Dict[str, object]]]:
    if not (_table_exists(db, 'messages.messages') and _table_exists(db, 'messages.threads') and _table_exists(db, 'projects.projects')):
        return {'items': []}

    rows = db.execute(
        text(
            """
            SELECT m.id,
                   m.thread_id,
                   p.key AS project_key,
                   t.title,
                   m.author_kind,
                   m.author_ref,
                   m.content,
                   m.created_at
            FROM messages.messages m
            JOIN messages.threads t ON t.id = m.thread_id
            JOIN projects.projects p ON p.id = t.project_id
            ORDER BY m.created_at DESC
            LIMIT :limit
            """
        ),
        {'limit': limit},
    ).mappings()

    items: List[Dict[str, object]] = []
    for row in rows:
        items.append(
            {
                'id': row['id'],
                'kind': 'message',
                'project_key': row['project_key'],
                'thread_id': row['thread_id'],
                'title': row['title'],
                'author_kind': row['author_kind'],
                'author_ref': row['author_ref'],
                'author': row['author_ref'] or row['author_kind'],
                'text': _to_text(row['content']),
                'created_at': _iso(row['created_at']),
                'relpath': f"threads/{row['thread_id']}/messages/{row['id']}",
            }
        )
    return {'items': items}


@router.get('/meta/search')
def search_meta(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
) -> Dict[str, List[Dict[str, object]]]:
    if not (_table_exists(db, 'messages.messages') and _table_exists(db, 'messages.threads') and _table_exists(db, 'projects.projects')):
        return {'items': []}

    pattern = f"%{q.strip()}%"
    rows = db.execute(
        text(
            """
            SELECT m.id,
                   m.thread_id,
                   p.key AS project_key,
                   t.title,
                   m.author_kind,
                   m.author_ref,
                   m.content,
                   m.created_at
            FROM messages.messages m
            JOIN messages.threads t ON t.id = m.thread_id
            JOIN projects.projects p ON p.id = t.project_id
            WHERE CAST(m.content AS TEXT) ILIKE :pattern
               OR COALESCE(t.title, '') ILIKE :pattern
               OR COALESCE(p.key, '') ILIKE :pattern
            ORDER BY m.created_at DESC
            LIMIT :limit
            """
        ),
        {'pattern': pattern, 'limit': limit},
    ).mappings()

    items: List[Dict[str, object]] = []
    for row in rows:
        items.append(
            {
                'id': row['id'],
                'kind': 'message',
                'project_key': row['project_key'],
                'thread_id': row['thread_id'],
                'title': row['title'],
                'author_kind': row['author_kind'],
                'author_ref': row['author_ref'],
                'author': row['author_ref'] or row['author_kind'],
                'text': _to_text(row['content']),
                'created_at': _iso(row['created_at']),
                'relpath': f"threads/{row['thread_id']}/messages/{row['id']}",
            }
        )
    return {'items': items}

