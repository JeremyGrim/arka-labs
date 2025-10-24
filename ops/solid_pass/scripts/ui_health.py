import os, re
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

def run_ui_health():
    load_dotenv()
    base = (os.environ.get("UI_BASE_URL") or "http://localhost:8082").rstrip("/")
    try:
        r = requests.get(base, timeout=8)
    except Exception as e:
        return {"ok": False, "details": f"UI not reachable at {base}: {e}"}
    if not r.ok or "text/html" not in (r.headers.get("content-type","")):
        return {"ok": False, "details": f"Bad UI response: code {r.status_code}, ct={r.headers.get('content-type')}"}
    # Check assets referenced
    soup = BeautifulSoup(r.text, "html.parser")
    scripts = [s.get("src") for s in soup.find_all("script") if s.get("src")]
    links = [l.get("href") for l in soup.find_all("link") if l.get("href")]
    if not scripts and not links:
        return {"ok": False, "details": "index.html does not reference any JS/CSS assets (build issue)."}
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
    return {"ok": False, "details": "UI reached but assets not accessible (likely proxy or build path issue)."}

if __name__ == "__main__":
    print(run_ui_health())
