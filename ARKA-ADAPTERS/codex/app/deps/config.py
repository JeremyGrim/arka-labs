# REPLACEMENT — ADAPTER */app/deps/config.py
import os

ADAPTER_NAME = os.environ.get("ADAPTER_NAME","unknown")
API_BASE = os.environ.get("API_BASE","")
API_KEY = os.environ.get("API_KEY","")
TIMEOUT_SEC = int(os.environ.get("TIMEOUT_SEC","60"))
FAULT_INJECTION = os.environ.get("FAULT_INJECTION","none")  # none|timeout|http500

# NEW
AUTH_MODE = os.environ.get("AUTH_MODE","auto").lower()  # auto|api_key|cli
CLI_CMD = os.environ.get("CLI_CMD","ollama")
CLI_CHAT_ARGS_TEMPLATE = os.environ.get("CLI_CHAT_ARGS_TEMPLATE","run {model}")
CLI_TIMEOUT_SEC = int(os.environ.get("CLI_TIMEOUT_SEC","120"))

def ok() -> bool:
    # API mode ok si base+key; CLI mode ok si binaire présent (best effort)
    if AUTH_MODE in ("cli",) and CLI_CMD:
        return True
    return bool(API_BASE and API_KEY)
