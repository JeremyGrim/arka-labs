# orchestrator_proxy.py — BFF pour ARKA-APP (proxy Orchestrator 6.3)
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Any, Dict
import os, requests

router = APIRouter()
ORCH_URL = os.environ.get("ORCH_URL", "http://arka-orchestrator:9092")

def _fwd(method: str, path: str, **kwargs):
    url = ORCH_URL.rstrip('/') + path
    r = requests.request(method, url, timeout=60, **kwargs)
    if r.status_code >= 400:
        raise HTTPException(r.status_code, detail=r.text[:600])
    return r.json() if "application/json" in r.headers.get("content-type","") else r.text

@router.get("/orch/healthz")
def health():
    try:
        r = requests.get(ORCH_URL.rstrip('/') + "/healthz", timeout=5)
        r.raise_for_status()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(502, detail=f"orch health error: {e}")

@router.post("/orch/flow")
def start_flow(payload: Dict[str,Any]):
    return _fwd("POST", "/orchestrator/flow", json=payload)

@router.get("/orch/session/{sid}")
def get_session(sid: str):
    return _fwd("GET", f"/orchestrator/session/{sid}")

@router.get("/orch/session/{sid}/steps")
def list_steps(sid: str):
    return _fwd("GET", f"/orchestrator/session/{sid}/steps")

@router.post("/orch/step/{step_id}/approve")
def approve(step_id: str):
    return _fwd("POST", f"/orchestrator/step/{step_id}/approve")

@router.post("/orch/step/{step_id}/reject")
def reject(step_id: str):
    return _fwd("POST", f"/orchestrator/step/{step_id}/reject")
