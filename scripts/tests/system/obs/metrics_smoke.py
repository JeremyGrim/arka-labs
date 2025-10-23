#!/usr/bin/env python3
# ci/metrics_smoke.py — vérifie l'exposition /metrics pour Runner & Orchestrator
import requests, json, os, sys

RUNNER=os.environ.get("RUNNER_URL","http://localhost:9091")
ORCH=os.environ.get("ORCH_URL","http://localhost:9092")

def check(url):
    r=requests.get(url+"/metrics", timeout=5)
    r.raise_for_status()
    txt=r.text
    want=["_http_request_seconds","process_start_time_seconds"]
    return all(any(w in line for line in txt.splitlines()) for w in want)

def main():
    errors=[]
    try:
        if not check(RUNNER): errors.append("runner metrics missing expected keys")
    except Exception as e:
        errors.append("runner metrics error: "+str(e))
    try:
        if not check(ORCH): errors.append("orch metrics missing expected keys")
    except Exception as e:
        errors.append("orch metrics error: "+str(e))
    print(json.dumps({"ok":len(errors)==0, "errors":errors}, ensure_ascii=False, indent=2))
    sys.exit(0 if not errors else 1)

if __name__=="__main__":
    main()
