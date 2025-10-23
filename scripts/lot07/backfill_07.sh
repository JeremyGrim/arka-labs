#!/usr/bin/env bash
# backfill_07.sh — importe YAML -> DB (flows, capamap, agents)
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${LOT_DIR}/.." && pwd)"
OS_ROOT="${1:-${REPO_ROOT}/ARKA_OS}"
export ARKA_OS_ROOT="$OS_ROOT"

python3 "${LOT_DIR}/etl/etl_import_flows_from_arkflow.py" "$OS_ROOT"
python3 "${LOT_DIR}/etl/etl_import_capamap_from_yaml.py" "$OS_ROOT"
python3 "${LOT_DIR}/etl/etl_import_agents_directory.py" "$OS_ROOT"

echo "LOT_07 :: Backfill terminé depuis $OS_ROOT"
