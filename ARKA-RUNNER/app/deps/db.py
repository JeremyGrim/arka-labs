# app/deps/db.py
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.utils.config import DATABASE_URL

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def post_message(db, thread_id: int, author_kind: str, content: dict, author_ref: str|None=None) -> int:
    res = db.execute(text("""SELECT messages.post(:tid, :kind, :ref, :content::jsonb)"""), 
                     {"tid": thread_id, "kind": author_kind, "ref": author_ref, "content": json_dump(content)})
    return res.scalar_one()

def create_thread(db, project_id: int, title: str|None=None) -> int:
    res = db.execute(text("""SELECT messages.create_thread(:pid, :title)"""), 
                     {"pid": project_id, "title": title})
    return res.scalar_one()

def add_participant(db, thread_id: int, kind: str, ref: str) -> int:
    res = db.execute(text("""SELECT messages.add_participant(:tid, :kind, :ref)"""), 
                     {"tid": thread_id, "kind": kind, "ref": ref})
    return res.scalar_one()

def json_dump(obj) -> str:
    import json
    return json.dumps(obj, ensure_ascii=False)
