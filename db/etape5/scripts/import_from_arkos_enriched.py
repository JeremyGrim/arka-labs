#!/usr/bin/env python3
# import_from_arkos_enriched.py — importe clients, projets ET annuaire agents (ref standard) depuis ARKA-OS
import os, sys, yaml, json, re
from pathlib import Path
from urllib.parse import urlparse
import psycopg2

def load_yaml(p: Path):
    try:
        return yaml.safe_load(p.read_text(encoding="utf-8")) or {}
    except Exception:
        return {}

def slugify(s: str) -> str:
    s = s.strip().lower()
    s = re.sub(r'[^a-z0-9]+','-', s).strip('-')
    return s

def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--os-root", default="ARKA-OS", help="racine ARKA-OS")
    ap.add_argument("--pg", default=os.environ.get("DATABASE_URL","postgresql://arka:arka@localhost:5432/arka"))
    ap.add_argument("--default-project-key", default="CORE")
    args = ap.parse_args()

    os_root = Path(args.os_root).resolve()
    agent_root = os_root / "AGENT"
    if not agent_root.exists():
        alt = os_root / "ARKA_AGENT"
        if alt.exists(): agent_root = alt
    clients_root = agent_root / "clients"
    if not clients_root.exists():
        print(json.dumps({"ok": False, "error": f"clients/ introuvable sous {agent_root}"})); sys.exit(1)

    # Connect Postgres
    pg = urlparse(args.pg)
    conn = psycopg2.connect(
        dbname=pg.path.lstrip('/'),
        user=pg.username,
        password=pg.password,
        host=pg.hostname,
        port=pg.port or 5432
    )
    conn.autocommit = True
    cur = conn.cursor()

    created = {"clients":0, "projects":0, "agent_refs":0}
    # Cache clients codes -> id
    def ensure_client(code: str, name: str):
        cur.execute("""INSERT INTO projects.clients(code,name) VALUES (%s,%s)
                       ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name""", (code, name))
        cur.execute("SELECT id FROM projects.clients WHERE code=%s", (code,))
        return cur.fetchone()[0]

    for cdir in sorted([p for p in clients_root.iterdir() if p.is_dir()]):
        cid = cdir.name.upper()
        client_yaml = cdir / "client.yaml"
        meta = load_yaml(client_yaml) if client_yaml.exists() else {}
        code = (meta.get("client") or meta.get("code") or cid).upper()
        name = meta.get("name") or code.title()

        client_id = ensure_client(code, name)
        created["clients"] += 1

        # default project
        pkey = f"{code}-{args.default_project_key}"
        cur.execute("SELECT id FROM projects.projects WHERE key=%s", (pkey,))
        if cur.fetchone() is None:
            cur.execute("""INSERT INTO projects.projects(client_id,key,title) VALUES (%s,%s,%s)""",
                        (client_id, pkey, f"{name} {args.default_project_key}"))
            created["projects"] += 1

        # scan agents directory
        agents_dir = cdir / "agents"
        if agents_dir.exists():
            for od in sorted([p for p in agents_dir.iterdir() if p.is_dir()]):
                agent_id = od.name
                onboarding = od / "onboarding.yaml"
                role = None
                if onboarding.exists():
                    y = load_yaml(onboarding)
                    role = (y.get("role") or "").strip() or None
                ref = f"clients/{code}/agents/{agent_id}"
                onboarding_path = f"ARKA_OS/ARKA_AGENT/clients/{code}/agents/{agent_id}/onboarding.yaml"
                # upsert agent_ref
                cur.execute("""
                    INSERT INTO projects.agent_refs(client_id, agent_id, role, ref, onboarding_path)
                    VALUES (%s,%s,%s,%s,%s)
                    ON CONFLICT (client_id, agent_id) DO UPDATE 
                    SET role=EXCLUDED.role, ref=EXCLUDED.ref, onboarding_path=EXCLUDED.onboarding_path
                """, (client_id, agent_id, role, ref, onboarding_path))
                created["agent_refs"] += 1

    print(json.dumps({"ok": True, "created": created}, ensure_ascii=False))

if __name__=="__main__":
    main()
