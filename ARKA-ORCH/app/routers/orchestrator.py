# app/routers/orchestrator.py
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from sqlalchemy.orm import Session
from sqlalchemy import text
import uuid, datetime

from app.deps.db import get_db
from app.services.flow_loader import load_steps
from app.services.agents import pick_agent_for_role
from app.services.runner_client import ensure_runner_session, run_step, RunnerError

router = APIRouter()

class FlowOptions(BaseModel):
    assign_strategy: Optional[str] = "auto"
    start_at_step: Optional[int] = 0

class StartFlow(BaseModel):
    client: str
    flow_ref: str
    options: Optional[FlowOptions] = FlowOptions()

class OrchSession(BaseModel):
    id: str
    client: str
    flow_ref: str
    status: str
    current_index: int
    runner_session_id: Optional[str] = None

def _insert_session(db: Session, sid: str, client: str, flow_ref: str, runner_sid: str):
    db.execute(text("""INSERT INTO runtime.orch_sessions(id, client, flow_ref, runner_session_id, status, current_index)
                      VALUES (:id,:c,:f,:r,'running',0)
                      ON CONFLICT (id) DO UPDATE SET client=:c, flow_ref=:f, runner_session_id=:r"""),
               {"id": sid, "c": client, "f": flow_ref, "r": runner_sid})
    db.commit()

def _insert_steps(db: Session, orch_id: str, steps: List[Dict[str,Any]], start_at: int = 0):
    for idx, s in enumerate(steps):
        stid = str(uuid.uuid4())
        db.execute(text("""INSERT INTO runtime.orch_steps(id, orch_id, idx, name, role, gate, status)
                          VALUES (:id,:orch,:idx,:name,:role,:gate,:status)"""),
                   {"id": stid, "orch": orch_id, "idx": idx, "name": s.get("name"), 
                    "role": s.get("role"), "gate": s.get("gate"), 
                    "status": 'pending' if idx>=start_at else 'completed'})
    db.commit()

def _get_session(db: Session, sid: str):
    return db.execute(text("SELECT id, client, flow_ref, status, current_index, runner_session_id FROM runtime.orch_sessions WHERE id=:id"), {"id": sid}).first()

def _get_next_step(db: Session, sid: str):
    return db.execute(text("""SELECT id, idx, name, role, gate, status FROM runtime.orch_steps 
                             WHERE orch_id=:id AND status IN ('pending') ORDER BY idx LIMIT 1"""), {"id": sid}).first()

def _update_step_status(db: Session, step_id: str, status: str, result: Dict[str,Any]|None=None):
    if result is None:
        db.execute(text("UPDATE runtime.orch_steps SET status=:s WHERE id=:id"), {"id": step_id, "s": status})
    else:
        db.execute(text("UPDATE runtime.orch_steps SET status=:s, result=:r::jsonb WHERE id=:id"), {"id": step_id, "s": status, "r": json_dump(result)})
    db.commit()

def _update_session(db: Session, sid: str, **fields):
    sets = ", ".join(f"{k}=:{k}" for k in fields)
    params = dict(fields); params["id"] = sid
    db.execute(text(f"UPDATE runtime.orch_sessions SET {sets} WHERE id=:id"), params)
    db.commit()

def json_dump(obj) -> str:
    import json; return json.dumps(obj, ensure_ascii=False)

def _metrics(request: Request) -> dict:
    return getattr(request.app.state, "metrics", {})

def _inc(metrics: dict, key: str, value: int = 1):
    counter = metrics.get(key)
    if counter:
        counter.inc(value)

def _dec(metrics: dict, key: str, value: int = 1):
    counter = metrics.get(key)
    if counter:
        counter.dec(value)

@router.post("/flow", response_model=OrchSession, status_code=201)
def start_flow(req: StartFlow, request: Request, db: Session = Depends(get_db)):
    metrics = _metrics(request)
    try:
        steps = load_steps(req.flow_ref)
    except Exception as e:
        raise HTTPException(400, detail=f"flow non chargeable: {e}")
    try:
        runner_sid = ensure_runner_session(req.client, req.flow_ref)
    except RunnerError as e:
        raise HTTPException(502, detail=str(e))
    orch_id = str(uuid.uuid4())
    _insert_session(db, orch_id, req.client, req.flow_ref, runner_sid)
    _inc(metrics, "sessions_started_total")
    _inc(metrics, "sessions_running")
    _insert_steps(db, orch_id, steps, start_at=req.options.start_at or 0)
    # exécuter séquentiellement jusqu'à gate/fin/erreur
    while True:
        st = _get_next_step(db, orch_id)
        if not st:
            _update_session(db, orch_id, status='completed')
            break
        step_id, idx, name, role, gate, status = st
        if gate in ('AGP','ARCHIVISTE'):
            _update_step_status(db, step_id, 'gated', result={"gate": gate})
            _update_session(db, orch_id, status='paused', current_index=idx)
            _inc(metrics, "steps_gated_total")
            _inc(metrics, "sessions_paused_total")
            break
        # assignation agent
        agent_ref = pick_agent_for_role(db, req.client, role)
        if not agent_ref:
            _update_step_status(db, step_id, 'failed', result={"error":"aucun agent pour role", "role": role})
            _update_session(db, orch_id, status='failed', current_index=idx)
            _inc(metrics, "steps_failed_total")
            _inc(metrics, "sessions_failed_total")
            break
        # appel Runner
        try:
            rsp = run_step(runner_sid, agent_ref, req.flow_ref, {"name": name, "role": role})
        except RunnerError as e:
            _update_step_status(db, step_id, 'failed', result={"error": str(e)})
            _update_session(db, orch_id, status='failed', current_index=idx)
            _inc(metrics, "steps_failed_total")
            _inc(metrics, "sessions_failed_total")
            break
        if rsp.get("status") == "gated":
            _update_step_status(db, step_id, 'gated', result=rsp)
            _update_session(db, orch_id, status='paused', current_index=idx)
            _inc(metrics, "steps_gated_total")
            _inc(metrics, "sessions_paused_total")
            break
        elif rsp.get("status") == "ok":
            _update_step_status(db, step_id, 'completed', result=rsp)
            _update_session(db, orch_id, current_index=idx+1)
            _inc(metrics, "steps_completed_total")
            continue
        else:
            _update_step_status(db, step_id, 'failed', result=rsp)
            _update_session(db, orch_id, status='failed', current_index=idx)
            _inc(metrics, "steps_failed_total")
            _inc(metrics, "sessions_failed_total")
            break
    s = _get_session(db, orch_id)
    if s and s.status in ("completed", "failed"):
        _dec(metrics, "sessions_running")
    return OrchSession(id=s.id, client=s.client, flow_ref=s.flow_ref, status=s.status, current_index=s.current_index, runner_session_id=s.runner_session_id)

