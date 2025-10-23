#!/usr/bin/env python3
# import_from_arkos.py — importe clients & projets depuis ARKA_OS/ARKA_AGENT/clients/* into Postgres
import os, sys, yaml, json, re
from pathlib import Path
from urllib.parse import urlparse
import psycopg2

def slugify(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r'[^a-z0-9]+','-', s).strip('-')
    return s

def load_yaml(p: Path):
    try:
        return yaml.safe_load(p.read_text(encoding="utf-8")) or {}
    except Exception:
        return {}

def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--os-root", default="ARKA-OS", help="racine ARKA-OS (contient ARKA_AGENT)")
    ap.add_argument("--pg", default=os.environ.get("DATABASE_URL","postgresql://arka:arka@localhost:5432/arka"))
    ap.add_argument("--default-project-key", default="CORE")
    args = ap.parse_args()

    os_root = Path(args.os_root).resolve()
    agent_root = os_root / "AGENT"  # ARKA-OS/AGENT
    if not agent_root.exists():
        alt = os_root / "ARKA_AGENT"
        if alt.exists(): agent_root = alt
    clients_root = agent_root / "clients"
    if not clients_root.exists():
        print(json.dumps({"ok": False, "error": f"clients/ introuvable sous {agent_root}"})); sys.exit(1)

    # Connect Postgres
    pg = urlparse(args.pg)
    import psycopg2
    conn = psycopg2.connect(
        dbname=pg.path.lstrip('/'),
        user=pg.username,
        password=pg.password,
        host=pg.hostname,
        port=pg.port or 5432
    )
    conn.autocommit = True
    cur = conn.cursor()

    created = {"clients":0, "projects":0}
    for cdir in sorted([p for p in clients_root.iterdir() if p.is_dir()]):
        cid = cdir.name.upper()
        client_yaml = cdir / "client.yaml"
        meta = load_yaml(client_yaml) if client_yaml.exists() else {}
        code = meta.get("client") or meta.get("code") or cid
        name = meta.get("name") or cid.title()

        # upsert client
        cur.execute("""
            INSERT INTO projects.clients(code,name)
            VALUES (%s,%s)
            ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name
            RETURNING id
        """, (code, name))
        row = cur.fetchone()
        cur.execute("SELECT id FROM projects.clients WHERE code=%s", (code,))
        row = cur.fetchone()
        client_id = row[0]

        # default project (if none exists with same key)
        pkey = f"{code}-{args.default_project_key}"
        cur.execute("SELECT id FROM projects.projects WHERE key=%s", (pkey,))
        if cur.fetchone() is None:
            cur.execute("""
                INSERT INTO projects.projects(client_id, key, title)
                VALUES (%s,%s,%s)
                RETURNING id
            """, (client_id, pkey, f"{name} {args.default_project_key}"))
            created["projects"] += 1

        created["clients"] += 1

    print(json.dumps({"ok": True, "created": created}, ensure_ascii=False))

if __name__=="__main__":
    main()
