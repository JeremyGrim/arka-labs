#!/usr/bin/env bash
set -euo pipefail
docker compose -f ARKA-DOCKER/docker-compose.yml -f ETAPE6_2/docker/compose.adapters.yml up -d --build