@router.get("/session/{sid}", response_model=OrchSession)
def get_session(sid: str, db: Session = Depends(get_db)):
    s = _get_session(db, sid)
    if not s: raise HTTPException(404, detail="session inconnue")
    return OrchSession(id=s.id, client=s.client, flow_ref=s.flow_ref, status=s.status, current_index=s.current_index, runner_session_id=s.runner_session_id)

@router.get("/session/{sid}/steps")
def list_steps(sid: str, db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT id, idx, name, role, gate, status, result FROM runtime.orch_steps WHERE orch_id=:id ORDER BY idx"), {"id": sid}).mappings().all()
    return {"items": [dict(r) for r in rows]}

@router.post("/step/{id}/approve")
def approve_gate(id: str, request: Request, db: Session = Depends(get_db)):
    metrics = _metrics(request)
    st = db.execute(text("SELECT orch_id, idx, status FROM runtime.orch_steps WHERE id=:id"), {"id": id}).first()
    if not st: raise HTTPException(404, detail="step inconnu")
    if st.status != 'gated': raise HTTPException(400, detail="step non gated")
    # repasser en pending et reprendre l'exécution séquentielle
    db.execute(text("UPDATE runtime.orch_steps SET status='pending' WHERE id=:id"), {"id": id}); db.commit()
    # reprendre
    sid = st.orch_id
    sess = _get_session(db, sid)
    _update_session(db, sid, status='running', current_index=st.idx)
    # boucle reprise
    while True:
        st2 = _get_next_step(db, sid)
        if not st2:
            _update_session(db, sid, status='completed'); break
        step_id, idx, name, role, gate, status = st2
        if gate in ('AGP','ARCHIVISTE'):
            _update_step_status(db, step_id, 'gated', result={"gate": gate})
            _update_session(db, sid, status='paused', current_index=idx)
            _inc(metrics, "steps_gated_total")
            _inc(metrics, "sessions_paused_total")
            break
        agent_ref = pick_agent_for_role(db, sess.client, role)
        if not agent_ref:
            _update_step_status(db, step_id, 'failed', result={"error":"aucun agent pour role", "role": role})
            _update_session(db, sid, status='failed', current_index=idx)
            _inc(metrics, "steps_failed_total")
            _inc(metrics, "sessions_failed_total")
            break
        try:
            rsp = run_step(sess.runner_session_id, agent_ref, sess.flow_ref, {"name": name, "role": role})
        except RunnerError as e:
            _update_step_status(db, step_id, 'failed', result={"error": str(e)})
            _update_session(db, sid, status='failed', current_index=idx)
            _inc(metrics, "steps_failed_total")
            _inc(metrics, "sessions_failed_total")
            break
        if rsp.get("status") == "ok":
            _update_step_status(db, step_id, 'completed', result=rsp)
            _update_session(db, sid, current_index=idx+1)
            _inc(metrics, "steps_completed_total")
            continue
        elif rsp.get("status") == "gated":
            _update_step_status(db, step_id, 'gated', result=rsp)
            _update_session(db, sid, status='paused', current_index=idx)
            _inc(metrics, "steps_gated_total")
            _inc(metrics, "sessions_paused_total")
            break
        else:
            _update_step_status(db, step_id, 'failed', result=rsp)
            _update_session(db, sid, status='failed', current_index=idx)
            _inc(metrics, "steps_failed_total")
            _inc(metrics, "sessions_failed_total")
            break
    s = _get_session(db, sid)
    if s and s.status in ("completed", "failed"):
        _dec(metrics, "sessions_running")
    return {"ok": True, "session": {"id": s.id, "status": s.status, "current_index": s.current_index}}

@router.post("/step/{id}/reject")
def reject_gate(id: str, request: Request, db: Session = Depends(get_db)):
    metrics = _metrics(request)
    st = db.execute(text("SELECT orch_id, idx, status FROM runtime.orch_steps WHERE id=:id"), {"id": id}).first()
    if not st: raise HTTPException(404, detail="step inconnu")
    if st.status != 'gated': raise HTTPException(400, detail="step non gated")
    db.execute(text("UPDATE runtime.orch_steps SET status='failed' WHERE id=:id"), {"id": id}); db.commit()
    _update_session(db, st.orch_id, status='failed', current_index=st.idx)
    _inc(metrics, "steps_failed_total")
    _inc(metrics, "sessions_failed_total")
    _dec(metrics, "sessions_running")
    return {"ok": True}
