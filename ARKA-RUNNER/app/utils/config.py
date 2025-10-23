# app/utils/config.py
import os, json, re
from typing import Dict

ROUTING_URL = os.environ.get("ROUTING_URL", "http://arka-routing:8087")
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql+psycopg2://arka:arka@postgres:5432/arka")
ARKA_OS_ROOT = os.environ.get("ARKA_OS_ROOT", "/app/ARKA_OS")

def provider_map() -> Dict[str,str]:
    raw = os.environ.get("PROVIDER_ADAPTERS", "")
    try:
        return json.loads(raw) if raw else {}
    except Exception:
        return {}
