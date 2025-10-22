# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import health, orchestrator

APP = FastAPI(title="ARKA-ORCHESTRATOR", version="1.0.0")

APP.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

APP.include_router(health.router)
APP.include_router(orchestrator.router, prefix="/orchestrator")
