# app/utils/config.py
import os
RUNNER_URL = os.environ.get("RUNNER_URL", "http://arka-runner:9091")
ARKA_OS_ROOT = os.environ.get("ARKA_OS_ROOT", "/app/ARKA_OS")
