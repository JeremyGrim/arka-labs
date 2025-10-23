# Étape 5 — Vérification base de données

Script Python (`db_etape5_check.py`) vérifiant la bonne application des migrations Étape 5 / 5.x :

1. Vue `projects.v_project_counters` présente.
2. Vue `projects.v_client_agents` et table `projects.agent_refs` disponibles.
2. Fonctions `messages.create_thread/add_participant/post` disponibles.
3. Contraintes `chk_messages_author_kind` et `chk_participants_kind` existantes.

Exécution (stack Étape 3 active, variables Postgres exportées) :
```bash
python tests/system/step5_db/db_etape5_check.py
```

Valeurs par défaut : `POSTGRES_USER=arka`, `POSTGRES_PASSWORD=arka`, `POSTGRES_DB=arka`, `POSTGRES_HOST=localhost`, `POSTGRES_PORT=5432`.
