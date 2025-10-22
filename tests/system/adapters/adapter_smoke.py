#!/usr/bin/env python3
# ci/adapter_smoke.py — healthz + erreurs de config lisibles
import os, sys, json, requests

def check(base):
    errors=[]
    try:
        r=requests.get(f"{base}/healthz", timeout=5); r.raise_for_status()
    except Exception as e:
        errors.append(f"healthz {base}: {e}")
    # misconfigured /invoke should return 400
    try:
        r=requests.post(f"{base}/invoke", json={"provider":"codex","operation":"chat","input":{}}, timeout=10)
        if r.status_code!=400:
            errors.append(f"invoke {base}: expected 400 when misconfigured, got {r.status_code}")
    except Exception as e:
        errors.append(f"invoke {base}: {e}")
    return errors

def main():
    codex = os.environ.get("ADAPTER_CODEX_URL","http://localhost:9093")
    openai = os.environ.get("ADAPTER_OPENAI_URL","http://localhost:9094")
    errors = []
    errors += check(codex)
    errors += check(openai)
    print(json.dumps({"ok": len(errors)==0, "errors": errors}, ensure_ascii=False, indent=2))
    sys.exit(0 if not errors else 1)

if __name__=="__main__":
    main()
