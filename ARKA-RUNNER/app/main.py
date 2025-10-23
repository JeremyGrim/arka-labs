# REPLACEMENT — ARKA-RUNNER/app/main.py (6.5)
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import CONTENT_TYPE_LATEST, CollectorRegistry, Counter, Histogram, Gauge, generate_latest
import time, os
from app.routers import health
try:
    from app.routers import runner as runner_router
except Exception:
    from app.routers import runner_with_fallback as runner_router  # if already patched in 6.2

APP = FastAPI(title="ARKA-RUNNER", version="1.0.0")

APP.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

# ---- API Key middleware (optional) ----
API_KEYS = set(filter(None, (os.environ.get("RUNNER_API_KEYS","").split(","))))
@APP.middleware("http")
async def api_key_guard(request: Request, call_next):
    if API_KEYS and request.url.path not in ("/metrics", "/healthz"):
        k = request.headers.get("X-API-Key")
        if not k or k not in API_KEYS:
            raise HTTPException(401, detail="invalid api key")
    start = time.time()
    resp = await call_next(request)
    dur = time.time()-start
    http_req_seconds.labels(path=request.url.path).observe(dur)
    return resp

# ---- Prometheus ----
http_req_seconds = Histogram("runner_http_request_seconds", "HTTP request seconds", ["path"])
steps_total = Counter("runner_steps_total", "Steps executed")
failures_total = Counter("runner_failures_total", "Runner failures")
gate_pauses_total = Counter("runner_gate_pauses_total", "Runner gate pauses")
tokens_spent_total = Counter("runner_tokens_spent_total", "Tokens spent aggregate")

@APP.get("/metrics")
def metrics():
    return generate_latest(), 200, {"Content-Type": CONTENT_TYPE_LATEST}

# Expose these for router to import (optional)
APP.state.metrics = {
    "steps_total": steps_total,
    "failures_total": failures_total,
    "gate_pauses_total": gate_pauses_total,
    "tokens_spent_total": tokens_spent_total
}

APP.include_router(health.router)
APP.include_router(runner_router.router, prefix="/runner")
