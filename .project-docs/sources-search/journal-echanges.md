# Journal des échanges Lead Dev ⇄ Archiviste

## Échange 001 — 2025-02-14

- Participants : Utilisateur (Archiviste), lead-dev-batisseur.
- Contexte : reprise de la mission Docker Étape 3 sur le dépôt maître (non sandbox).
- Constats : dépôt déjà riche en modifications historisées; ARKA_OS contient `ARKA_ROUTING/arkarouting.py` officiel ; absence de journal local.
- Actions :
  - Copie contrôlée du paquet `ARKA-DOCKER/` depuis la sandbox (exclusion du répertoire `docker/db/data` pour éviter permissions/artefacts).
  - Normalisation des volumes (montage `../ARKA_OS` et `../ARKA_META`), conservation du script `make.sh` exécutable.
  - Alignement documentations (README Étape 3) vers l’usage du module ARKA_ROUTING existant.
  - Remplacement global des références `ARKORE17-ORCHESTRATION-RULES` → `ARKFLOW-17-ORCHESTRATION-RULES` dans agents et assembly.
- Vérifications : `docker compose --env-file .env.example config` seulement (stack non démarrée dans ce dépôt, `.env` non fourni).
- Décisions : garder `ARKA-DOCKER/` à la racine (évite dépendances croisées), ajouter ce journal et l’enrichir à chaque échange avant toute action suivante.

## Échange 002 — 2025-02-14

- Participants : Utilisateur (Archiviste), lead-dev-batisseur.
- Contexte : lancement de la mission Étape 4 (migration APP) sur le dépôt maître.
- Constats : bundle livré sous `.project-docs/.../ETAPE4_ARKA-APP` côté sandbox uniquement ; aucun répertoire `ARKA-APP/` ni journaux côté dépôt maître.
- Actions :
  - Copie contrôlée du starter `ARKA-APP/` (server FastAPI, web React, docker overlay, scripts) vers la racine du dépôt.
  - Correction du `compose.etape4.yml` pour monter `../ARKA_OS` et `../ARKA_META` (nomenclature underscore) afin de s’aligner sur l’arborescence réelle.
  - Vérification rapide des dépendances (`requirements.txt`, `Dockerfile`) et du plan de lancement décrit dans `docs/ETAPE4-README.md`.
- Vérifications : `docker compose --env-file .env.example config` (overlay non lancé, .env à préparer avant run).
- Décisions : laisser l’overlay Docker en configuration par défaut, préparer les prochaines étapes (tests backend/UI) une fois la stack Étape 3 reprise.

## Échange 003 — 2025-02-14

- Participants : Utilisateur (Archiviste), lead-dev-batisseur.
- Contexte : consolidation Étape 4.2 (tests anti-mock/stub + E2E) à intégrer dans le dépôt maître.
- Constats : scripts disponibles uniquement dans la sandbox (`ETAPE4_2`), aucune CI équivalente côté dépôt.
- Actions :
  - Copie du bundle `ETAPE4_2` (tests `ci/`, script `run_ci_4_2.sh`, documentation) à la racine du dépôt.
  - Lecture de `STEP4_2_GUIDE.md` et validation que les scripts ciblent les ports/identifiants par défaut de la stack Étape 3/4.
  - Vérification `docker compose -f ARKA-DOCKER/docker-compose.yml -f ARKA-APP/docker/compose.etape4.yml config` pour s’assurer que les services nécessaires sont déclarés (sans lancement ici).
- Vérifications : aucune CI exécutée dans le dépôt (stack arrêtée), seulement génération de la config compose.
- Décisions : conservation du bundle tel quel pour exécution future (post démarrage stack), rappel dans le journal d’effectuer `run_ci_4_2.sh` après mise sous tension d’Étape 3/4.

### Actions complémentaires (après GO utilisateur)
- Création `ARKA-DOCKER/.env` (copie de l’exemple) puis lancement `./scripts/make.sh up` (fix command → `ARKA_OS/ARKA_ROUTING`).
- Démarrage overlay Étape 4 (`docker compose -f ARKA-DOCKER/docker-compose.yml -f ARKA-APP/docker/compose.etape4.yml up -d --build`).
- Installation locale `psycopg2-binary` (option `--break-system-packages`) pour exécuter les scripts Python.
- Déplacement du bundle vers `tests/system/step4_consolidation/` (ci + runner + README).
- Exécution `bash tests/system/step4_consolidation/run_step4_consolidation.sh` → tous les checks OK (`routing_health`, `schema_check`, `no_mocks_stubs`, `e2e_monolith`).

## Échange 004 — 2025-02-14

- Participants : Utilisateur (Archiviste), lead-dev-batisseur.
- Contexte : intégration Étape 5 (PostgreSQL) – migrations/fonctions/vues + scripts import/tests.
- Constats : livrables présents uniquement dans la sandbox (`ETAPE5_DB_DELIVERY`).
- Actions :
  - Création du dossier `db/etape5/` (migrations, functions, views, scripts, README).
  - Déplacement du test `db_etape5_check.py` vers `tests/system/step5_db/` (+ README associé).
  - Mise à jour de `apply_etape5.sh` pour résoudre les chemins de façon robuste.
-  - Exécution de propreté : stack Étape 3/4 démarrée puis arrêtée après validation.
-  - Application migrations Étape 5 (`bash db/etape5/scripts/apply_etape5.sh`), import initial (`python3 db/etape5/scripts/import_from_arkos.py`) et test `python3 tests/system/step5_db/db_etape5_check.py` → OK.
- Vérifications : montage complet Étape 5 (migrations + import + check) validé en local, stack arrêtée ensuite (`./scripts/make.sh down`).
- Décisions : `db/etape5/` devient la référence pour la modélisation Postgres, tests regroupés sous `tests/system/step5_db/`.

