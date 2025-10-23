# app/utils/config.py
import os
RUNNER_URL = os.environ.get("RUNNER_URL", "http://arka-runner:9091")
RUNNER_API_KEY = os.environ.get("RUNNER_API_KEY")
ARKA_OS_ROOT = os.environ.get("ARKA_OS_ROOT", "/app/ARKA_OS")
