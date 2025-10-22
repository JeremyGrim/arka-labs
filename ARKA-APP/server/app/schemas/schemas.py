from pydantic import BaseModel, Field
from typing import Optional, Any, List

class ClientIn(BaseModel):
    code: str
    name: str

class ClientOut(ClientIn):
    id: int

class ProjectIn(BaseModel):
    client_id: int
    key: str
    title: str
    status: Optional[str] = "active"

class ProjectOut(ProjectIn):
    id: int

class MemoryIn(BaseModel):
    project_id: int
    scope: str
    payload: Any

class MemoryOut(MemoryIn):
    id: int

class ThreadIn(BaseModel):
    project_id: int
    title: Optional[str] = None

class ThreadOut(ThreadIn):
    id: int

class MessageIn(BaseModel):
    thread_id: int
    author_kind: str
    author_ref: Optional[str] = None
    content: Any

class MessageOut(MessageIn):
    id: int
