from sqlalchemy import Column, Integer, BigInteger, Text, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from app.deps.db import Base

class Client(Base):
    __tablename__ = "clients"
    __table_args__ = {"schema": "projects"}
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Project(Base):
    __tablename__ = "projects"
    __table_args__ = {"schema": "projects"}
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(Integer, ForeignKey("projects.clients.id", ondelete="CASCADE"), nullable=False)
    key: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, default="active")
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

class ProjectProfile(Base):
    __tablename__ = "project_profiles"
    __table_args__ = {"schema": "projects"}
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("projects.projects.id", ondelete="CASCADE"), nullable=False)
    profile: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Memory(Base):
    __tablename__ = "memories"
    __table_args__ = {"schema": "memory"}
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("projects.projects.id", ondelete="CASCADE"), nullable=False)
    scope: Mapped[str] = mapped_column(Text, nullable=False)  # agent|flow|doc|global
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Thread(Base):
    __tablename__ = "threads"
    __table_args__ = {"schema": "messages"}
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("projects.projects.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Participant(Base):
    __tablename__ = "participants"
    __table_args__ = {"schema": "messages"}
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    thread_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("messages.threads.id", ondelete="CASCADE"), nullable=False)
    kind: Mapped[str] = mapped_column(Text, nullable=False)  # agent|user|system
    ref: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Message(Base):
    __tablename__ = "messages"
    __table_args__ = {"schema": "messages"}
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    thread_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("messages.threads.id", ondelete="CASCADE"), nullable=False)
    author_kind: Mapped[str] = mapped_column(Text, nullable=False)  # agent|user|system
    author_ref: Mapped[str] = mapped_column(Text, nullable=True)
    content: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())
