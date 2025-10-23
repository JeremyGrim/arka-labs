# orchestrator_proxy.py — BFF pour ARKA-APP (proxy Orchestrator 6.3)
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Any, Dict
import os, requests

router = APIRouter()
ORCH_URL = os.environ.get("ORCH_URL", "http://arka-orchestrator:9092")
ORCH_API_KEY = os.environ.get("ORCH_API_KEY")

def _headers():
    if ORCH_API_KEY:
        return {"X-API-Key": ORCH_API_KEY}
    return None

def _fwd(method: str, path: str, **kwargs):
    url = ORCH_URL.rstrip('/') + path
    headers = kwargs.pop("headers", {}) or {}
    api_headers = _headers()
    if api_headers:
        headers.update(api_headers)
    r = requests.request(method, url, timeout=60, headers=headers, **kwargs)
    if r.status_code >= 400:
        raise HTTPException(r.status_code, detail=r.text[:600])
    return r.json() if "application/json" in r.headers.get("content-type","") else r.text

@router.get("/orch/healthz")
def health():
    try:
        r = requests.get(
            ORCH_URL.rstrip('/') + "/healthz",
            timeout=5,
            headers=_headers(),
        )
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
