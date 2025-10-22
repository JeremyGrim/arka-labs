# Contracts — Étape 6.0

Ce répertoire rassemble les contrats gelés avant implémentation (Étape 6.0) :

- `openapi/` : spécifications Runner, Orchestrator et Provider‑Adapter (`runner.yaml`, `orchestrator.yaml`, `provider-adapter.yaml`).
- `jsonschema/` : enveloppe et événements (`event-envelope.json`, `step-started.json`, `step-completed.json`, `step-failed.json`, `gate-awaiting.json`).
- `adapter_interface/` : interfaces Provider Adapter (TypeScript & Python).

CI associée : `python tests/system/contracts/contracts_lint.py` + `python tests/system/contracts/no_mocks_stubs_6_0.py`. Refer to `tests/system/contracts/README.md`.
