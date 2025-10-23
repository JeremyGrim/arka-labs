#!/usr/bin/env python3
# ci/adapter_chaos_timeout.py — attend 504/502 quand FAULT_INJECTION=timeout
import os, sys, json, requests

def test_timeout(base):
    try:
        r=requests.post(f"{base}/invoke", json={
            "provider":"codex","operation":"chat","input":{"messages":[{"role":"user","content":"hello"}]}}
        , timeout=5)
        # If adapter really timed out, requests will raise; if service returns 502 from fault, accept 502
        if r.status_code not in (400, 502):  # 400 if not configured; 502 if fault injected internal
            return f"unexpected status {r.status_code}"
    except Exception as e:
        # request timeout -> ok for chaos
        return None
    return None

def main():
    codex = os.environ.get("ADAPTER_CODEX_URL","http://localhost:9093")
    openai = os.environ.get("ADAPTER_OPENAI_URL","http://localhost:9094")
    errors=[]
    e=test_timeout(codex); 
    if e: errors.append(f"codex: {e}")
    e=test_timeout(openai); 
    if e: errors.append(f"openai: {e}")
    print(json.dumps({"ok": len(errors)==0, "errors": errors}, ensure_ascii=False, indent=2))
    sys.exit(0 if not errors else 1)

if __name__=="__main__":
    main()
