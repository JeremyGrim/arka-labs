from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.deps.db import get_db
from app.models.models import Client, Project, ProjectProfile
from app.schemas.schemas import ClientIn, ClientOut, ProjectIn, ProjectOut

router = APIRouter()

@router.post("/clients", response_model=ClientOut)
def create_client(payload: ClientIn, db: Session = Depends(get_db)):
    c = Client(code=payload.code, name=payload.name)
    db.add(c); db.commit(); db.refresh(c)
    return ClientOut(id=c.id, code=c.code, name=c.name)

@router.get("/clients", response_model=list[ClientOut])
def list_clients(db: Session = Depends(get_db)):
    res = db.execute(select(Client)).scalars().all()
    return [ClientOut(id=i.id, code=i.code, name=i.name) for i in res]

@router.post("/projects", response_model=ProjectOut)
def create_project(payload: ProjectIn, db: Session = Depends(get_db)):
    p = Project(**payload.model_dump())
    db.add(p); db.commit(); db.refresh(p)
    return ProjectOut(id=p.id, client_id=p.client_id, key=p.key, title=p.title, status=p.status)

@router.get("/projects", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    res = db.execute(select(Project)).scalars().all()
    return [ProjectOut(id=i.id, client_id=i.client_id, key=i.key, title=i.title, status=i.status) for i in res]
