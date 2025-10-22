#!/usr/bin/env python3
# e2e_monolith.py — Parcours E2E réel: Routing -> App -> Postgres (clients/projects/memory/messages)
import os, sys, json, requests, time

APP_PORT = os.environ.get("ARKA_APP_PORT", "8080")
APP_URL = os.environ.get("APP_URL", f"http://localhost:{APP_PORT}/api")

def must_ok(r):
    r.raise_for_status()
    return r.json()

def main():
    errors=[]
    try:
        j = must_ok(requests.get(f"{APP_URL}/healthz", timeout=5))
        if not j.get("ok", False): errors.append("healthz: ok != True")
    except Exception as e:
        errors.append(f"healthz error: {e}")

    # Catalog flows
    try:
        cat = must_ok(requests.get(f"{APP_URL}/catalog", params={"facet":"flow"}, timeout=10))
        flows = cat.get("items", [])
        if not flows:
            errors.append("catalog flows vide"); raise RuntimeError("no flows")
        intent = flows[0].get("intent") or None
    except Exception as e:
        intent=None; errors.append(f"catalog error: {e}")

    # Resolve (fallback term 'rgpd')
    try:
        res = must_ok(requests.get(f"{APP_URL}/resolve", params={"intent": intent} if intent else {"term":"rgpd"}, timeout=10))
        if not res.get("flow_ref"):
            errors.append("resolve: flow_ref manquant")
    except Exception as e:
        errors.append(f"resolve error: {e}")

    # Create/select client
    client_id=None
    try:
        # try create E2E client, else pick first
        c = must_ok(requests.post(f"{APP_URL}/clients", json={"code":"E2E","name":"E2E Client"}, timeout=10))
        client_id = c.get("id")
    except Exception:
        try:
            lst = must_ok(requests.get(f"{APP_URL}/clients", timeout=10))
            if lst:
                client_id = lst[0]["id"]
        except Exception as e:
            errors.append(f"clients error: {e}")

    # Create project
    project_id=None
    if client_id:
        try:
            p = must_ok(requests.post(f"{APP_URL}/projects", json={"client_id": client_id, "key": f"E2E-{int(time.time())}", "title": "E2E Test"}, timeout=10))
            project_id = p.get("id")
        except Exception as e:
            errors.append(f"projects create error: {e}")
    else:
        errors.append("client_id manquant")

    # Memory
    if project_id:
        try:
            m = must_ok(requests.post(f"{APP_URL}/memory", json={"project_id": project_id, "scope":"e2e", "payload":{"ok":True}}, timeout=10))
            if not m.get("id"): errors.append("memory: id manquant")
        except Exception as e:
            errors.append(f"memory error: {e}")

    # Thread + Message
    if project_id:
        try:
            t = must_ok(requests.post(f"{APP_URL}/threads", json={"project_id": project_id, "title":"E2E Thread"}, timeout=10))
            tid = t.get("id")
            if not tid: errors.append("thread: id manquant")
            else:
                msg = must_ok(requests.post(f"{APP_URL}/messages", json={"thread_id": tid, "author_kind":"system", "content":{"msg":"hello"}}, timeout=10))
                if not msg.get("id"): errors.append("message: id manquant")
        except Exception as e:
            errors.append(f"messages error: {e}")

    ok = len(errors)==0
    print(json.dumps({"ok": ok, "errors": errors}, ensure_ascii=False, indent=2))
    sys.exit(0 if ok else 1)

if __name__=="__main__":
    main()
