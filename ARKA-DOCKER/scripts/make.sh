#!/usr/bin/env bash
set -euo pipefail
cmd="${1:-help}"
case "$cmd" in
  up)
    docker compose --env-file .env up -d --build
    ;;
  down)
    docker compose --env-file .env down -v
    ;;
  logs)
    docker compose --env-file .env logs -f --tail=200
    ;;
  migrate)
    docker compose --env-file .env run --rm arka-migrate
    ;;
  ps)
    docker compose --env-file .env ps
    ;;
  *)
    echo "Usage: scripts/make.sh {up|down|logs|migrate|ps}"
    ;;
esac
