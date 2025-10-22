from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.deps.db import get_db
from app.schemas.schemas import ThreadIn, ThreadOut, MessageIn, MessageOut
import json

router = APIRouter()

@router.post("/threads", response_model=ThreadOut)
def create_thread(payload: ThreadIn, db: Session = Depends(get_db)):
    try:
        res = db.execute(
            text("SELECT messages.create_thread(:p_project_id, :p_title)"),
            {"p_project_id": payload.project_id, "p_title": payload.title},
        )
        thread_id = res.scalar_one()
        row = db.execute(
            text("SELECT id, project_id, title FROM messages.threads WHERE id=:id"),
            {"id": thread_id},
        ).first()
        return ThreadOut(id=row.id, project_id=row.project_id, title=row.title)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"create_thread failed: {exc}")

@router.post("/messages", response_model=MessageOut)
def post_message(payload: MessageIn, db: Session = Depends(get_db)):
    try:
        res = db.execute(
            text(
                "SELECT messages.post(:p_thread_id, :p_author_kind, :p_author_ref, :p_content::jsonb)"
            ),
            {
                "p_thread_id": payload.thread_id,
                "p_author_kind": payload.author_kind,
                "p_author_ref": payload.author_ref,
                "p_content": json.dumps(payload.content, ensure_ascii=False),
            },
        )
        message_id = res.scalar_one()
        row = db.execute(
            text(
                "SELECT id, thread_id, author_kind, author_ref, content FROM messages.messages WHERE id=:id"
            ),
            {"id": message_id},
        ).first()
        return MessageOut(
            id=row.id,
            thread_id=row.thread_id,
            author_kind=row.author_kind,
            author_ref=row.author_ref,
            content=row.content,
        )
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"post_message failed: {exc}")
