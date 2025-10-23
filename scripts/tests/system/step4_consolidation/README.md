# Étape 4.2 — Consolidation & Tests “monolithiques” (anti‑mock/stub)

# Étape 4.2 — Consolidation & tests anti‑mock/stub

Verrouille l’intégration Étape 3 ↔ Étape 4 (Dockerisation + ARKA‑APP) en interdisant toute dépendance “mock/stub” et en vérifiant le flux réel Routing → App → Postgres.

## Structure du dossier

```
tests/system/step4_consolidation/
├─ README.md                      # ce guide
├─ run_step4_consolidation.sh     # runner Bash (enveloppe unique)
└─ ci/
   ├─ routing_health.py           # /ping, /catalog, /resolve
   ├─ schema_check.py             # schémas & tables Postgres
   ├─ no_mocks_stubs.py           # scanner anti mock/stub/fake/in-memory/sqlite
   └─ e2e_monolith.py             # parcours App → Routing → Postgres
```

## Prérequis

1. Stack Étape 3 opérationnelle :
   ```bash
   cd ARKA-DOCKER && ./scripts/make.sh up
   ```
2. Overlay Étape 4 actif (FastAPI + web) :
   ```bash
   docker compose -f ARKA-DOCKER/docker-compose.yml -f ARKA-APP/docker/compose.etape4.yml up -d --build
   ```
3. Dépendances locales Python :
   - `python3` (≥3.11) accessible.
   - `psycopg2-binary` installé (ex. `python3 -m pip install --break-system-packages psycopg2-binary`).

## Variables d’environnement

- `ARKA_ROUTING_PORT` (defaut `8087`)
- `ARKA_APP_PORT` (defaut `8080`)
- `POSTGRES_HOST` (defaut `localhost`)
- `POSTGRES_PORT` (defaut `5432`)
- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` (défaut `arka`)

Modifier au besoin avant d’exécuter le runner.

## Exécution

```bash
# depuis la racine du dépôt
bash tests/system/step4_consolidation/run_step4_consolidation.sh
```

Le script :
1. Vérifie la santé de `arkarouting`.
2. Contrôle la présence des schémas/tables Postgres.
3. Scanne les sources pour bannir mock/stub/fake/in-memory/sqlite/TestClient/TODO/FIXME/HACK.
4. Réalise le parcours end‑to‑end (lookup → resolve → création client/projet → thread/message → memory).

## DoD Étape 4.2

- ✅ Aucun mock/stub/fake/dummy/in‑memory/sqlite dans les sources actives (`ARKA-APP`, `ARKA-DOCKER`).
- ✅ Routing (`/ping`, `/catalog`, `/resolve`) opérationnel.
- ✅ Schémas/tables Postgres (`projects`, `memory`, `messages`) disponibles.
- ✅ Parcours complet (lookup → resolve → persistances → journalisation) validé.

## Évolutivité

- Ajouter de nouveaux tests dans `ci/` (ex. `ci/perf_smoke.py`) puis chaîner l’appel depuis `run_step4_consolidation.sh`.
- Adapter le runner si besoin (par ex. modes “dry-run” ou intégration CI).
- Les tests restent regroupés sous `tests/system/step4_consolidation/` pour servir de référence à d’autres chantiers de consolidation système.

> Rappel : l’architecture impose **experts centralisés + onboarding client unifié** ; ARKA_ROUTING demeure le **GPS** pour catalog/lookup/resolve. Toute régression détectée par ces scripts doit bloquer la livraison.
