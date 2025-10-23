from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import os, requests

APP = FastAPI(title="ARKA-APP (base)", version="1.0-beta")
app = APP  # alias pour uvicorn main:app

ROUTING_URL = os.environ.get("ROUTING_URL", "http://arka-routing:8087")

@APP.get("/healthz")
def healthz():
    # minimal DB ping could be added here later
    return {"ok": True, "routing": ROUTING_URL}

@APP.get("/catalog")
def catalog(facet: str | None = None, grep: str | None = None, client: str | None = None):
    try:
        r = requests.get(f"{ROUTING_URL}/catalog", params={"facet": facet, "grep": grep, "client": client}, timeout=10)
        r.raise_for_status()
        return JSONResponse(r.json())
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Routing error: {e}")

@APP.get("/lookup")
def lookup(term: str):
    try:
        r = requests.get(f"{ROUTING_URL}/lookup", params={"term": term}, timeout=10)
        r.raise_for_status()
        return JSONResponse(r.json())
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Routing error: {e}")

@APP.get("/resolve")
def resolve(intent: str | None = None, term: str | None = None, client: str | None = None):
    try:
        r = requests.get(f"{ROUTING_URL}/resolve", params={"intent": intent, "term": term, "client": client}, timeout=10)
        r.raise_for_status()
        return JSONResponse(r.json())
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Routing error: {e}")
