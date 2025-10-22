# app/routers/invoke.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Optional, Dict
from app.deps.config import ADAPTER_NAME, ok
from app.services.provider_impl import chat, embed, AdapterError

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
    metadata: Optional[Dict[str,Any]] = None

class InvokeResponse(BaseModel):
    output: Dict[str,Any]
    usage: Optional[Dict[str,Any]] = None
    provider: Optional[str] = None
    model: Optional[str] = None

@router.post("/invoke", response_model=InvokeResponse)
def invoke(req: InvokeRequest):
    if not ok():
        raise HTTPException(400, detail=f"adapter {ADAPTER_NAME} non configuré (API_BASE/API_KEY requis)")
    try:
        if req.operation == "chat":
            out, usage, pv, model = chat(req.model, req.temperature, req.budget_tokens, req.input.model_dump())
        elif req.operation == "embed":
            out, usage, pv, model = embed(req.model, req.input.model_dump())
        else:
            raise HTTPException(400, detail=f"operation non supportée: {req.operation}")
        return InvokeResponse(output=out, usage=usage, provider=pv, model=model)
    except AdapterError as e:
        raise HTTPException(502, detail=str(e))
