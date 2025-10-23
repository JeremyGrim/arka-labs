
from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends
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


@router.get('/hp/summary')
def hp_summary(db: Session = Depends(get_db)) -> Dict[str, object]:
    summary: Dict[str, object] = {
        'tagline': 'ARKA-LABS — activity overview',
        'actions': [],
        'validations': {'delivery': 0, 'architecture': 0},
        'last_activity': None,
        'journal': [],
    }

    # Active sessions / totals
    if _table_exists(db, 'runtime.orch_sessions'):
        counts = db.execute(
            text(
                """
                SELECT COUNT(*) FILTER (WHERE status IN ('running','gated')) AS active,
                       COUNT(*) AS total
                FROM runtime.orch_sessions
                """
            )
        ).mappings().first() or {'active': 0, 'total': 0}
        summary['actions'].append(
            {
                'label': 'Sessions actives',
                'value': int(counts['active'] or 0),
                'total': int(counts['total'] or 0),
                'target': '/session'
            }
        )

        # Last update on sessions for activity timestamp
        last_session = db.execute(
            text("SELECT updated_at FROM runtime.orch_sessions ORDER BY updated_at DESC LIMIT 1")
        ).scalar()
        summary['last_activity'] = _iso(last_session)
    else:
        summary['actions'].append({'label': 'Sessions actives', 'value': 0, 'total': 0, 'target': '/session'})

    # Catalog size
    if _table_exists(db, 'catalog.flows'):
        flows_count = db.execute(text("SELECT COUNT(*) FROM catalog.flows")).scalar()
        summary['actions'].append({'label': 'Flows publiés', 'value': int(flows_count or 0), 'target': '/flows'})
    else:
        summary['actions'].append({'label': 'Flows publiés', 'value': 0, 'target': '/flows'})

    # Gate validations
    if _table_exists(db, 'runtime.orch_steps'):
        gate_counts = db.execute(
            text(
                """
                SELECT gate,
                       COUNT(*) FILTER (WHERE status = 'completed') AS completed
                FROM runtime.orch_steps
                WHERE gate IS NOT NULL
                GROUP BY gate
                """
            )
        ).mappings()
        for row in gate_counts:
            gate = (row['gate'] or '').upper()
            if gate == 'AGP':
                summary['validations']['delivery'] = int(row['completed'] or 0)
            elif gate in ('ARCHIVISTE', 'ARCHI', 'ARCH'):  # tolerate variations
                summary['validations']['architecture'] = int(row['completed'] or 0)

    # Journal (recent events)
    journal: List[Dict[str, object]] = []
    if _table_exists(db, 'messages.messages') and _table_exists(db, 'messages.threads') and _table_exists(db, 'projects.projects'):
        rows = list(
            db.execute(
                text(
                    """
                    SELECT m.created_at,
                           p.key AS project_key,
                           COALESCE(t.title, 'Thread #' || m.thread_id) AS title,
                           m.author_kind,
                           m.author_ref
                    FROM messages.messages m
                    JOIN messages.threads t ON t.id = m.thread_id
                    JOIN projects.projects p ON p.id = t.project_id
                    ORDER BY m.created_at DESC
                    LIMIT 8
                    """
                    )
                ).mappings()
        )
        for row in rows:
            journal.append(
                {
                    'timestamp': _iso(row['created_at']),
                    'text': f"{row['project_key']} · {row['title']} — {row['author_ref'] or row['author_kind']}"
                }
            )
        if rows:
            summary['last_activity'] = summary['last_activity'] or _iso(rows[0]['created_at'])

    summary['journal'] = journal
    if summary['last_activity'] is None:
        summary['last_activity'] = _iso(datetime.now(timezone.utc))

    return summary
