# ARKA-ADAPTERS

Deux services Provider Adapter conformes au contrat Étape 6.0 (`/invoke`).

## Services
- `adapter-codex` (port 9093)
- `adapter-openai` (port 9094)

Variables d’environnement principales :
- `<PROVIDER>_API_BASE`
- `<PROVIDER>_API_KEY`
- `<PROVIDER>_TIMEOUT_SEC`
- `<PROVIDER>_FAULT_INJECTION` (none|timeout|http500)

## Déploiement
```
docker compose \
  -f ARKA-DOCKER/docker-compose.yml \
  -f ARKA-DOCKER/docker/compose.adapters.yml up -d --build
```

Scripts utiles :
- `ARKA-ADAPTERS/scripts/up_adapters.sh`
- `ARKA-ADAPTERS/scripts/run_ci_6_2.sh`

Tests : `tests/system/adapters/adapter_smoke.py`, `adapter_chaos_timeout.py`. Configure `RUNNER_URL`, `ADAPTER_*` avant exécution.
