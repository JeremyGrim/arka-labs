# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import health, runner

APP = FastAPI(title="ARKA-RUNNER", version="1.0.0")

APP.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

APP.include_router(health.router)
APP.include_router(runner.router, prefix="/runner")
