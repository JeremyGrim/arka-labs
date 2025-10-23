#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${ROOT_DIR}/.." && pwd)"
MIGRATIONS_DIR="${REPO_ROOT}/migrations"

COMPOSE="${COMPOSE:-${REPO_ROOT}/ARKA-DOCKER/docker-compose.yml}"
ENVFILE="${ENVFILE:-${REPO_ROOT}/ARKA-DOCKER/.env}"

if [ ! -f "$COMPOSE" ]; then
  echo "docker-compose Étape 3 introuvable: $COMPOSE" >&2; exit 1
fi

source "$ENVFILE" 2>/dev/null || true
PGUSER="${POSTGRES_USER:-arka}"
PGPASS="${POSTGRES_PASSWORD:-arka}"
PGDB="${POSTGRES_DB:-arka}"

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Répertoire des migrations introuvable: $MIGRATIONS_DIR" >&2; exit 1
fi

apply_sql() {
  local sql_file="$1"
  if [ -f "$sql_file" ]; then
    echo ">> $sql_file"
    docker compose -f "$COMPOSE" exec -T postgres sh -lc "PGPASSWORD='$PGPASS' psql -U $PGUSER -d $PGDB -f - " < "$sql_file"
  else
    echo "!! Fichier manquant : $sql_file" >&2
    exit 1
  fi
}

echo "== Étape 5 :: migrations =="
for name in \
  040_constraints.sql \
  050_defaults.sql \
  060_agent_refs.sql \
  061_client_agents.sql \
  070_runtime_sessions.sql \
  070_catalog_schema.sql \
  071_catalog_flows.sql \
  072_capabilities.sql \
  073_routing_intents.sql \
  074_views_compat.sql \
  080_orchestrator.sql \
  090_guardrails_security.sql
do
  apply_sql "${MIGRATIONS_DIR}/${name}"
done

echo "== Étape 5 :: functions =="
for f in "${ROOT_DIR}"/functions/*.sql; do
  echo ">> $f"
  docker compose -f "$COMPOSE" exec -T postgres     sh -lc "PGPASSWORD='$PGPASS' psql -U $PGUSER -d $PGDB -f - " < "$f"
done

echo "== Étape 5 :: views =="
for f in "${ROOT_DIR}"/views/*.sql; do
  echo ">> $f"
  docker compose -f "$COMPOSE" exec -T postgres     sh -lc "PGPASSWORD='$PGPASS' psql -U $PGUSER -d $PGDB -f - " < "$f"
done

echo "Étape 5 appliquée."
