import os, json, time
import requests
from dotenv import load_dotenv

def _b():
    return (os.environ.get("API_BASE_URL") or "http://localhost:8080").rstrip("/")

def _hdr():
    h = {"Content-Type":"application/json"}
    k = os.environ.get("API_KEY","").strip()
    if k:
        h["X-API-Key"] = k
    return h

def _get(path, params=None, timeout=None):
    url = _b() + path
    r = requests.get(url, params=params, headers=_hdr(), timeout=timeout or 8)
    return r

def _post(path, body=None, timeout=None):
    url = _b() + path
    r = requests.post(url, json=body or {}, headers=_hdr(), timeout=timeout or 8)
    return r

def run_api_smoke():
    load_dotenv()
    client = os.environ.get("TEST_CLIENT","ACME")
    project_key = os.environ.get("TEST_PROJECT_KEY","ACME-CORE")
    expect_flows = os.environ.get("EXPECT_NONZERO_FLOWS","0") == "1"
    allow_write = os.environ.get("ALLOW_WRITE","0") == "1"

    checks = []
    ok_all = True

    # hp/summary
    try:
        r = _get("/api/hp/summary")
        ok = r.ok and isinstance(r.json(), dict)
        checks.append(("hp/summary", ok, r.status_code))
        ok_all &= ok
    except Exception as e:
        checks.append(("hp/summary", False, str(e))); ok_all=False

    # catalog flows
    try:
        r = _get("/api/catalog", params={"facet":"flow"})
        data = r.json() if r.ok else {}
        ok = r.ok and isinstance(data.get("items",[]), list) and ((len(data.get("items",[]))>0) if expect_flows else True)
        checks.append(("catalog?facet=flow", ok, f"len={len(data.get('items',[])) if r.ok else 'n/a'} code={r.status_code}"))
        ok_all &= ok
    except Exception as e:
        checks.append(("catalog?facet=flow", False, str(e))); ok_all=False

    # agents directory
    try:
        r = _get("/api/agents/directory", params={"client":client})
        data = r.json() if r.ok else {}
        ok = r.ok and isinstance(data.get("agents",[]), list)
        checks.append(("agents/directory", ok, f"len={len(data.get('agents',[])) if r.ok else 'n/a'} code={r.status_code}"))
        ok_all &= ok
    except Exception as e:
        checks.append(("agents/directory", False, str(e))); ok_all=False

    # projects counters
    try:
        r = _get("/api/projects/counters")
        data = r.json() if r.ok else {}
        ok = r.ok and isinstance(data.get("items",[]), list)
        checks.append(("projects/counters", ok, f"len={len(data.get('items',[])) if r.ok else 'n/a'} code={r.status_code}"))
        ok_all &= ok
    except Exception as e:
        checks.append(("projects/counters", False, str(e))); ok_all=False

    # meta recent
    try:
        r = _get("/api/meta/recent", params={"limit":"5"})
        data = r.json() if r.ok else {}
        ok = r.ok and isinstance(data.get("items",[]), list)
        checks.append(("meta/recent", ok, f"len={len(data.get('items',[])) if r.ok else 'n/a'} code={r.status_code}"))
        ok_all &= ok
    except Exception as e:
        checks.append(("meta/recent", False, str(e))); ok_all=False

    # routing resolve
    try:
        r = _get("/api/routing/resolve", params={"term":"rgpd"})
        if r.status_code == 404:
            r = _get("/api/resolve", params={"term":"rgpd"})
        data = r.json() if r.ok else {}
        flow_ref = data.get("flow_ref")
        if not flow_ref and isinstance(data.get("items"), list) and data["items"]:
            flow_ref = data["items"][0].get("flow_ref")
        ok = r.ok and bool(flow_ref)
        checks.append(("routing/resolve?term=rgpd", ok, f"code={r.status_code} flow_ref={flow_ref}"))
        ok_all &= ok
    except Exception as e:
        checks.append(("routing/resolve?term=rgpd", False, str(e))); ok_all=False

    # threads (read)
    try:
        r = _get("/api/threads", params={"project_key":project_key, "limit":"3"})
        data = r.json() if r.ok else {}
        ok = r.ok and isinstance(data.get("items",[]), list)
        checks.append(("threads?project_key", ok, f"len={len(data.get('items',[])) if r.ok else 'n/a'} code={r.status_code}"))
        ok_all &= ok
    except Exception as e:
        checks.append(("threads?project_key", False, str(e))); ok_all=False

    # optional write smoke
    if allow_write:
        try:
            r = _post("/api/threads", {"project_key":project_key, "title":"solid-smoke"})
            ok = r.status_code in (200,201,202)
            checks.append(("POST /api/threads", ok, r.status_code))
            ok_all &= ok
        except Exception as e:
            checks.append(("POST /api/threads", False, str(e))); ok_all=False

    details = "\n".join([f"{name}: {'OK' if ok else 'KO'} ({info})" for (name,ok,info) in checks])
    return {"ok": ok_all, "details": details}

if __name__ == "__main__":
    print(run_api_smoke())
