# ARKA Labs — Chantiers Étapes 3 à 6

Ce dépôt contient le **chantier propre** de la refonte ARKA (branche `master`). Tous les livrables Étapes 3 → 6.4 y sont alignés, sans scripts temporaires ni artefacts sandbox.

## Cartographie

| Dossier | Rôle | Origine | Notes |
| --- | --- | --- | --- |
| `.openAi-provider/` | Wrappers provider (documentation LLM) | step 6 (maj) | pointent vers les onboarding canonique (`clients/<ID>/agents/...`). |
| `.project-docs/sources-search/` | Journal & synthèses | chantier | `journal-echanges.md` consigne chaque intégration. |
| `ARKA_OS/` | Base déclarative (Core/Flow/Agent…) | lots 1→5 | inchangé, read-only. |
| `ARKA_META/` | Runtime (logs/messages/db) | vide par défaut | monté par les services. |
| `ARKA-DOCKER/` | Stack compose (Étapes 3, 5, 6 overlays) | ETAPE3/ETAPE5/ETAPE6 | `docker-compose.yml` + overlays `compose.runner.yml`, `compose.adapters.yml`, `compose.orchestrator.yml`. |
| `ARKA-APP/` | APP FastAPI + Web React (Étapes 4 & 6.4) | ETAPE4 deliver | BFF `/api/orch/*` + écrans (Catalog, LaunchFlow, SessionView, Agents, etc.). |
| `ARKA-RUNNER/` | Service Runner (Étape 6.1) | ETAPE6_1 | exécute un step agent, fallback provider. |
| `ARKA-ADAPTERS/` | Provider adapters (Étape 6.2) | ETAPE6_2 | `adapter-codex`, `adapter-openai`. |
| `ARKA-ORCH/` | Orchestrateur Flow-Bridge (Étape 6.3) | ETAPE6_3 | orchestre `flow_ref` complet (gates, sessions). |
| `contracts/` | Contrats gelés Étape 6.0 | step 6.0 | openapi/jsonschema/interfaces + CI. |
| `tests/system/` | Batteries CI (docker, runner, adapters, orchestrator, UI, obs) | ETAPE3→6 | utilisables en local pour validation. |

## Pipelines & Étapes

### Étape 3 — Dockerisation
- `ARKA-DOCKER/docker-compose.yml` : stack Postgres + routing + adminer.
- `ARKA-DOCKER/docs/README-ETAPE3.md` : notice.
- Commande : `./scripts/make.sh up` (depuis `ARKA-DOCKER`).

### Étape 4 — Migration APP
1. Backend (`ARKA-APP/server`) : FastAPI / API internes (`/api/catalog`, `/api/resolve`, `/api/orch/*`).
2. Frontend (`ARKA-APP/web`) : React/Vite, pages Catalog, LaunchFlow, SessionView, AgentsDirectory, ProjectsCounters.
3. Compose overlay (`ARKA-APP/docker/compose.etape4.yml`).

### Étape 5 — PostgreSQL
Migrations dans `ARKA-DOCKER/docker/db/init/*.sql` + `migrations/100_*.sql`. (Tables projects, memory, messages).

### Étape 6 — Contracts First & mise en service
1. **Contracts** (`contracts/`) — openapi/jsonschema/interfaces + scripts `tests/system/contracts/*`.
2. **Runner 6.1** (`ARKA-RUNNER/`) — API `/runner/*`, migration `070_runtime_sessions.sql`, script `apply_runner_db.sh`.
3. **Adapters 6.2** (`ARKA-ADAPTERS/`) — services `/invoke`, overlay `compose.adapters.yml`, scripts `up_adapters.sh`, CI `adapter_smoke.py` / `adapter_chaos_timeout.py`.
4. **Orchestrator 6.3** (`ARKA-ORCH/`) — orchestration de flows, migration `080_orchestrator.sql`, overlay `compose.orchestrator.yml`, CI `orchestrator_smoke.py`, `orchestrator_dbcheck.py`.
5. **Agents UI 6.4** (`ARKA-APP/web/src/ui`) — écran LaunchFlow connecté à l’orchestrateur via `orchestrator_proxy.py`.

(Étape 6.5 observabilité : livrée mais ignorée par défaut via `.gitignore` → dossier `obs/`).

## Quickstart (env local)

1. **Stack de base** (Étapes 3 & 5)
   ```bash
   cd ARKA-DOCKER
   ./scripts/make.sh up                      # postgres + routing + adminer
   ./scripts/apply_runner_db.sh              # migration sessions (6.1)
   ./scripts/apply_orch_db.sh                # migration orchestrator (6.3)
   ```

2. **Services 6.x**
   ```bash
   # Adapters
   bash ARKA-ADAPTERS/scripts/up_adapters.sh

   # Runner + Orchestrator + APP (combo)
   docker compose \
     -f ARKA-DOCKER/docker-compose.yml \
     -f ARKA-DOCKER/docker/compose.runner.yml \
     -f ARKA-DOCKER/docker/compose.adapters.yml \
     -f ARKA-DOCKER/docker/compose.orchestrator.yml \
     -f ARKA-APP/docker/compose.etape4.yml up -d --build
   ```

3. **UI**
   ```bash
   cd ARKA-APP/web
   npm install
   npm run dev   # ou via `arka-web` dans compose
   ```

4. **Tests système (extraits)**
   ```bash
   python tests/system/runner/runner_smoke.py
   python tests/system/adapters/adapter_smoke.py
   python tests/system/orchestrator/orchestrator_smoke.py
   python tests/system/ui/ui_bff_smoke.py
   python tests/system/contracts/contracts_lint.py
   ```

## Rappels structurels

- **ARKA_OS** reste la source declarative (lots 1→5). Ne pas modifier core dans ce dépôt.
- **ARKA_META/** doit rester vide à l’état initial; les services montent leurs volumes.
- **`.project-docs`** : uniquement `journal-echanges.md` (le reste vit dans `arka-labs-d`).
- **`.gitignore`** exclut `db/`, `obs/`, `tests/tmp/`, `.venv*` — ne pas pousser ces dossiers.

## Journal
Voir `.project-docs/sources-search/journal-echanges.md` pour l’historique détaillé des intégrations (Étape 6 consignée sous “Échange 003 — 2025-10-22”).

---
Dernier commit : `git log -1 --oneline` pour la date exacte.