## Échange 005 — 2025-02-14

- Participants : Utilisateur (Archiviste), lead-dev-batisseur.
- Contexte : patch Étape 5.x (attache APP ↔ DB) pour exploiter les fonctions SQL `messages.*` et l’annuaire agents.
- Actions :
  - Ajout des migrations `060/061` et scripts `apply_etape5x.sh`, `import_from_arkos_enriched.py` dans `db/etape5/` (README mis à jour).
  - Remplacement/ajout des routes FastAPI (`messages.py`, `participants.py`, `projects_metrics.py`, `agents_directory.py`) + import dans `ARKA-APP/server/main.py`.
  - Lancement stack Étape 3, application migrations (`apply_etape5.sh`, `apply_etape5x.sh`), import enrichi, test `db_etape5_check.py` (OK), puis arrêt stack.
- Vérifications : toutes les commandes exécutées avec succès, `projects.agent_refs` peuplée (`agent_refs=28`).
- Décisions : l’APP consomme désormais les fonctions SQL, prête pour les adapters agents (Étape 6).

## Échange 006 — 2025-02-14

- Participants : Utilisateur (Archiviste), lead-dev-batisseur.
- Contexte : intégration des lots 6.1 (Agent-Runner), 6.3 (Flow-Bridge) et 6.4 (Agents UI).
- Actions 6.1 :
  - Ajout de `ARKA-RUNNER` (FastAPI `/runner`, Docker overlay, README), migration `070_runtime_sessions.sql`, scripts `apply_runner_db.sh`, tests `tests/system/runner/runner_smoke.py`.
  - Alignement `contracts/` (OpenAPI/JSONSchema/interfaces) + CI `contracts_lint`, `no_mocks_stubs_6_0` exécutées.
- Actions 6.3 :
  - Ajout de `ARKA-ORCH` (service orchestrateur, overlay Docker), migration `080_orchestrator.sql`, scripts `apply_orch_db.sh`, tests `tests/system/orchestrator/*`.
  - Mise à jour compose runner/orch (paths, working_dir) et application migrations + imports enrichis.
- Actions 6.4 :
  - Patch `ARKA-APP` (BFF `orchestrator_proxy`, nouvelles pages React LaunchFlow/SessionView/AgentsDirectory/ProjectsCounters, composants `KV`/`StatusPill`, client `api.ts`, ajout `react-router-dom`).
  - Ajout du smoke `tests/system/ui/ui_bff_smoke.py`, copie des guides (`README_ETAPE6_4.md`, `PLAN_T1_PLAYBOOK.md`), exécution `npm install` (maj package-lock) après correction des permissions Windows/WSL).
- Vérifications :
  - Migrations `apply_runner_db.sh`, `apply_orch_db.sh`, `apply_etape5.sh`, `apply_etape5x.sh` rejouées sur la stack compose ; `import_from_arkos_enriched.py` → `agent_refs=28`.
  - Tests `python3 tests/system/step5_db/db_etape5_check.py`, `contracts_lint.py`, `no_mocks_stubs_6_0.py`, `npm install` OK (warnings audit acceptés).
  - Smokes Runner/Orchestrator/UI à relancer après démarrage des overlays (services à l’arrêt hors validation).
- Décisions : base 6.x opérationnelle (Runner + Orchestrator + UI) avant d’attaquer 6.2 (adapters providers) puis le test terrain T1.

## Échange 003 — 2025-10-22

- Intégration Étapes 6.1 à 6.4 dans `arka-labs`.
  - Copie contrôlée des livrables sandbox (Runner, Provider Adapters, Orchestrator, patch UI) sans scripts ni dossiers temporaires.
  - Overlay docker ajoutés : `compose.runner.yml`, `compose.adapters.yml`, `compose.orchestrator.yml`.
  - Migrations Postgres : `070_runtime_sessions.sql`, `080_orchestrator.sql`.
  - README synthétiques insérés (`ARKA-RUNNER`, `ARKA-ADAPTERS`, `ARKA-ORCH`).
  - Tests système alignés : `tests/system/runner`, `tests/system/adapters`, `tests/system/orchestrator`, `tests/system/ui` (CI 6.x).
  - Runner mis à jour (`provider_fallback`).
- Contrôle Step 6.0 conservé (`contracts/`).

## Échange 007 — 2025-02-14

- Participants : Utilisateur (Archiviste), lead-dev-batisseur.
- Contexte : mise en place de l’étape 6.5 (Observabilité & Guardrails) et finalisation de l’UI 6.4 côté BFF/React.
- Actions :
  - Migration `090_guardrails_security.sql`, scripts `apply_guardrails.sh`/`apply_runner_db.sh`/`apply_orch_db.sh` mis à jour ; patchs Runner & Orchestrator (API keys, quotas tokens, redaction PII, métriques Prometheus) + Dockerfiles (`prometheus-client`).
  - Ajout des dashboards et compose Prometheus/Grafana (`obs/compose.obs.yml`, `obs/scripts/up_obs.sh`), tests `tests/system/obs/*` (PII unit OK, metrics smoke à relancer avec services).
  - Patch BFF/UI Agents (6.4) : pages React (LaunchFlow, SessionView, AgentsDirectory, ProjectsCounters), client `api.ts`, dépendances `react-router-dom`, exécution `npm install`.
- Vérifications : migrations rejouées (runner/orch/guardrails), import enrichi (`agent_refs=28`), tests `pii_redaction_unit.py`, `contracts_lint.py`, `no_mocks_stubs_6_0.py`, `npm install` OK ; smokes metrics/UI en attente de services up.
- Décisions : stack 6.x complète (Runner, Adapters, Orchestrator, UI, Observabilité) prête pour la suite (adapters 6.2/T1) une fois relancée.
