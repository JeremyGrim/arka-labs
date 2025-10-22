import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    health,
    routing,
    projects,
    memory,
    messages,
    agents,
    participants,
    projects_metrics,
    agents_directory,
)

APP = FastAPI(title="ARKA-APP", version="1.0-beta")

# CORS (dev)
APP.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

APP.include_router(health.router, prefix="/api")
APP.include_router(routing.router, prefix="/api")
APP.include_router(projects.router, prefix="/api")
APP.include_router(memory.router, prefix="/api")
APP.include_router(messages.router, prefix="/api")
APP.include_router(agents.router, prefix="/api")
APP.include_router(participants.router, prefix="/api")
APP.include_router(projects_metrics.router, prefix="/api")
APP.include_router(agents_directory.router, prefix="/api")
