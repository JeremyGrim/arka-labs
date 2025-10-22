# app/services/provider_impl.py
import requests, time
from typing import Dict, Any, Tuple
from app.deps.config import API_BASE, API_KEY, TIMEOUT_SEC, FAULT_INJECTION

class AdapterError(RuntimeError): ...

def _fault_injection():
    if FAULT_INJECTION == "timeout":
        time.sleep(TIMEOUT_SEC + 5)
    elif FAULT_INJECTION == "http500":
        raise AdapterError("fault_injection_http500")

def chat(model: str|None, temperature: float|None, budget_tokens: int|None, input: Dict[str,Any]) -> Tuple[Dict[str,Any], Dict[str,Any], str, str]:
    _fault_injection()
    url = API_BASE.rstrip('/') + "/chat/completions"
    payload = {
        "model": model or "gpt-4o",
        "messages": input.get("messages") or [],
        "temperature": temperature or 0.2,
        "max_tokens": budget_tokens or 1024
    }
    headers = {"Authorization": f"Bearer {API_KEY}"}
    r = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT_SEC)
    if r.status_code >= 400:
        raise AdapterError(f"provider http {r.status_code}: {r.text[:200]}")
    data = r.json()
    # Normalisation (best effort)
    text = None
    try:
        text = data["choices"][0]["message"]["content"]
    except Exception:
        pass
    output = {"text": text, "messages": data.get("choices")}
    usage = data.get("usage", {})
    provider = "openai-like"
    model_used = data.get("model") or payload["model"]
    return output, usage, provider, model_used

def embed(model: str|None, input: Dict[str,Any]) -> Tuple[Dict[str,Any], Dict[str,Any], str, str]:
    _fault_injection()
    url = API_BASE.rstrip('/') + "/embeddings"
    payload = {
        "model": model or "text-embedding-3-small",
        "input": input.get("text") or input.get("messages",[{}])[-1].get("content","")
    }
    headers = {"Authorization": f"Bearer {API_KEY}"}
    r = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT_SEC)
    if r.status_code >= 400:
        raise AdapterError(f"provider http {r.status_code}: {r.text[:200]}")
    data = r.json()
    vec = None
    try:
        vec = data["data"][0]["embedding"]
    except Exception:
        pass
    output = {"vector": vec}
    usage = data.get("usage", {})
    provider = "openai-like"
    model_used = data.get("model") or payload["model"]
    return output, usage, provider, model_used
