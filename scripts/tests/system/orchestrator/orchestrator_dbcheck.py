#!/usr/bin/env python3
# ci/orchestrator_dbcheck.py — vérifie tables runtime.orch_*
import os, sys, json, psycopg2
PGUSER=os.environ.get("POSTGRES_USER","arka")
PGPASS=os.environ.get("POSTGRES_PASSWORD","arka")
PGDB=os.environ.get("POSTGRES_DB","arka")
PGHOST=os.environ.get("POSTGRES_HOST","localhost")
PGPORT=int(os.environ.get("POSTGRES_PORT","5432"))
def main():
    errors=[]
    try:
        conn=psycopg2.connect(dbname=PGDB, user=PGUSER, password=PGPASS, host=PGHOST, port=PGPORT)
    except Exception as e:
        print(json.dumps({"ok": False, "errors":[str(e)]}, ensure_ascii=False, indent=2)); sys.exit(1)
    cur=conn.cursor()
    for t in ["runtime.orch_sessions","runtime.orch_steps"]:
        cur.execute("SELECT to_regclass(%s)", (t,))
        if cur.fetchone()[0] is None:
            errors.append(f"table absente: {t}")
    print(json.dumps({"ok": len(errors)==0, "errors": errors}, ensure_ascii=False, indent=2))
    sys.exit(0 if not errors else 1)
if __name__=="__main__":
    main()
