from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.deps.db import get_db
from pydantic import BaseModel

router = APIRouter()

class ParticipantIn(BaseModel):
    thread_id: int
    kind: str
    ref: str

class ParticipantOut(ParticipantIn):
    id: int

@router.post("/participants", response_model=ParticipantOut)
def add_participant(payload: ParticipantIn, db: Session = Depends(get_db)):
    try:
        res = db.execute(
            text("SELECT messages.add_participant(:p_thread_id, :p_kind, :p_ref)"),
            {"p_thread_id": payload.thread_id, "p_kind": payload.kind, "p_ref": payload.ref},
        )
        participant_id = res.scalar_one()
        return ParticipantOut(id=participant_id, **payload.model_dump())
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"add_participant failed: {exc}")
