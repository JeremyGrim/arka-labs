# app/services/agents.py
from sqlalchemy.orm import Session
from sqlalchemy import text

def pick_agent_for_role(db: Session, client_code: str, role: str|None) -> str|None:
    if role:
        row = db.execute(text("""SELECT a.ref 
                                FROM projects.agent_refs a 
                                JOIN projects.clients c ON c.id=a.client_id 
                                WHERE c.code=:code AND lower(coalesce(a.role,''))=lower(:role)
                                ORDER BY a.id LIMIT 1"""), {"code": client_code, "role": role}).first()
        if row: return row.ref
    # fallback: any agent of client
    row = db.execute(text("""SELECT a.ref 
                            FROM projects.agent_refs a 
                            JOIN projects.clients c ON c.id=a.client_id 
                            WHERE c.code=:code ORDER BY a.id LIMIT 1"""), {"code": client_code}).first()
    return row.ref if row else None
