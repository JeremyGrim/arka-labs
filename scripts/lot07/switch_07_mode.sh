#!/usr/bin/env bash
# switch_07_mode.sh — bascule DB/FS/auto pour catalog/agents/routing
set -euo pipefail
MODE="${1:-db}" # db|fs|auto
if [[ ! "$MODE" =~ ^(db|fs|auto)$ ]]; then
  echo "Usage: $0 <db|fs|auto>" >&2
  exit 1
fi
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${LOT_DIR}/.." && pwd)"
ENV_APP="${ENV_APP:-${REPO_ROOT}/ARKA-APP/.env}"

update_env_var() {
  local file="$1" key="$2" value="$3"
  mkdir -p "$(dirname "$file")"
  if [[ -f "$file" ]]; then
    if grep -q "^${key}=" "$file"; then
      sed -i.bak "s|^${key}=.*|${key}=${value}|" "$file"
    else
      echo "${key}=${value}" >> "$file"
    fi
  else
    echo "${key}=${value}" > "$file"
  fi
}

for key in CATALOG_SOURCE AGENTS_SOURCE ROUTING_SOURCE; do
  update_env_var "$ENV_APP" "$key" "$MODE"
done
update_env_var "$ENV_APP" "SESSIONS_SOURCE" "${SESSIONS_SOURCE_VALUE:-$MODE}"

update_env_var "$ENV_APP" "ARKA_OS_ROOT" "${ARKA_OS_ROOT_VALUE:-./ARKA_OS}"

echo "LOT_07 :: Mode ${MODE} appliqué dans ${ENV_APP}" 
