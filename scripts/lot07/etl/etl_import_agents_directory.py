#!/usr/bin/env python3
"""Importe les agents (ARKA_AGENT/clients/*) dans projects.agent_refs."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List

import psycopg2.extras
import yaml

from _db import get_connection


def discover_agents(os_root: Path) -> Dict[str, List[dict]]:
    clients_dir = os_root / "ARKA_AGENT" / "clients"
    result: Dict[str, List[dict]] = {}
    if not clients_dir.exists():
        return result
    for client_dir in sorted(p for p in clients_dir.iterdir() if p.is_dir()):
        client_code = client_dir.name
        agents_dir = client_dir / "agents"
        agents: List[dict] = []
        if not agents_dir.exists():
            result[client_code] = agents
            continue
        for agent_dir in sorted(p for p in agents_dir.iterdir() if p.is_dir()):
            agent_id = agent_dir.name
            onboarding_path = agent_dir / "onboarding.yaml"
            meta_path = agent_dir / "agent.yaml"
            role = None
            if meta_path.exists():
                try:
                    metadata = yaml.safe_load(meta_path.read_text(encoding="utf-8")) or {}
                    role = metadata.get("role") or metadata.get("name")
                except Exception:
                    role = None
            agents.append(
                {
                    "agent_id": agent_id,
                    "role": role,
                    "ref": f"clients/{client_code}/agents/{agent_id}",
                    "onboarding_path": str(onboarding_path),
                }
            )
        result[client_code] = agents
    return result


def upsert_agents(agent_map: Dict[str, List[dict]]) -> Dict[str, int]:
    created_agents = 0
    ensured_clients = 0
    with get_connection() as conn:
        with conn.cursor() as cur:
            for client_code, agents in agent_map.items():
                if not agents:
                    continue
                cur.execute(
                    """
                    INSERT INTO projects.clients(code, name)
                    VALUES (%s, %s)
                    ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
                    RETURNING id
                    """,
                    (client_code, client_code.title()),
                )
                client_id = cur.fetchone()[0]
                ensured_clients += 1
                payload = [
                    {
                        "client_id": client_id,
                        "agent_id": agent["agent_id"],
                        "role": agent["role"],
                        "ref": agent["ref"],
                        "onboarding_path": agent["onboarding_path"],
                    }
                    for agent in agents
                ]
                psycopg2.extras.execute_batch(
                    cur,
                    """
                    INSERT INTO projects.agent_refs(client_id, agent_id, role, ref, onboarding_path)
                    VALUES (%(client_id)s, %(agent_id)s, %(role)s, %(ref)s, %(onboarding_path)s)
                    ON CONFLICT (client_id, agent_id) DO UPDATE
                      SET role = EXCLUDED.role,
                          ref  = EXCLUDED.ref,
                          onboarding_path = EXCLUDED.onboarding_path
                    """,
                    payload,
                )
                created_agents += len(payload)
        conn.commit()
    return {"clients": ensured_clients, "agents": created_agents}


def main() -> None:
    parser = argparse.ArgumentParser(description="Import agents directory vers DB")
    parser.add_argument("os_root", nargs="?", default="./ARKA-OS", help="Racine ARKA_OS")
    args = parser.parse_args()

    os_root = Path(args.os_root).resolve()
    agent_map = discover_agents(os_root)
    summary = upsert_agents(agent_map)
    print(json.dumps(summary))


if __name__ == "__main__":
    main()
