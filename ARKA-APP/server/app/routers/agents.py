from fastapi import APIRouter, HTTPException
import requests
from app.config import ROUTING_URL

router = APIRouter()

@router.get("/agents")
def list_agents(client: str | None = None):
    try:
        # experts + agents client
        r = requests.get(f"{ROUTING_URL}/catalog", params={"facet": "agent", "client": client}, timeout=10)
        r.raise_for_status()
        items = r.json().get("items", [])
        return {"experts": [i for i in items if i.get("kind")=="expert"],
                "client_agents": [i for i in items if i.get("kind")=="client"]}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Routing error: {e}")
