# ARKA-ORCH

Orchestrateur de flows : consomme `ARKA_FLOW`, pilote Runner (6.1) et Provider Adapters (6.2).

## HTTP
- `/orch/session` : ouvre une orchestration à partir d’un `flow_ref` et d’un projet.
- `/orch/run` : exécute la séquence complète (steps + gates) en s’appuyant sur Runner.
- `/orch/healthz` : supervision.

## Compose overlay
`ARKA-DOCKER/docker/compose.orchestrator.yml` ajoute le service `arka-orch` (port 9092).

## DB
- Migration `080_orchestrator.sql` — tables `runtime.orch_sessions`, `runtime.orch_events`.
- Script : `ARKA-DOCKER/scripts/apply_orch_db.sh`.

## Tests
- `tests/system/orchestrator/orchestrator_smoke.py`
- `tests/system/orchestrator/orchestrator_dbcheck.py`
