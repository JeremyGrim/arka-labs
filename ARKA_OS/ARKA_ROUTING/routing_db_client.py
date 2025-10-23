"""Client DB pour ARKA_ROUTING — résolution intents -> flows."""
from __future__ import annotations

import os
from contextlib import closing
from typing import List

import psycopg2


def _connection() -> psycopg2.extensions.connection:
    return psycopg2.connect(
        dbname=os.environ.get("POSTGRES_DB", "arka"),
        user=os.environ.get("POSTGRES_USER", "arka"),
        password=os.environ.get("POSTGRES_PASSWORD", "arka"),
        host=os.environ.get("POSTGRES_HOST", "localhost"),
        port=int(os.environ.get("POSTGRES_PORT", "5432")),
    )


def resolve_db(term: str | None = None, intent: str | None = None) -> List[dict]:
    with closing(_connection()) as conn, conn.cursor() as cur:
        if intent:
            cur.execute(
                """
                SELECT i.intent, i.flow_ref, f.name, f.tags
                FROM routing.intents i
                JOIN catalog.flows f ON f.flow_ref = i.flow_ref
                WHERE i.intent = %s
                LIMIT 1
                """,
                (intent,),
            )
            row = cur.fetchone()
            if row:
                intent, flow_ref, name, tags = row
                return [{"intent": intent, "flow_ref": flow_ref, "name": name, "tags": tags}]
        pattern = f"%{term}%" if term else None
        params = []
        query = (
            """
            SELECT i.intent, i.flow_ref, f.name, f.tags
            FROM routing.intents i
            JOIN catalog.flows f ON f.flow_ref = i.flow_ref
            """
        )
        if pattern:
            query += (
                " WHERE i.intent ILIKE %s"
                "    OR f.name ILIKE %s"
                "    OR %s = ANY(COALESCE(f.tags, ARRAY[]::TEXT[]))"
            )
            params.extend([pattern, pattern, term])
        query += " ORDER BY i.weight DESC, f.updated_at DESC LIMIT 50"
        cur.execute(query, params)
        rows = cur.fetchall()
    return [
        {"intent": intent, "flow_ref": flow_ref, "name": name, "tags": tags}
        for intent, flow_ref, name, tags in rows
    ]
