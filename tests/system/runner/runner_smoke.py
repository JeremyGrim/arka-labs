#!/usr/bin/env python3
# ci/runner_smoke.py — vérifie healthz et erreurs configurées proprement
import os, sys, json, requests, time, uuid

RUNNER_URL = os.environ.get("RUNNER_URL", "http://localhost:9091")

def main():
    errors=[]
    try:
        r = requests.get(f"{RUNNER_URL}/healthz", timeout=5); r.raise_for_status()
    except Exception as e:
        errors.append(f"healthz error: {e}")

    # session create minimal
    sid = str(uuid.uuid4())
    try:
        r = requests.post(f"{RUNNER_URL}/runner/session", json={"client":"ACME","flow_ref":"DUMMY"}, timeout=10)
        if r.status_code not in (200,201):
            errors.append(f"session create status {r.status_code}: {r.text[:200]}")
    except Exception as e:
        errors.append(f"session create error: {e}")

    print(json.dumps({"ok": len(errors)==0, "errors": errors}, ensure_ascii=False, indent=2))
    sys.exit(0 if not errors else 1)

if __name__=="__main__":
    main()
