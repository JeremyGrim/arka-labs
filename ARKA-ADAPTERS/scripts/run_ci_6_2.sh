#!/usr/bin/env bash
set -euo pipefail
python ETAPE6_2/ci/adapter_smoke.py
python ETAPE6_2/ci/adapter_chaos_timeout.py
echo "Adapters 6.2 checks OK (note: require FAULT_INJECTION=timeout to test chaos path)."
