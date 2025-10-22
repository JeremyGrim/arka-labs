import os

ROUTING_URL = os.environ.get("ROUTING_URL", "http://arka-routing:8087")
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql+psycopg2://arka:arka@postgres:5432/arka")
