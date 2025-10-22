#!/usr/bin/env python3
# schema_check.py — contrôle schémas & tables Postgres Étape 3
import os, sys, json, psycopg2

PGUSER=os.environ.get("POSTGRES_USER","arka")
PGPASS=os.environ.get("POSTGRES_PASSWORD","arka")
PGDB  =os.environ.get("POSTGRES_DB","arka")
PGHOST=os.environ.get("POSTGRES_HOST","localhost")
PGPORT=int(os.environ.get("POSTGRES_PORT","5432"))

REQUIRED = {
    "projects": ["clients","projects","project_profiles"],
    "memory":   ["memories"],
    "messages": ["threads","participants","messages"]
}

def main():
    errors=[]
    try:
        conn=psycopg2.connect(dbname=PGDB, user=PGUSER, password=PGPASS, host=PGHOST, port=PGPORT)
    except Exception as e:
        print(json.dumps({"ok": False, "errors": [f"connexion postgres: {e}"]}, ensure_ascii=False, indent=2)); sys.exit(1)

    cur=conn.cursor()
    for schema, tables in REQUIRED.items():
        for t in tables:
            cur.execute("SELECT to_regclass(%s)", (f"{schema}.{t}",))
            present = cur.fetchone()[0] is not None
            if not present:
                errors.append(f"table manquante: {schema}.{t}")

    print(json.dumps({"ok": len(errors)==0, "errors": errors}, ensure_ascii=False, indent=2))
    sys.exit(0 if not errors else 1)

if __name__=="__main__":
    main()
