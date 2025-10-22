from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.deps.db import get_db

router = APIRouter()

@router.get("/agents/directory")
def agents_directory(client: str = Query(..., description="Code client, ex: ACME"), db: Session = Depends(get_db)):
    try:
        rows = db.execute(
            text(
                """
                SELECT client_code, agent_id, role, ref, onboarding_path, created_at
                FROM projects.v_client_agents
                WHERE client_code = :code
                ORDER BY agent_id
                """
            ),
            {"code": client},
        ).mappings().all()
        return {"client": client, "agents": [dict(row) for row in rows]}
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"agents_directory failed: {exc}")
