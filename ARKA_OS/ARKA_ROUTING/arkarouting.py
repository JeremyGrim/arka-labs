#!/usr/bin/env python3
"""
Mini implémentation ARKA_ROUTING pour l'environnement sandbox.

Cette version charge les flows depuis `ARKA_OS/ARKA_FLOW/bricks/*.yaml` et expose
les endpoints essentiels (`/catalog`, `/lookup`, `/resolve`) afin que les tests
terrain (T1) disposent d'un GPS fonctionnel.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, asdict
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import parse_qs, urlparse

import yaml


@dataclass(slots=True)
class FlowItem:
    flow_ref: str
    brick: str
    name: str
    title: str
    tags: List[str]

    def to_json(self) -> Dict[str, Any]:
        return asdict(self)


def _load_flows() -> List[FlowItem]:
    root = Path(__file__).resolve().parent.parent  # ARKA_OS
    bricks_dir = root / "ARKA_FLOW" / "bricks"
    flows: List[FlowItem] = []
    if not bricks_dir.exists():
        return flows
    for yaml_file in sorted(bricks_dir.glob("*.yaml")):
        try:
            data = yaml.safe_load(yaml_file.read_text(encoding="utf-8")) or {}
        except Exception:
            continue  # Ignore fichiers illisibles
        brick_id = data.get("id") or yaml_file.stem
        for name, flow in (data.get("flows") or {}).items():
            title = flow.get("title") or name.replace("_", " ").title()
            tags = flow.get("tags") or []
            flows.append(
                FlowItem(
                    flow_ref=f"{brick_id}:{name}",
                    brick=brick_id,
                    name=name,
                    title=title,
                    tags=tags,
                )
            )
    return flows


FLOWS: List[FlowItem] = _load_flows()


def _normalize(token: str | None) -> str:
    if not token:
        return ""
    return "".join(ch for ch in token.lower() if ch.isalnum())


def _lookup_flows(term: str) -> List[FlowItem]:
    if not term:
        return []
    needle = _normalize(term)
    if not needle:
        return []
    results: List[FlowItem] = []
    for flow in FLOWS:
        haystack = {
            _normalize(flow.name),
            _normalize(flow.title),
            _normalize(flow.flow_ref),
        }
        if any(needle in target or target in needle for target in haystack if target):
            results.append(flow)
    return results


def _resolve_flow(intent: Optional[str], term: Optional[str]) -> Optional[FlowItem]:
    candidates = []
    if intent:
        segments = [_normalize(intent), _normalize(intent.split(":", 1)[-1])]
        candidates.extend(filter(None, segments))
    if term:
        candidates.append(_normalize(term))
    for cand in candidates:
        if not cand:
            continue
        for flow in FLOWS:
            targets = {
                _normalize(flow.name),
                _normalize(flow.title),
                _normalize(flow.flow_ref),
            }
            if cand in targets or any(cand in t for t in targets if t):
                return flow
    return FLOWS[0] if FLOWS else None


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="arkarouting", description="Mini ARKA_ROUTING server.")
    subparsers = parser.add_subparsers(dest="command")
    serve_parser = subparsers.add_parser("serve", help="Lance le serveur HTTP.")
    serve_parser.add_argument("--host", default="0.0.0.0", help="Adresse d'écoute (defaut: 0.0.0.0).")
    serve_parser.add_argument("--port", type=int, default=8087, help="Port d'écoute (defaut: 8087).")
    for cmd in ("catalog", "lookup", "resolve"):
        subparsers.add_parser(cmd, help=f"Commande {cmd} (répond en JSON).")
    return parser


class _RoutingHandler(BaseHTTPRequestHandler):
    server_version = "ARKARouting/0.1"

    def log_message(self, format: str, *args: Any) -> None:  # noqa: D401
        """Réduit le bruit des logs http.server."""
        return

    def _send_json(self, payload: Dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status.value)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        if parsed.path == "/ping":
            self._send_json({"ok": True, "flows": len(FLOWS)})
            return

        if parsed.path == "/catalog":
            facet = params.get("facet", ["flow"])[0]
            if facet not in ("flow", "flows", None):
                self._send_json({"ok": False, "error": f"facet {facet} non supporté"}, HTTPStatus.BAD_REQUEST)
                return
            items = [f.to_json() for f in FLOWS]
            self._send_json({"ok": True, "items": items})
            return

        if parsed.path == "/lookup":
            term = params.get("term", [""])[0]
            results = [f.to_json() for f in _lookup_flows(term)]
            self._send_json({"ok": True, "items": results, "count": len(results)})
            return

        if parsed.path == "/resolve":
            intent = params.get("intent", [None])[0]
            term = params.get("term", [None])[0]
            flow = _resolve_flow(intent, term)
            if not flow:
                self._send_json({"ok": False, "error": "Aucun flow trouvé"}, HTTPStatus.NOT_FOUND)
            else:
                self._send_json({"ok": True, "flow": flow.to_json()})
            return

        self._send_json({"ok": False, "error": f"endpoint inconnu: {parsed.path}"}, HTTPStatus.NOT_FOUND)


def _serve(host: str, port: int) -> None:
    with ThreadingHTTPServer((host, port), _RoutingHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass


def _command_catalog() -> int:
    print(json.dumps({"ok": True, "items": [f.to_json() for f in FLOWS]}, ensure_ascii=False, indent=2))
    return 0


def _command_lookup() -> int:
    print(json.dumps({"ok": True, "items": [f.to_json() for f in FLOWS]}, ensure_ascii=False, indent=2))
    return 0


def _command_resolve() -> int:
    flow = _resolve_flow(None, None)
    if not flow:
        print(json.dumps({"ok": False, "error": "Aucun flow"}, ensure_ascii=False))
        return 1
    print(json.dumps({"ok": True, "flow": flow.to_json()}, ensure_ascii=False, indent=2))
    return 0


def main(argv: Optional[List[str]] = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    if args.command == "serve":
        _serve(args.host, args.port)
        return 0
    if args.command == "catalog":
        return _command_catalog()
    if args.command == "lookup":
        return _command_lookup()
    if args.command == "resolve":
        return _command_resolve()

    parser.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())
