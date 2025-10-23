# Contracts CI — Étape 6.0

Scripts de validation :
- `contracts_lint.py` : vérifie la structure des OpenAPI (`runner.yaml`, `orchestrator.yaml`, `provider-adapter.yaml`) et JSON Schema (`event-envelope.json`, etc.).
- `no_mocks_stubs_6_0.py` : scanner anti mock/stub/fake/in-memory/sqlite dans les contrats.

Exécution recommandée :
```bash
python tests/system/contracts/contracts_lint.py .
python tests/system/contracts/no_mocks_stubs_6_0.py .
```
