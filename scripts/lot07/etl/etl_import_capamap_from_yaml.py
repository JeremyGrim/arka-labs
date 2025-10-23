#!/usr/bin/env python3
"""Importe la capability map YAML vers catalog.domains et catalog.capabilities."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, List, Tuple

import psycopg2.extras
import yaml

from _db import get_connection


def locate_capamap(os_root: Path) -> Path | None:
    bricks_dir = os_root / "ARKA_FLOW" / "bricks"
    if not bricks_dir.exists():
        return None
    for candidate in sorted(bricks_dir.glob("*CAPAMAP*.yaml")):
        try:
            data = yaml.safe_load(candidate.read_text(encoding="utf-8")) or {}
        except Exception:
            continue
        if data.get("capabilities"):
            return candidate
    return None


def parse_capamap(path: Path) -> Tuple[Dict[str, List[str]], Dict[str, List[str]]]:
    payload = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    domains = {
        domain: list((meta or {}).get("tags") or [])
        for domain, meta in (payload.get("domains") or {}).items()
    }
    capabilities = {
        capability: list(agents or [])
        for capability, agents in (payload.get("capabilities") or {}).items()
    }
    return domains, capabilities


def import_domains(domains: Dict[str, List[str]]) -> int:
    if not domains:
        return 0
    with get_connection() as conn:
        with conn.cursor() as cur:
            psycopg2.extras.execute_batch(
                cur,
                """
                INSERT INTO catalog.domains(domain, tags)
                VALUES (%(domain)s, %(tags)s)
                ON CONFLICT (domain) DO UPDATE
                  SET tags = EXCLUDED.tags
                """,
                [
                    {"domain": domain, "tags": tags}
                    for domain, tags in domains.items()
                ],
            )
        conn.commit()
    return len(domains)


def import_capabilities(capabilities: Dict[str, List[str]]) -> int:
    if not capabilities:
        return 0
    with get_connection() as conn:
        with conn.cursor() as cur:
            psycopg2.extras.execute_batch(
                cur,
                """
                INSERT INTO catalog.capabilities(capability, agents)
                VALUES (%(capability)s, %(agents)s)
                ON CONFLICT (capability) DO UPDATE
                  SET agents = EXCLUDED.agents,
                      updated_at = now()
                """,
                [
                    {"capability": capability, "agents": agents}
                    for capability, agents in capabilities.items()
                ],
            )
        conn.commit()
    return len(capabilities)


def main() -> None:
    parser = argparse.ArgumentParser(description="Import capability map vers catalog.*")
    parser.add_argument("os_root", nargs="?", default="./ARKA-OS", help="Racine ARKA_OS")
    args = parser.parse_args()

    os_root = Path(args.os_root).resolve()
    capamap_file = locate_capamap(os_root)
    if not capamap_file:
        print(json.dumps({"imported_domains": 0, "imported_capabilities": 0, "error": "capamap introuvable"}))
        return

    domains, capabilities = parse_capamap(capamap_file)
    summary = {
        "imported_domains": import_domains(domains),
        "imported_capabilities": import_capabilities(capabilities),
        "capamap": str(capamap_file),
    }
    print(json.dumps(summary))


if __name__ == "__main__":
    main()
