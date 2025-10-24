import os, re
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

def run_ui_health():
    load_dotenv()
    candidates = []
    env_base = os.environ.get("UI_BASE_URL")
    if env_base:
        candidates.append(env_base.rstrip("/"))
    candidates.extend([
        "http://localhost:8082",
        "http://localhost:5173",
    ])
    tried = []
    for base in candidates:
        base = base.rstrip("/")
        try:
            r = requests.get(base, timeout=8)
        except Exception as e:
            tried.append(f"{base}: {e}")
            continue
        if not r.ok or "text/html" not in (r.headers.get("content-type","")):
            tried.append(f"{base}: code={r.status_code} ct={r.headers.get('content-type')}")
            continue
        # Check assets referenced
        soup = BeautifulSoup(r.text, "html.parser")
        scripts = [s.get("src") for s in soup.find_all("script") if s.get("src")]
        links = [l.get("href") for l in soup.find_all("link") if l.get("href")]
        if not scripts and not links:
            tried.append(f"{base}: index without JS/CSS assets")
            continue
        # Try one asset
        for url in (scripts + links):
            if not url:
                continue
            if url.startswith("http"):
                asset_url = url
            else:
                asset_url = base + ("" if url.startswith("/") else "/") + url
            try:
                a = requests.get(asset_url, timeout=8)
                if a.ok:
                    return {"ok": True, "details": f"UI reachable; asset OK: {asset_url} (code {a.status_code})"}
            except Exception:
                continue
        tried.append(f"{base}: assets unreachable")
    return {"ok": False, "details": "UI unreachable or assets inaccessible. Tried: " + ", ".join(tried)}

if __name__ == "__main__":
    print(run_ui_health())
