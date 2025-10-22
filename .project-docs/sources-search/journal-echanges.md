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
