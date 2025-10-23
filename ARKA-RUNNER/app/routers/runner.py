# app/routers/runner.py
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Any, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import text
import uuid, re, os

from app.deps.db import get_db, create_thread, post_message, add_participant
from app.services.onboarding import load_onboarding
from app.services.routing import resolve as routing_resolve
from app.services.provider import invoke, ProviderError

router = APIRouter()

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

PII_REDACTION = os.environ.get("PII_REDACTION", "off").lower() in ("1", "true", "on")

def redact_text(s: str) -> str:
    s = re.sub(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+", "[REDACTED_EMAIL]", s)
    s = re.sub(r"\b(?:\+\d{1,3}[- ]?)?(?:\d[ -]?){9,}\b", "[REDACTED_PHONE]", s)
    s = re.sub(r"\b[A-Z]{2}\d{2}[A-Z0-9]{1,30}\b", "[REDACTED_IBAN]", s)
    return s

def sanitize_messages(msgs: list[dict] | None) -> list[dict]:
    if not msgs:
        return []
    if not PII_REDACTION:
        return list(msgs)
    out: list[dict] = []
    for m in msgs:
        content = m.get("content")
        if isinstance(content, str):
            content = redact_text(content)
        out.append({**m, "content": content})
    return out

def quota_guard(db: Session, session_id: str, will_consume: Optional[int] = None):
    row = db.execute(
        text("SELECT quota_tokens, spent_tokens FROM runtime.sessions WHERE id=:id"),
        {"id": session_id},
    ).first()
    if not row:
        raise HTTPException(404, detail="session inconnue")
    quota = row.quota_tokens
    spent = row.spent_tokens or 0
    if quota is None:
        return
    projected = spent + (will_consume or 0)
    if spent >= quota or projected > quota:
        raise HTTPException(429, detail="quota exceeded")

def _add_spent_tokens(db: Session, session_id: str, delta: int):
    if not delta:
        return
    db.execute(
        text(
            "UPDATE runtime.sessions "
            "SET spent_tokens = COALESCE(spent_tokens, 0) + :delta "
            "WHERE id = :id"
        ),
        {"delta": int(delta), "id": session_id},
    )
    db.commit()

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
def run_step(req: StepRequest, request: Request, db: Session = Depends(get_db)):
    metrics = getattr(request.app.state, "metrics", {})
    steps_counter = metrics.get("steps_total")
    failures_counter = metrics.get("failures_total")
    gate_counter = metrics.get("gate_pauses_total")
    tokens_counter = metrics.get("tokens_spent_total")

    # 1) Validate agent_ref & onboarding
    client, agent_id = _validate_agent_ref(req.agent_ref)
    ob = load_onboarding(req.agent_ref)
    if not ob:
        raise HTTPException(404, detail="onboarding introuvable")

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
        if gate_counter: gate_counter.inc()
        return StepResponse(status="gated", gate={"kind": step_gate, "reason": "Gate requise par step"})

    # 4) Prepare provider call from provider_policy or onboarding
    policy = req.provider_policy or {}
    provider = policy.get("provider") or (ob.get("provider",{}) or {}).get("default")
    operation = policy.get("operation", "chat")
    model = policy.get("model") or (ob.get("provider",{}) or {}).get("model")
    budget_tokens = policy.get("budget_tokens") or 8192
    temperature = policy.get("temperature") or 0.2
    if not provider:
        raise HTTPException(400, detail="provider non défini (policy.provider ou onboarding.provider.default)")

    # 5) Guard quotas & compose input messages
    quota_guard(db, req.session_id, budget_tokens if isinstance(budget_tokens, int) else None)
    sys_prompt = (ob.get("prompts",{}) or {}).get("system") or ""
    messages = req.payload.get("messages") or []
    sanitized_messages = sanitize_messages(messages)
    input_payload = {"messages": messages, "system": sys_prompt, "tools": req.payload.get("tools")}

    # 6) Call adapter
    try:
        auth_mode = policy.get("auth_mode")
        meta = {"session_id": req.session_id, "intent": req.intent, "flow_ref": flow_ref, "agent_ref": req.agent_ref}
        if auth_mode:
            meta["auth_mode"] = auth_mode
        rsp = invoke(
            provider,
            operation,
            model,
            budget_tokens,
            temperature,
            input_payload,
            metadata=meta)
    except ProviderError as e:
        _session_update_status(db, req.session_id, "failed")
        if failures_counter: failures_counter.inc()
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
    output = rsp.get("output") or {}
    if isinstance(output, dict):
        output = dict(output)
        text_out = output.get("text")
        if isinstance(text_out, str):
            output["text"] = redact_text(text_out) if PII_REDACTION else text_out
        msgs = output.get("messages")
        if isinstance(msgs, list):
            output["messages"] = sanitize_messages(msgs)
    usage = rsp.get("usage") or {}
    post_message(db, thread_id, author_kind="agent", author_ref=req.agent_ref, content={
        "session_id": req.session_id,
        "flow_ref": flow_ref,
        "step": req.step,
        "result": output,
        "usage": usage,
        "provider": rsp.get("provider"), "model": rsp.get("model")
    })

    # 8) Update session status
    _session_update_status(db, req.session_id, "running")
    if steps_counter: steps_counter.inc()
    tokens_used = usage.get("total_tokens") or usage.get("tokens_spent") or usage.get("total") or 0
    try:
        tokens_value = int(tokens_used)
    except (TypeError, ValueError):
        tokens_value = 0
    if tokens_value:
        _add_spent_tokens(db, req.session_id, tokens_value)
        if tokens_counter: tokens_counter.inc(tokens_value)
    return StepResponse(status="ok", result=output, usage=usage, logs=["step executed"])
