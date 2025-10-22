import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTRACTS = ROOT / "contracts"

BANNED = {"Mock", "Stub", "Fake", "patch", "mocker"}

violations = []
for py_file in CONTRACTS.rglob("*.py"):
    if "adapter_interface" in py_file.parts and py_file.name == "provider_adapter.py":
        continue
    text = py_file.read_text(encoding="utf-8", errors="ignore")
    for token in BANNED:
        if token in text:
            violations.append((py_file, token))

if violations:
    print("Mocks/stubs found in contracts zone:")
    for path, token in violations:
        print(f" - {path}: contains '{token}'")
    sys.exit(1)

print("Contracts zone clean (no mocks/stubs)")
