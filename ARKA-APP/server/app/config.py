import os
from pathlib import Path

ROUTING_URL = os.environ.get("ROUTING_URL", "http://arka-routing:8087")
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql+psycopg2://arka:arka@postgres:5432/arka")
ORCH_URL = os.environ.get("ORCH_URL", "http://arka-orchestrator:9092")
ORCH_API_KEY = os.environ.get("ORCH_API_KEY")
CATALOG_SOURCE = os.environ.get("CATALOG_SOURCE", "db").lower()
AGENTS_SOURCE = os.environ.get("AGENTS_SOURCE", "db").lower()
ROUTING_SOURCE = os.environ.get("ROUTING_SOURCE", "db").lower()
SESSIONS_SOURCE = os.environ.get("SESSIONS_SOURCE", "auto").lower()
ARKA_OS_ROOT = Path(os.environ.get("ARKA_OS_ROOT", "./ARKA_OS")).resolve()
