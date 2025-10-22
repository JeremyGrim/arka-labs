import os
from fastapi import FastAPI
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
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
    orchestrator_proxy,
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
APP.include_router(orchestrator_proxy.router, prefix="/api")

@APP.get("/metrics")
def metrics():
    return generate_latest(), 200, {"Content-Type": CONTENT_TYPE_LATEST}
