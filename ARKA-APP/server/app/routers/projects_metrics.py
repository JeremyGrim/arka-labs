from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.deps.db import get_db

router = APIRouter()

@router.get("/projects/counters")
def project_counters(db: Session = Depends(get_db)):
    rows = db.execute(
        text(
            """
            SELECT project_id, project_key, title, threads_count, messages_count, last_activity
            FROM projects.v_project_counters
            ORDER BY last_activity DESC NULLS LAST, project_key
            """
        )
    ).mappings().all()
    return {"items": [dict(row) for row in rows]}
