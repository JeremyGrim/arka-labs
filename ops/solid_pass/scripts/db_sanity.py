import os
import psycopg2
from dotenv import load_dotenv

def run_db_sanity():
    load_dotenv()
    host = os.environ.get("DB_HOST","localhost")
    port = int(os.environ.get("DB_PORT","5432"))
    db   = os.environ.get("DB_NAME","arka")
    user = os.environ.get("DB_USER","arka")
    pwd  = os.environ.get("DB_PASSWORD","arka")
    dsn = f"host={host} port={port} dbname={db} user={user} password={pwd}"
    checks = []
    ok_all = True
    try:
        with psycopg2.connect(dsn) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM catalog.flows;")
                flows = cur.fetchone()[0]
                checks.append(("catalog_flows", flows))
                cur.execute("SELECT COUNT(*) FROM routing.intents;")
                intents = cur.fetchone()[0]
                checks.append(("routing_intents", intents))
                try:
                    cur.execute("SELECT project_key,title,threads_count,messages_count FROM projects.v_project_counters ORDER BY last_activity DESC NULLS LAST LIMIT 5;")
                    rows = cur.fetchall()
                    checks.append(("project_counters", len(rows)))
                except Exception as e:
                    checks.append(("project_counters", f"ERR {e.__class__.__name__}"))
                    ok_all = False
    except Exception as e:
        return {"ok": False, "details": f"DB connect error: {e}"}
    # evaluate
    for name, val in checks:
        if isinstance(val, str) and val.startswith("ERR"):
            ok_all = False
    details = "; ".join([f"{n}={v}" for n,v in checks])
    return {"ok": ok_all, "details": details}

if __name__ == "__main__":
    print(run_db_sanity())
