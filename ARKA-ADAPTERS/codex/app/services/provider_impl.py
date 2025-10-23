# REPLACEMENT — ADAPTER */app/services/provider_impl.py
import requests, time, subprocess, shlex, re
from typing import Dict, Any, Tuple
from app.deps.config import API_BASE, API_KEY, TIMEOUT_SEC, FAULT_INJECTION, CLI_CMD, CLI_CHAT_ARGS_TEMPLATE, CLI_TIMEOUT_SEC

class AdapterError(RuntimeError): ...

def _fault_injection():
    if FAULT_INJECTION == "timeout":
        time.sleep(TIMEOUT_SEC + 5)
    elif FAULT_INJECTION == "http500":
        raise AdapterError("fault_injection_http500")

def _http_headers():
    return {"Authorization": f"Bearer {API_KEY}"} if API_KEY else {}

def _concat_messages(input: Dict[str,Any]) -> str:
    sys = (input.get("system") or "").strip()
    msgs = input.get("messages") or []
    user_parts=[]
    for m in msgs:
        if m.get("role") in ("user","system","assistant"):
            c = m.get("content") or ""
            if isinstance(c, list):
                c = " ".join([x.get("text","") if isinstance(x,dict) else str(x) for x in c])
            user_parts.append(str(c))
    txt = ("SYSTEM:\n"+sys+"\n\n" if sys else "") + "\n\n".join(user_parts)
    return txt.strip()

# ---- HTTP (API key) modes ----
def chat(model: str|None, temperature: float|None, budget_tokens: int|None, input: Dict[str,Any]) -> Tuple[Dict[str,Any], Dict[str,Any], str, str]:
    _fault_injection()
    url = API_BASE.rstrip('/') + "/chat/completions"
    payload = {
        "model": model or "gpt-4o",
        "messages": input.get("messages") or [],
        "temperature": temperature or 0.2,
        "max_tokens": budget_tokens or 1024
    }
    headers = _http_headers()
    if not headers: raise AdapterError("API key manquante pour mode api_key")
    r = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT_SEC)
    if r.status_code >= 400:
        raise AdapterError(f"provider http {r.status_code}: {r.text[:200]}")
    data = r.json()
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
        "input": input.get("text") or (input.get("messages",[{}])[-1].get("content","") if input.get("messages") else "")
    }
    headers = _http_headers()
    if not headers: raise AdapterError("API key manquante pour mode api_key")
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

# ---- CLI mode ----
def chat_cli(model: str|None, temperature: float|None, budget_tokens: int|None, input: Dict[str,Any]) -> Tuple[Dict[str,Any], Dict[str,Any], str, str]:
    cmd = CLI_CMD
    if not cmd:
        raise AdapterError("CLI_CMD non défini pour mode cli")
    args_template = CLI_CHAT_ARGS_TEMPLATE or "run {model}"
    args = args_template.format(model=(model or "llama3"))
    full = f"{cmd} {args}"
    prompt = _concat_messages(input)
    try:
        proc = subprocess.run(shlex.split(full), input=prompt.encode("utf-8"), stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=CLI_TIMEOUT_SEC)
    except subprocess.TimeoutExpired:
        raise AdapterError("cli timeout")
    if proc.returncode != 0:
        raise AdapterError(f"cli error rc={proc.returncode}: {proc.stderr.decode('utf-8','ignore')[:200]}")
    text = proc.stdout.decode("utf-8","ignore").strip()
    return {"text": text}, {}, "cli", model or "cli-default"
