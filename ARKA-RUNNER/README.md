# ARKA-RUNNER

Service FastAPI dédié à l’exécution d’un step agent.

## Points clés
- Route `/runner/session` : crée ou récupère une session (table `runtime.sessions`).
- Route `/runner/step` : résout intent via ARKA_ROUTING, charge onboarding client, appelle un Provider Adapter (`/invoke`), journalise `messages` et `memory`.
- Dépendances :
  - `PROVIDER_ADAPTERS` (JSON), `ROUTING_URL`, `DATABASE_URL`, `ARKA_OS_ROOT`.
  - Table `runtime.sessions` (migration `070_runtime_sessions.sql`).

## Compose overlay
`docker/compose.runner.yml` ajoute le service `arka-runner` (port 9091). Construire via :
```
docker compose -f ARKA-DOCKER/docker-compose.yml -f ARKA-DOCKER/docker/compose.runner.yml up -d --build
```

## Scripts & tests
- `ARKA-DOCKER/scripts/apply_runner_db.sh` : applique la migration.
- `tests/system/runner/runner_smoke.py` : healthz + création de session (utilise `RUNNER_URL`).
