from fastapi import APIRouter, HTTPException
import requests
from app.config import ROUTING_URL

router = APIRouter()

@router.get("/catalog")
def catalog(facet: str | None = None, grep: str | None = None, client: str | None = None):
    try:
        r = requests.get(f"{ROUTING_URL}/catalog", params={"facet": facet, "grep": grep, "client": client}, timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Routing error: {e}")

@router.get("/lookup")
def lookup(term: str):
    try:
        r = requests.get(f"{ROUTING_URL}/lookup", params={"term": term}, timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Routing error: {e}")

@router.get("/resolve")
def resolve(intent: str | None = None, term: str | None = None, client: str | None = None):
    try:
        r = requests.get(f"{ROUTING_URL}/resolve", params={"intent": intent, "term": term, "client": client}, timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Routing error: {e}")
