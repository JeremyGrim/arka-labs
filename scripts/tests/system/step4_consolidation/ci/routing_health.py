#!/usr/bin/env python3
# routing_health.py — vérifie ARKA_ROUTING (ping, catalog, resolve)
import os, sys, json, requests

ROUTING_URL = os.environ.get("ROUTING_URL", f"http://localhost:{os.environ.get('ARKA_ROUTING_PORT','8087')}")

def main():
    errors = []
    try:
        r = requests.get(f"{ROUTING_URL}/ping", timeout=5); r.raise_for_status()
        ping = r.json()
        if not ping.get("ok"): errors.append("ping.ok != True")
    except Exception as e:
        errors.append(f"ping error: {e}")

    try:
        r = requests.get(f"{ROUTING_URL}/catalog", params={"facet":"flow"}, timeout=10); r.raise_for_status()
        flows = r.json().get("items", [])
        if not flows:
            errors.append("catalog(facet=flow) vide")
    except Exception as e:
        errors.append(f"catalog error: {e}")

    # Try a resolve with a common term; fallback to first flow's intent
    intent = None
    try:
        r = requests.get(f"{ROUTING_URL}/lookup", params={"term":"rgpd"}, timeout=10); r.raise_for_status()
        intent = r.json().get("intent")
    except Exception:
        pass

    if not intent:
        # try derive from manifest by pulling flow catalog
        try:
            r = requests.get(f"{ROUTING_URL}/catalog", params={"facet":"flow"}, timeout=10); r.raise_for_status()
            items = r.json().get("items", [])
            if items:
                intent = items[0].get("intent")
        except Exception:
            pass

    if intent:
        try:
            r = requests.get(f"{ROUTING_URL}/resolve", params={"intent": intent, "client":"ACME"}, timeout=10); r.raise_for_status()
            resolved = r.json()
            if not resolved.get("flow_ref"):
                errors.append("resolve: flow_ref manquant")
        except Exception as e:
            errors.append(f"resolve error: {e}")
    else:
        errors.append("intent introuvable (lookup/catalog)")

    print(json.dumps({"ok": len(errors)==0, "errors": errors}, ensure_ascii=False, indent=2))
    sys.exit(0 if not errors else 1)

if __name__ == "__main__":
    main()
