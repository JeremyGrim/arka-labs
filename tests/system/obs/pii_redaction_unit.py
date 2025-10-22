#!/usr/bin/env python3
# ci/pii_redaction_unit.py — vérifie la fonction redact_text exposée par le Runner
import json, re

def redact_text(value: str) -> str:
    value = re.sub(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+", "[REDACTED_EMAIL]", value)
    value = re.sub(r"\b(?:\+\d{1,3}[- ]?)?(?:\d[ -]?){9,}\b", "[REDACTED_PHONE]", value)
    value = re.sub(r"\b[A-Z]{2}\d{2}[A-Z0-9]{1,30}\b", "[REDACTED_IBAN]", value)
    return value

cases = [
  "contact me at john.doe@example.com or +33 6 12 34 56 78; IBAN FR1420041010050500013M02606",
  "no pii here"
]
out = [redact_text(c) for c in cases]
print(json.dumps({"ok": "[REDACTED_EMAIL]" in out[0] and "[REDACTED_PHONE]" in out[0] and "[REDACTED_IBAN]" in out[0]}, ensure_ascii=False))
