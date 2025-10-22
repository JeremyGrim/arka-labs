#!/usr/bin/env python3
# ci/ui_bff_smoke.py — vérifie BFF /api/orch/healthz puis /api/catalog flows
import os, sys, json, requests
API = os.environ.get("APP_API","http://localhost:8080/api")
def main():
    errors=[]
    try:
        r=requests.get(API+"/orch/healthz", timeout=5); 
        if r.status_code!=200: errors.append(f"orch healthz status {r.status_code}")
    except Exception as e:
        errors.append(f"orch healthz error: {e}")
    try:
        r=requests.get(API+"/catalog", params={"facet":"flow"}, timeout=10); 
        if r.status_code!=200: errors.append(f"catalog status {r.status_code}")
    except Exception as e:
        errors.append(f"catalog error: {e}")
    print(json.dumps({"ok": len(errors)==0, "errors": errors}, ensure_ascii=False, indent=2))
    sys.exit(0 if not errors else 1)
if __name__=="__main__":
    main()
