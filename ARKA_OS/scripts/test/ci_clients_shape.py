#!/usr/bin/env python3
# ci_clients_shape.py — échoue si la forme clients/ n'est pas conforme
import sys, yaml, json, re
from pathlib import Path

BASE = Path(sys.argv[1]) if len(sys.argv)>1 else Path(".")
root = BASE / "ARKA_OS/ARKA_AGENT/clients"

errors = []
if not root.exists():
    print(json.dumps({"ok": True, "note": "clients/ absent"}, ensure_ascii=False))
    sys.exit(0)

# 1) pas de dossiers nommés *.yaml|*.yml
for p in root.iterdir():
    if p.is_dir() and re.search(r"\.(ya?ml)$", p.name, re.I):
        errors.append({"client_dir": str(p), "error": "dossier avec extension YAML interdit"})

# 2) un seul client.yaml par client
for p in root.iterdir():
    if not p.is_dir(): 
        continue
    ys = list(p.glob("client.y*ml"))
    count = len(ys)
    if count == 0:
        errors.append({"client": p.name, "error": "client.yaml manquant"})
    elif count > 1:
        errors.append({"client": p.name, "error": "plusieurs client.yaml/yml", "files": [str(x) for x in ys]})

# 3) YAML orphelins au root client (hors client.yaml)
for p in root.iterdir():
    if not p.is_dir(): 
        continue
    for y in p.glob("*.y*ml"):
        if y.name.lower() not in ("client.yaml","client.yml"):
            errors.append({"client": p.name, "error": "YAML orphelin à la racine client", "file": str(y)})

print(json.dumps({"errors": errors, "ok": len(errors)==0}, ensure_ascii=False, indent=2))
if errors: sys.exit(1)
