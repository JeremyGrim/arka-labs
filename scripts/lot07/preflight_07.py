#!/usr/bin/env python3
"""Préflight LOT_07 : vérifie schémas/tables et endpoints BFF."""
from __future__ import annotations

import json
import os
from contextlib import closing

import psycopg2
import requests

CHECK_TABLES = (
    "catalog.flows",
    "catalog.capabilities",
    "catalog.domains",
    "routing.intents",
    "projects.agent_refs",
)


def get_connection() -> psycopg2.extensions.connection:
    return psycopg2.connect(
        dbname=os.environ.get("POSTGRES_DB", "arka"),
        user=os.environ.get("POSTGRES_USER", "arka"),
        password=os.environ.get("POSTGRES_PASSWORD", "arka"),
        host=os.environ.get("POSTGRES_HOST", "localhost"),
        port=int(os.environ.get("POSTGRES_PORT", "5432")),
    )


def check_db() -> tuple[list[str], list[str]]:
    errors: list[str] = []
    info: list[str] = []
    try:
        with closing(get_connection()) as conn, conn.cursor() as cur:
            for table in CHECK_TABLES:
                cur.execute("SELECT to_regclass(%s)", (table,))
                if cur.fetchone()[0] is None:
                    errors.append(f"table absente: {table}")
            cur.execute("SELECT count(*) FROM catalog.flows")
            info.append(f"flows={cur.fetchone()[0]}")
            cur.execute("SELECT count(*) FROM routing.intents")
            info.append(f"intents={cur.fetchone()[0]}")
            cur.execute("SELECT count(*) FROM projects.agent_refs")
            info.append(f"agent_refs={cur.fetchone()[0]}")
    except Exception as exc:  # pragma: no cover
        errors.append(f"DB error: {exc}")
    return errors, info


def check_api() -> list[str]:
    info: list[str] = []
    base_url = os.environ.get("APP_API", "http://localhost:8080/api")
    try:
        resp = requests.get(
            f"{base_url}/catalog",
            params={"facet": "flow", "grep": "audit"},
            timeout=5,
        )
        resp.raise_for_status()
        info.append(f"catalog_items={len(resp.json().get('items', []))}")
    except Exception as exc:  # pragma: no cover
        info.append(f"catalog not tested: {exc}")
    return info


def main() -> None:
    errors, info = check_db()
    info.extend(check_api())
    print(json.dumps({"ok": not errors, "errors": errors, "info": info}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
