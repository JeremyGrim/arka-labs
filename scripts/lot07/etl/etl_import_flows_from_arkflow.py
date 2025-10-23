#!/usr/bin/env python3
"""Importe les flows ARKA_FLOW (YAML) vers catalog.flows + routing.intents."""
from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List

import psycopg2.extras
import yaml

from _db import get_connection


@dataclass
class FlowRecord:
    flow_ref: str
    brick: str
    export: str
    intent: str | None
    name: str
    tags: List[str]
    family: str | None


def load_manifest_map(os_root: Path) -> dict[str, dict]:
    manifest = os_root / "ARKA_FLOW" / "bricks" / "ARKFLOW-00-MANIFEST.yaml"
    if not manifest.exists():
        return {}
    try:
        payload = yaml.safe_load(manifest.read_text(encoding="utf-8")) or {}
    except Exception:  # pragma: no cover
        return {}
    catalog = payload.get("workflows_catalog") or []
    result: dict[str, dict] = {}
    for entry in catalog:
        flow_ref = entry.get("flow_ref")
        if not flow_ref:
            continue
        result[flow_ref] = {
            "intent": entry.get("intent"),
            "name": entry.get("title") or entry.get("intent"),
            "family": entry.get("family"),
        }
    return result


def load_flows(os_root: Path, manifest: dict[str, dict]) -> Iterable[FlowRecord]:
    bricks_root = os_root / "ARKA_FLOW" / "bricks"
    if not bricks_root.exists():
        return []
    records: list[FlowRecord] = []
    for yaml_file in sorted(bricks_root.glob("*.yaml")):
        if yaml_file.name == "ARKFLOW-00-MANIFEST.yaml":
            continue
        try:
            payload = yaml.safe_load(yaml_file.read_text(encoding="utf-8")) or {}
        except Exception as exc:
            print(json.dumps({"warn": "yaml_error", "file": str(yaml_file), "error": str(exc)}))
            continue
        brick = payload.get("id") or yaml_file.stem
        exports = payload.get("flows") or payload.get("workflows") or {}
        for export_name, content in exports.items():
            flow_ref = f"{brick}:{export_name}"
            manifest_entry = manifest.get(flow_ref, {})
            friendly_name = (
                manifest_entry.get("name")
                or content.get("title")
                or content.get("name")
                or export_name
            )
            record = FlowRecord(
                flow_ref=flow_ref,
                brick=brick,
                export=export_name,
                intent=manifest_entry.get("intent") or content.get("intent"),
                name=friendly_name,
                tags=list(content.get("tags") or []),
                family=manifest_entry.get("family"),
            )
            records.append(record)
    return records


def upsert_flows(os_root: Path) -> dict:
    manifest = load_manifest_map(os_root)
    records = list(load_flows(os_root, manifest))
    with get_connection() as conn:
        with conn.cursor() as cur:
            psycopg2.extras.execute_batch(
                cur,
                """
                INSERT INTO catalog.flows(flow_ref, brick, export, intent, name, tags, family)
                VALUES (%(flow_ref)s, %(brick)s, %(export)s, %(intent)s, %(name)s, %(tags)s, %(family)s)
                ON CONFLICT (flow_ref) DO UPDATE
                  SET intent = EXCLUDED.intent,
                      name   = EXCLUDED.name,
                      tags   = EXCLUDED.tags,
                      family = EXCLUDED.family,
                      updated_at = now()
                """,
                [record.__dict__ for record in records],
            )
            intents_payload = [r for r in records if r.intent]
            if intents_payload:
                psycopg2.extras.execute_batch(
                    cur,
                    """
                    INSERT INTO routing.intents(intent, flow_ref, weight)
                    VALUES (%(intent)s, %(flow_ref)s, 100)
                    ON CONFLICT (intent) DO UPDATE
                      SET flow_ref = EXCLUDED.flow_ref,
                          updated_at = now()
                    """,
                    [
                        {"intent": r.intent, "flow_ref": r.flow_ref}
                        for r in intents_payload
                    ],
                )
        conn.commit()
    return {
        "imported": len(records),
        "with_intent": len([r for r in records if r.intent]),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Import flows YAML -> catalog.flows")
    parser.add_argument("os_root", nargs="?", default="./ARKA-OS", help="Racine ARKA_OS")
    args = parser.parse_args()

    summary = upsert_flows(Path(args.os_root).resolve())
    print(json.dumps(summary))


if __name__ == "__main__":
    main()
