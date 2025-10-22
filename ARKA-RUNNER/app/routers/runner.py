# app/routers/runner.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import text
import uuid, re, json

from app.deps.db import get_db, create_thread, post_message, add_participant
from app.services.onboarding import load_onboarding
from app.services.routing import resolve as routing_resolve
from app.services.provider import invoke, ProviderError

router = APIRouter()


def _invoke_with_fallback(policy: dict, onboarding: dict, payload: dict, metadata: dict):
    provider = policy.get("provider") or (onboarding.get("provider", {}) or {}).get("default")
    fallbacks = [p for p in (policy.get("provider_fallback") or []) if p]
    candidates = []
    if provider:
        candidates.append(provider)
    candidates.extend([p for p in fallbacks if p != provider])
    if not candidates:
        raise HTTPException(400, detail="provider non défini (policy.provider, onboarding.provider.default ou provider_fallback)")

    operation = policy.get("operation", "chat")
    model = policy.get("model") or (onboarding.get("provider", {}) or {}).get("model")
    budget_tokens = policy.get("budget_tokens") or 8192
    temperature = policy.get("temperature") or 0.2

    last_err = None
    for prov in candidates:
        try:
            return invoke(prov, operation, model, budget_tokens, temperature, payload, metadata=metadata)
        except ProviderError as err:
            last_err = err
            continue
    detail = f"providers épuisés: {last_err}" if last_err else "aucun provider utilisable"
    raise HTTPException(502, detail=detail)

class StepModel(BaseModel):
    name: Optional[str] = None
    gate: Optional[str] = Field(None, description="AGP|ARCHIVISTE si gate")
    requires_caps: Optional[list[str]] = None
    requires_caps_any: Optional[list[str]] = None
    params: Optional[Dict[str, Any]] = None

class StepRequest(BaseModel):
    session_id: str
    agent_ref: str
    intent: Optional[str] = None
    flow_ref: Optional[str] = None
    step: Dict[str, Any] = Field(default_factory=dict)
    payload: Dict[str, Any] = Field(default_factory=dict)
    provider_policy: Optional[Dict[str, Any]] = None

class StepResponse(BaseModel):
    status: str
    result: Optional[Dict[str, Any]] = None
    logs: Optional[list[str]] = None
    usage: Optional[Dict[str, Any]] = None
    gate: Optional[Dict[str, Any]] = None

class SessionCreate(BaseModel):
    client: str
    flow_ref: str
    context: Optional[Dict[str, Any]] = None

class SessionOut(BaseModel):
    id: str
    flow_ref: str
    client: str
    status: str

def _session_insert(db: Session, sid: str, client: str, flow_ref: str):
    db.execute(text("""INSERT INTO runtime.sessions(id, client, flow_ref, status) VALUES (:id, :c, :f, 'running')
                      ON CONFLICT (id) DO UPDATE SET client=:c, flow_ref=:f"""), {"id": sid, "c": client, "f": flow_ref})
    db.commit()

def _session_update_status(db: Session, sid: str, status: str):
    db.execute(text("UPDATE runtime.sessions SET status=:s WHERE id=:id"), {"id": sid, "s": status}); db.commit()

def _validate_agent_ref(agent_ref: str) -> tuple[str,str]:
    m = re.match(r"^clients/([A-Z0-9_-]+)/agents/([a-z0-9][a-z0-9-]*)$", agent_ref)
    if not m: raise HTTPException(400, detail="agent_ref invalide (clients/<CLIENT>/agents/<agent_id>)")
    return m.group(1), m.group(2)

@router.post("/session", response_model=SessionOut, status_code=201)
def create_session(payload: SessionCreate, db: Session = Depends(get_db)):
    sid = str(uuid.uuid4())
    _session_insert(db, sid, payload.client, payload.flow_ref)
    return SessionOut(id=sid, flow_ref=payload.flow_ref, client=payload.client, status="running")

