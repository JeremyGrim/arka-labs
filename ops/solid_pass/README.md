# SOLID PASS (ops)

Pack minimal pour exécuter la « passe correctif » (API smoke, base, nomenclature, notifications, UI) depuis `ops/solid_pass/`.

## Contenu utile
- `.env.example` : paramètres cibles (BFF, UI, Postgres…). À copier en `.env`.
- `requirements.txt` + `install.sh` / `install.ps1` : setup venv rapide (Python ≥ 3.11).
- `scripts/` : runners et contrôles (`solid_check.sh`, `solid_runner.py`, `api_smoke.py`, `db_sanity.py`, `nomenclature_check.py`, `notifications_check.py`, `ui_health.py`, `db_run_sql.sh`, `db_sanity.sql`).
- `reports/` : derniers résultats (`solid_report.md/json`).
- `EVIDENCE_TEMPLATE.md` : modèle à compléter pour l’audit.

## Usage express
```bash
cd ops/solid_pass
cp .env.example .env            # adapter URL/API key/DB si besoin
bash install.sh                 # ou .\.venv\Scripts\Activate.ps1 + pip install -r requirements.txt
./scripts/solid_check.sh        # lance les 5 vérifications + snapshot DB
```

Le script produit `reports/solid_report.md` + `solid_report.json` et affiche les compteurs clés.

## Vérifications couvertes
1. **API smoke** : `/api/hp/summary`, `/api/catalog`, `/api/agents/directory`, `/api/projects/counters`, `/api/meta/recent`, `/api/routing/resolve`, `/api/threads`.
2. **DB sanity** : compte `catalog.flows`, `routing.intents`, `messages.*`, `projects.v_project_counters`.
3. **Nomenclature** : modules essentiels présents, bricks ARKFLOW/ARKAROUTING valides, aucun frontend hors `ARKA-APP/web`.
4. **Notifications** : tentative SSE, fallback heartbeat via `/api/hp/summary` si aucun stream publié.
5. **UI health** : vérifie `index.html` et au moins un asset JS/CSS accessibles.

## Evidence à archiver
- `reports/solid_report.md`
- `EVIDENCE_TEMPLATE.md` complété (captures UI + logs)
- Extraits `docker compose logs` (`arka-app`, `arka-web`) si besoin de correctifs

Utiliser `npm run arka:diagnostics -- --solid` depuis la racine pour chaîner cette passe avec les health checks des services (router/runner/orchestrateur/adapters).

