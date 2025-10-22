#!/usr/bin/env python3
# ci/orchestrator_smoke.py — healthz + présence endpoints
import requests, os, sys, json
URL = os.environ.get("ORCH_URL","http://localhost:9092")
def main():
    errors=[]
    try:
        requests.get(f"{URL}/healthz", timeout=5).raise_for_status()
    except Exception as e:
        errors.append(f"healthz: {e}")
    # endpoints round-trip (no flow run)
    try:
        r = requests.get(f"{URL}/openapi.json", timeout=5)
        if r.status_code not in (200,404):  # openapi may be disabled
            errors.append("unexpected openapi status")
    except Exception:
        pass
    print(json.dumps({"ok": len(errors)==0, "errors": errors}, ensure_ascii=False, indent=2))
    sys.exit(0 if not errors else 1)
if __name__=="__main__":
    main()
