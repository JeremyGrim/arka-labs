"""Shared helpers for LOT_07 ETL scripts."""
from __future__ import annotations

import os
import psycopg2
from psycopg2.extensions import connection

def get_connection() -> connection:
    """Create a new psycopg2 connection using standard env vars."""
    return psycopg2.connect(
        dbname=os.environ.get("POSTGRES_DB", "arka"),
        user=os.environ.get("POSTGRES_USER", "arka"),
        password=os.environ.get("POSTGRES_PASSWORD", "arka"),
        host=os.environ.get("POSTGRES_HOST", "localhost"),
        port=int(os.environ.get("POSTGRES_PORT", "5432")),
    )
