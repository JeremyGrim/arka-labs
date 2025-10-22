# app/deps/config.py
import os

ADAPTER_NAME = os.environ.get("ADAPTER_NAME","unknown")
API_BASE = os.environ.get("API_BASE","")
API_KEY = os.environ.get("API_KEY","")
TIMEOUT_SEC = int(os.environ.get("TIMEOUT_SEC","60"))
FAULT_INJECTION = os.environ.get("FAULT_INJECTION","none")  # none|timeout|http500

def ok() -> bool:
    return bool(API_BASE and API_KEY)
