# REPLACEMENT — ADAPTER */app/routers/invoke.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Optional, Dict
from app.deps.config import ADAPTER_NAME, ok, AUTH_MODE, API_KEY
from app.services.provider_impl import chat, embed, chat_cli, AdapterError

router = APIRouter()

class InvokeInput(BaseModel):
    messages: Optional[list[dict]] = None
    system: Optional[str] = None
    tools: Optional[list[dict]] = None
    text: Optional[str] = None

class InvokeRequest(BaseModel):
    provider: str
    operation: str = Field(..., pattern="^(chat|embed|vision|audio)$")
    model: Optional[str] = None
    budget_tokens: Optional[int] = None
    temperature: Optional[float] = None
    input: InvokeInput
    metadata: Optional[Dict[str,Any]] = None   # peut contenir {auth_mode:"api_key|cli|auto"}

class InvokeResponse(BaseModel):
    output: Dict[str,Any]
    usage: Optional[Dict[str,Any]] = None
    provider: Optional[str] = None
    model: Optional[str] = None

def decide_mode(metadata: Optional[Dict[str,Any]]) -> str:
    mode = (metadata or {}).get("auth_mode") or AUTH_MODE
    if mode == "auto":
        return "api_key" if API_KEY else "cli"
    return mode

@router.post("/invoke", response_model=InvokeResponse)
def invoke(req: InvokeRequest):
    mode = decide_mode(req.metadata)
    try:
        if req.operation == "chat":
            if mode == "cli":
                out, usage, pv, model = chat_cli(req.model, req.temperature, req.budget_tokens, req.input.model_dump())
            else:
                out, usage, pv, model = chat(req.model, req.temperature, req.budget_tokens, req.input.model_dump())
        elif req.operation == "embed":
            if mode == "cli":
                raise HTTPException(400, detail="operation embed non supportée en mode CLI")
            out, usage, pv, model = embed(req.model, req.input.model_dump())
        else:
            raise HTTPException(400, detail=f"operation non supportée: {req.operation}")
        return InvokeResponse(output=out, usage=usage, provider=pv, model=model)
    except AdapterError as e:
        raise HTTPException(502, detail=str(e))
