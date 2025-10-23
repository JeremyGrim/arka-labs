from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
CONTRACTS = ROOT / "contracts"

FAILED = False

for openapi in (CONTRACTS / "openapi").glob("*.yaml"):
    text = openapi.read_text(encoding="utf-8")
    if "operationId" not in text:
        print(f"Missing operationId in {openapi}")
        FAILED = True

schemas_dir = CONTRACTS / "jsonschema"
for schema in schemas_dir.glob("*.json"):
    text = schema.read_text(encoding="utf-8")
    if "title" not in text:
        print(f"Missing title in {schema}")
        FAILED = True

if FAILED:
    sys.exit(1)

print("Contracts lint basic checks passed")
