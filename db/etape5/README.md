# Étape 5 — PostgreSQL (projects | memory | messages)

Cette étape consolide la base Postgres (projets, mémoire, messages) en ajoutant les contraintes,
fonctions et vues nécessaires, ainsi que les scripts d’application et d’import des données ARKA_OS.
Un test système (`tests/system/step5_db`) permet de vérifier l’installation.

## Contenu
- `migrations/` : contraintes & defaults (`040_constraints.sql`, `050_defaults.sql`) + annuaire agents (`060_agent_refs.sql`, `061_client_agents.sql`).
- `functions/` : `messages_api.sql` (`messages.create_thread/add_participant/post`).
- `views/` : `project_counters.sql` (+ `projects.v_client_agents` via migration `061_client_agents.sql`).
- `scripts/` :
  - `apply_etape5.sh` — applique migrations `040/050` + fonctions + vues.
  - `apply_etape5x.sh` — applique les migrations complémentaires `060/061`.
  - `import_from_arkos.py` — importe `clients`/`projects`.
  - `import_from_arkos_enriched.py` — importe `clients`/`projects` **et** `projects.agent_refs`.
- Tests associés : `tests/system/step5_db/db_etape5_check.py`.

## Pré-requis
1. Stack Étape 3 active (`cd ARKA-DOCKER && ./scripts/make.sh up`).
2. Services `postgres`, `arka-routing`, `arka-app` en état healthy (ports par défaut 5432 / 8087 / 8080).
3. Variables Postgres définies dans `ARKA-DOCKER/.env` (ou exportées).

## Application des migrations
```bash
# depuis la racine du dépôt
bash db/etape5/scripts/apply_etape5.sh
# puis pour 5.x
bash db/etape5/scripts/apply_etape5x.sh
```
Le script détecte automatiquement les fichiers `migrations/`, `functions/`, `views/`
et utilise `docker compose` (Étape 3) pour appliquer les SQL dans le conteneur `postgres`.

## Import des clients / projets / annuaire agents
```bash
python db/etape5/scripts/import_from_arkos.py \
  --os-root ARKA_OS \
  --pg "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"

# ou version enrichie (clients + projets + agent_refs)
python db/etape5/scripts/import_from_arkos_enriched.py \
  --os-root ARKA_OS \
  --pg "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"
```
Paramètres accessibles :
- `--os-root` : chemin vers la racine ARKA_OS (défaut `ARKA_OS`).
- `--pg` : URL Postgres (défaut `postgresql://arka:arka@localhost:5432/arka`).
- `--default-project-key` : suffixe projet créé si inexistant (défaut `CORE`).

## Vérification Étape 5
```bash
python tests/system/step5_db/db_etape5_check.py
```
Le test contrôle :
1. Schémas/tables attendus (`projects.clients/projects`, `memory.memories`, `messages.*`).  
2. Présence des fonctions `messages.*`.  
3. Vue `projects.v_project_counters`.  
4. Absence de dépendances SQLite ou fichiers mock/stub dans `db/etape5`.  

## Notes d’architecture
- L’architecture reste orientée **experts centralisés + onboarding client unifié** ; `projects.agent_refs` stocke les références agents canoniques (`clients/<CODE>/agents/<agent_id>`).
- Les fonctions `messages.*` encapsulent les écritures pour faciliter l’ajout futur de hooks
  (audit, télémetrie) sans modifier les appelants.  
- Étapes suivantes : enrichir la modélisation (participants/agents), historisation et intégration UI complète (pages Projects/Messages/Memory) et adapters agents (Étape 6).
