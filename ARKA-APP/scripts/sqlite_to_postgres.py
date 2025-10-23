#!/usr/bin/env python3
"""Bridge (optionnel) de données de l'app v0.1 (SQLite) vers Postgres.
- Clients → projects.clients(code,name)
- Projets (si table connue) → projects.projects
Utilisation :
  python scripts/sqlite_to_postgres.py --sqlite /path/arka.sqlite --pg postgresql://arka:arka@localhost:5432/arka
"""
import argparse, sqlite3, sys
from urllib.parse import urlparse
import psycopg2

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sqlite", required=True)
    ap.add_argument("--pg", required=True, help="postgresql://user:pass@host:port/db")
    args = ap.parse_args()

    # Open SQLite
    con = sqlite3.connect(args.sqlite)
    cur = con.cursor()

    # Detect simple client table (example: settings or organizations)
    # Adjust here based on your v0.1 schema; default: none
    # Example fallback: no-op
    try:
        cur.execute("SELECT code,name FROM clients")
        rows = cur.fetchall()
        print(f"[sqlite] clients rows: {len(rows)}")
    except sqlite3.OperationalError:
        print("[sqlite] table 'clients' introuvable — script à adapter selon ton schéma v0.1.")
        rows = []

    # Open Postgres
    pg = urlparse(args.pg)
    conn = psycopg2.connect(
        dbname=pg.path.lstrip('/'),
        user=pg.username,
        password=pg.password,
        host=pg.hostname,
        port=pg.port or 5432
    )
    conn.autocommit = True
    pc = conn.cursor()

    # Upsert basic clients
    for code, name in rows:
        pc.execute("""INSERT INTO projects.clients(code,name)
                      VALUES (%s,%s)
                      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name""", (code, name))
        print(f"[pg] upsert client {code} -> {name}")

    print("Done.")

if __name__ == "__main__":
    main()
