#!/usr/bin/env python3
# db_etape5_check.py — vérifie contraintes, vues et fonctions ajoutées
import os, sys, json, psycopg2

PGUSER=os.environ.get("POSTGRES_USER","arka")
PGPASS=os.environ.get("POSTGRES_PASSWORD","arka")
PGDB  =os.environ.get("POSTGRES_DB","arka")
PGHOST=os.environ.get("POSTGRES_HOST","localhost")
PGPORT=int(os.environ.get("POSTGRES_PORT","5432"))

def main():
    errors=[]
    try:
        conn=psycopg2.connect(dbname=PGDB, user=PGUSER, password=PGPASS, host=PGHOST, port=PGPORT)
    except Exception as e:
        print(json.dumps({"ok": False, "errors": [f"connexion postgres: {e}"]}, ensure_ascii=False, indent=2)); sys.exit(1)

    cur=conn.cursor()

    # Check views
    cur.execute("SELECT 1 FROM pg_views WHERE schemaname='projects' AND viewname='v_project_counters'")
    if cur.fetchone() is None:
        errors.append("vue projects.v_project_counters absente")
    cur.execute("SELECT 1 FROM pg_views WHERE schemaname='projects' AND viewname='v_client_agents'")
    if cur.fetchone() is None:
        errors.append("vue projects.v_client_agents absente")

    # Check agent_refs table
    cur.execute("SELECT 1 FROM information_schema.tables WHERE table_schema='projects' AND table_name='agent_refs'")
    if cur.fetchone() is None:
        errors.append("table projects.agent_refs absente")

    # Check functions
    for fn in ["messages.create_thread","messages.add_participant","messages.post"]:
        cur.execute("SELECT 1 FROM pg_proc JOIN pg_namespace n ON n.oid=pronamespace WHERE n.nspname=%s AND proname=%s", (fn.split('.')[0], fn.split('.')[1]))
        if cur.fetchone() is None:
            errors.append(f"fonction absente: {fn}")

    # Check constraints (presence by name may vary; we rely on behavior)
    cur.execute("SELECT 1 FROM information_schema.check_constraints WHERE constraint_schema='messages' AND constraint_name='chk_messages_author_kind'")
    if cur.fetchone() is None:
        errors.append("contrainte chk_messages_author_kind absente")
    cur.execute("SELECT 1 FROM information_schema.check_constraints WHERE constraint_schema='messages' AND constraint_name='chk_participants_kind'")
    if cur.fetchone() is None:
        errors.append("contrainte chk_participants_kind absente")

    print(json.dumps({"ok": len(errors)==0, "errors": errors}, ensure_ascii=False, indent=2))
    sys.exit(0 if not errors else 1)

if __name__=="__main__":
    main()
