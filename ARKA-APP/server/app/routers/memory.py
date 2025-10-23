from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.deps.db import get_db
from app.models.models import Memory
from app.schemas.schemas import MemoryIn, MemoryOut

router = APIRouter()

@router.post("/memory", response_model=MemoryOut)
def add_memory(payload: MemoryIn, db: Session = Depends(get_db)):
    m = Memory(**payload.model_dump())
    db.add(m); db.commit(); db.refresh(m)
    return MemoryOut(id=m.id, project_id=m.project_id, scope=m.scope, payload=m.payload)

@router.get("/memory/{project_id}", response_model=list[MemoryOut])
def list_memory(project_id: int, db: Session = Depends(get_db)):
    res = db.execute(select(Memory).where(Memory.project_id==project_id)).scalars().all()
    return [MemoryOut(id=i.id, project_id=i.project_id, scope=i.scope, payload=i.payload) for i in res]
