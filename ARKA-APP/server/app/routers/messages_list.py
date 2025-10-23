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


def _extract_text(content: object) -> str:
    if isinstance(content, dict):
        for key in ('text', 'message', 'body', 'content'):
            val = content.get(key)
            if isinstance(val, str):
                return val
        return str(content)
    if isinstance(content, list):
        return ' '.join(str(part) for part in content)
    if content is None:
        return ''
    return str(content)


@router.get('/messages')
def list_messages(
    thread_id: int = Query(..., ge=1),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> Dict[str, List[Dict[str, Optional[str]]]]:
    if not _table_exists(db, 'messages.messages'):
        return {'items': []}

    rows = db.execute(
        text(
            """
            SELECT id,
                   thread_id,
                   author_kind,
                   author_ref,
                   content,
                   created_at
            FROM messages.messages
            WHERE thread_id = :thread_id
            ORDER BY created_at DESC
            LIMIT :limit
            """
        ),
        {'thread_id': thread_id, 'limit': limit},
    ).mappings()

    items: List[Dict[str, Optional[str]]] = []
    for row in rows:
        items.append(
            {
                'id': row['id'],
                'thread_id': row['thread_id'],
                'author_kind': row['author_kind'],
                'author_ref': row['author_ref'],
                'author': row['author_ref'] or row['author_kind'],
                'text': _extract_text(row['content']),
                'created_at': _iso(row['created_at']),
            }
        )
    return {'items': items}

