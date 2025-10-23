# Scripts LOT_07

- `backfill_07.sh [ARKA_OS_ROOT]` : importe les flows, capamap et agents depuis
  `ARKA_OS` vers Postgres.
- `switch_07_mode.sh <db|fs|auto>` : met à jour les variables d’environnement
  (`CATALOG_SOURCE`, `AGENTS_SOURCE`, `ROUTING_SOURCE`, `SESSIONS_SOURCE`) dans
  `ARKA-APP/.env`.
- `preflight_07.py` : vérifie la présence des tables/catalogues et teste les
  endpoints BFF.

Les scripts Python se trouvent dans `etl/` et partagent le helper `_db.py` pour
résoudre la connexion Postgres via les variables standard.
