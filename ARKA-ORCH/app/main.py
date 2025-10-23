# REPLACEMENT — ARKA-ORCH/app/main.py (6.5)
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import CONTENT_TYPE_LATEST, Histogram, Counter, Gauge, generate_latest
import os, time
from app.routers import health, orchestrator

APP = FastAPI(title="ARKA-ORCHESTRATOR", version="1.0.0")

APP.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

API_KEYS = set(filter(None, (os.environ.get("ORCH_API_KEYS","").split(","))))
@APP.middleware("http")
async def api_key_guard(request: Request, call_next):
    if API_KEYS and request.url.path not in ("/metrics", "/healthz"):
        k = request.headers.get("X-API-Key")
        if not k or k not in API_KEYS:
            raise HTTPException(401, detail="invalid api key")
    start = time.time()
    resp = await call_next(request)
    http_req_seconds.labels(path=request.url.path).observe(time.time()-start)
    return resp

http_req_seconds = Histogram("orchestrator_http_request_seconds", "HTTP request seconds", ["path"])
sessions_running = Gauge("orchestrator_sessions_running", "Running sessions")
sessions_started_total = Counter("orchestrator_sessions_started_total", "Sessions started total")
sessions_paused_total = Counter("orchestrator_sessions_paused_total", "Sessions paused total")
sessions_failed_total = Counter("orchestrator_sessions_failed_total", "Sessions failed total")
steps_completed_total = Counter("orchestrator_steps_completed_total", "Steps completed total")
steps_failed_total = Counter("orchestrator_steps_failed_total", "Steps failed total")
steps_gated_total = Counter("orchestrator_steps_gated_total", "Steps gated total")

@APP.get("/metrics")
def metrics():
    return generate_latest(), 200, {"Content-Type": CONTENT_TYPE_LATEST}

APP.state.metrics = {
    "sessions_running": sessions_running,
    "sessions_started_total": sessions_started_total,
    "sessions_paused_total": sessions_paused_total,
    "sessions_failed_total": sessions_failed_total,
    "steps_completed_total": steps_completed_total,
    "steps_failed_total": steps_failed_total,
    "steps_gated_total": steps_gated_total
}

APP.include_router(health.router)
APP.include_router(orchestrator.router, prefix="/orchestrator")
