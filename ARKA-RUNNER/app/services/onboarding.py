# app/services/onboarding.py
from pathlib import Path
import yaml, re, os
from app.utils.config import ARKA_OS_ROOT

AGENT_REF_RE = re.compile(r"^clients/([A-Z0-9_-]+)/agents/([a-z0-9][a-z0-9-]*)$")

def load_onboarding(agent_ref: str) -> dict:
    m = AGENT_REF_RE.match(agent_ref)
    if not m:
        raise ValueError(f"agent_ref invalide: {agent_ref}")
    client, agent = m.group(1), m.group(2)
    p = Path(ARKA_OS_ROOT) / "ARKA_AGENT" / "clients" / client / "agents" / agent / "onboarding.yaml"
    if not p.exists():
        # alternate layout ARKA-OS/AGENT/...
        p = Path(ARKA_OS_ROOT) / "AGENT" / "clients" / client / "agents" / agent / "onboarding.yaml"
    if not p.exists():
        raise FileNotFoundError(f"onboarding introuvable: {p}")
    try:
        y = yaml.safe_load(p.read_text(encoding="utf-8")) or {}
    except Exception as e:
        raise RuntimeError(f"onboarding illisible: {e}")
    return y