@router.get("/session/{sid}", response_model=SessionOut)
def get_session(sid: str, db: Session = Depends(get_db)):
    row = db.execute(text("SELECT id, client, flow_ref, status FROM runtime.sessions WHERE id=:id"), {"id": sid}).first()
    if not row: raise HTTPException(404, detail="session inconnue")
    return SessionOut(id=row.id, client=row.client, flow_ref=row.flow_ref, status=row.status)

@router.post("/step", response_model=StepResponse)
def run_step(req: StepRequest, db: Session = Depends(get_db)):
    # 1) Validate agent_ref & onboarding
    client, agent_id = _validate_agent_ref(req.agent_ref)
    ob = load_onboarding(req.agent_ref)

    # 2) Resolve intent/flow_ref if needed
    flow_ref = req.flow_ref
    if not flow_ref:
        r = routing_resolve(req.intent, None, client)
        flow_ref = r.get("flow_ref")
        if not flow_ref:
            raise HTTPException(400, detail="flow_ref introuvable (intent/term non résolu)")

    # 3) Handle Gate
    step_gate = (req.step or {}).get("gate") or (req.step or {}).get("requires_gate")
    if step_gate in ("AGP","ARCHIVISTE"):
        _session_update_status(db, req.session_id, "paused")
        return StepResponse(status="gated", gate={"kind": step_gate, "reason": "Gate requise par step"})

    # 4) Prepare provider call from provider_policy or onboarding
    policy = req.provider_policy or {}

    # 5) Compose input messages
    sys_prompt = (ob.get("prompts",{}) or {}).get("system") or ""
    messages = req.payload.get("messages") or []
    input = {"messages": messages, "system": sys_prompt, "tools": req.payload.get("tools")}

    # 6) Call adapter (fallback aware)
    try:
        rsp = _invoke_with_fallback(
            policy,
            ob,
            input,
            metadata={"session_id": req.session_id, "intent": req.intent, "flow_ref": flow_ref, "agent_ref": req.agent_ref}
        )
    except HTTPException:
        _session_update_status(db, req.session_id, "failed")
        raise
    except ProviderError as e:
        _session_update_status(db, req.session_id, "failed")
        raise HTTPException(502, detail=str(e))

    # 7) Persist message & memory
    # For now we need a thread; create or reuse by convention per session
    # We store a thread id in temp table? Not yet; fallback: create a thread in project CORE by resolving project id.
    # Expect client project exists (e.g., <CLIENT>-CORE)
    row = db.execute(text("""SELECT p.id 
                             FROM projects.projects p 
                             JOIN projects.clients c ON c.id=p.client_id 
                             WHERE c.code=:c AND p.key=:k"""), {"c": client, "k": f"{client}-CORE"}).first()
    if not row:
        raise HTTPException(400, detail=f"projet par défaut {client}-CORE introuvable")
    project_id = row.id
    # create thread if not exists for this session
    thr = db.execute(text("""SELECT t.id FROM messages.threads t 
                             JOIN messages.messages m ON m.thread_id=t.id 
                             WHERE t.project_id=:pid AND m.content->>'session_id'=:sid LIMIT 1"""), {"pid": project_id, "sid": req.session_id}).first()
    if thr:
        thread_id = thr.id
    else:
        thread_id = create_thread(db, project_id, title=f"RUN {req.session_id[:8]} [{flow_ref}]")
        add_participant(db, thread_id, kind="agent", ref=req.agent_ref)

    # post result message
    post_message(db, thread_id, author_kind="agent", author_ref=req.agent_ref, content={
        "session_id": req.session_id,
        "flow_ref": flow_ref,
        "step": req.step,
        "result": rsp.get("output"),
        "usage": rsp.get("usage"),
        "provider": rsp.get("provider"), "model": rsp.get("model")
    })

    # 8) Update session status
    _session_update_status(db, req.session_id, "running")
    return StepResponse(status="ok", result=rsp.get("output"), usage=rsp.get("usage"), logs=["step executed"])
