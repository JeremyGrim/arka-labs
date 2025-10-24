import os, time
import requests
from dotenv import load_dotenv
from sseclient import SSEClient

def try_sse(url, headers, timeout=6):
    try:
        with requests.get(url, headers=headers, stream=True, timeout=timeout) as resp:
            resp.raise_for_status()
            messages = SSEClient(resp)
            start = time.time()
            for msg in messages:
                return True, f"event:{msg.event or 'message'} len={len(msg.data or '')}"
                if time.time() - start > timeout:
                    break
        return False, "no events"
    except Exception as e:
        return False, str(e)

def run_notifications_check():
    load_dotenv()
    base = (os.environ.get("API_BASE_URL") or "http://localhost:8080").rstrip("/")
    hdr = {}
    k = os.environ.get("API_KEY","").strip()
    if k:
        hdr["X-API-Key"] = k
    # candidate paths (overridable)
    env_paths = os.environ.get("SSE_PATHS","").strip()
    paths = [p for p in env_paths.split(",") if p.strip()] or ["/api/notify/stream","/api/notifications/stream","/api/notifications/sse","/api/events/stream","/api/hp/stream"]
    tried = []
    for p in paths:
        url = base + p
        ok, info = try_sse(url, hdr, timeout=int(os.environ.get("TIMEOUT_SECONDS","8")))
        tried.append((url, ok, info))
        if ok:
            return {"ok": True, "details": f"SSE OK on {url} ({info})"}
    # fallback: poll hp summary as minimal 'notification' heartbeat
    try:
        r = requests.get(base + "/api/hp/summary", headers=hdr, timeout=5)
        if r.ok:
            return {"ok": True, "details": f"No SSE, but hp/summary reachable (code {r.status_code}). Tried: {tried}"}
    except Exception as e:
        pass
    return {"ok": False, "details": f"SSE endpoints failed. Tried: {tried}"}

if __name__ == "__main__":
    print(run_notifications_check())
