# ARKA Labs — Plateforme d’orchestration IA augmentée

> **Objectif :** transformer une constellation de LLM, d’agents métiers et d’humains en une équipe fiable, traçable et pilotable, prête à être livrée chez un client réel.

Ce dépôt correspond au **chantier propre** d’ARKA Labs. Il regroupe tous les livrables fonctionnels des étapes 3 à 6.4 : stack docker, runner, orchestrateur, adapters providers, UI, contrats, tests système. Chaque brique est documentée et prête à déployer.

---

## 1. Proposition de valeur en 5 points

1. **Orchestration multi-LLM / humains** : ARKA ROUTING résout les intents, le Runner exécute les steps, l’Orchestrateur gère les flows, l’UI permet le hand-off AGP/Archiviste.
2. **Traçabilité native** : chaque step journalise messages, mémoires, usage tokens et latences ; les gates sont audités.
3. **Governance by design** : action keys, CAPAMAP, hiérarchie ARKORE01, messagerie ARKORE20 ; aucun contournement possible.
4. **Providers interchangeables** : Adapters codex/openai (extensibles), fallback automatique, observabilité prête pour Prometheus/Grafana.
5. **Déploiement express** : une stack compose, scripts d’application migrations, UI/BFF déjà connectés.

---

## 2. Panorama des dossiers

| Dossier | Rôle | Statut |
| --- | --- | --- |
| `ARKA-DOCKER/` | Stack docker (Postgres, routing, App, Runner, Adapters, Orchestrateur) + scripts. | Étapes 3,5,6 |
| `ARKA-APP/` | Backend FastAPI + UI React (Catalog, Launch Flow, Session View, Agents Directory). | Étapes 4 & 6.4 |
| `ARKA-RUNNER/` | Service Étape 6.1 : exécute un step, charge onboarding client, fallback provider. | Étape 6.1 |
| `ARKA-ADAPTERS/` | Adapters providers (codex/openai) conformes `/invoke`, chaos-tests. | Étape 6.2 |
| `ARKA-ORCH/` | Flow-Bridge orchestrateur : lit ARKA_FLOW, gère gates AGP/Archiviste. | Étape 6.3 |
| `contracts/` | Contrats gelés (OpenAPI/JSON schema, interfaces TS/Py) + lint CI. | Étape 6.0 |
| `tests/system/` | Batteries automatisées (runner, adapters, orchestrateur, UI, obs). | Étapes 3→6 |
| `ARKA_OS/` | Constitution, workflows, agents, profils (lots 1→5). | Read-only |
| `ARKA_META/` | Runtime (volumes montés au démarrage). | Vide par défaut |
| `.project-docs/` | Journal des intégrations (`journal-echanges.md`). | Maintenu |

---

## 3. Expérience utilisateur cible

1. **Recherche** : l’utilisateur demande « audit RGPD » → `ARKA_ROUTING` renvoie l’intent + flow.
2. **Lancement** : un clic dans l’UI crée la session orchestrateur et exécute chaque step via Runner.
3. **Gate** : Archiviste reçoit la pause, valide l’action, l’orchestration reprend.
4. **Evidence pack** : messages, mémoires, quota tokens et métriques sont disponibles pour inspection.

---

## 4. Mise en route (en local ou on-prem)

### 4.1 Pré-requis
- Docker & docker compose
- Python ≥ 3.11, Node ≥ 18 (pour dev local ou UI hors docker)
- Git, jq, yq

### 4.2 Démarrer la stack de base
```bash
cd ARKA-DOCKER
./scripts/make.sh up                     # Postgres + routing + adminer
./scripts/apply_runner_db.sh             # migration runtime.sessions (6.1)
./scripts/apply_orch_db.sh               # migration runtime.orch_* (6.3)
```

### 4.3 Lancer Runner / Adapters / Orchestrateur / APP
```bash
# adapters providers
bash ARKA-ADAPTERS/scripts/up_adapters.sh

# runner + orchestrateur + app (compose overlay)
docker compose \
  -f ARKA-DOCKER/docker-compose.yml \
  -f ARKA-DOCKER/docker/compose.runner.yml \
  -f ARKA-DOCKER/docker/compose.adapters.yml \
  -f ARKA-DOCKER/docker/compose.orchestrator.yml \
  -f ARKA-APP/docker/compose.etape4.yml up -d --build
```

### 4.4 Mode développeur (optionnel)
```bash
# Backend BFF
cd ARKA-APP/server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:APP --reload --port 9080

# Frontend UI
cd ../web
npm install
npm run dev # http://localhost:3000
```

### 4.5 Tests essentiels
```bash
python tests/system/runner/runner_smoke.py
python tests/system/adapters/adapter_smoke.py
python tests/system/orchestrator/orchestrator_smoke.py
python tests/system/ui/ui_bff_smoke.py
python tests/system/contracts/contracts_lint.py
```

### 4.6 Outillage CLI & diagnostics

Un jeu de commandes npm simplifie le pilotage du chantier depuis la racine du dépôt :

- `npm run arka[:up]` / `npm run arka:down` — démarre ou arrête la stack docker (profils `--profile=core|t1|full|minimal`, options `--services`, `--no-build`, `--logs`, etc.).
- `npm run arka:ps`, `npm run arka:logs -- --services=arka-app` — inspecte l’état des services et suit les journaux ciblés.
- `npm run arka:apicheck [--json]` — smoke BFF (health, hp/summary, catalog, routing…) avec sortie optionnelle JSON.
- `npm run arka:diagnostics [--solid]` — agrège checks BFF + health endpoints Runner/Orchestrateur/Adapters et, avec `--solid`, relance la passe SOLID (nécessite Python ≥ 3.11).

Tous les scripts acceptent `--help` pour lister les options disponibles.

---

## 5. Détails techniques

### 5.1 ARKA_ROUTING (GPS)
- CLI/HTTP auto-détectant `ARKA_OS`. Commandes : `lookup`, `resolve`, `catalog`, `serve`.
- Lit `ARKFLOW00-INDEX`, `router/routing.yaml`, `wakeup-intents.matrix.yaml`, `ARKA_AGENT/…`.

### 5.2 Runner (Étape 6.1)
- API `/runner/session`, `/runner/step`.
- Charge `clients/<client>/agents/<agent_id>/onboarding.yaml`.
- Compose `input` (messages, prompts), appelle adaptateur via `_invoke_with_fallback`.
- Journalise threads (`messages.threads/messages`) et mémoires.

### 5.3 Provider Adapters (Étape 6.2)
- Services `adapter-codex` & `adapter-openai` (FastAPI `/invoke`).
- Paramètres : `API_BASE`, `API_KEY`, `TIMEOUT_SEC`, `FAULT_INJECTION`.
- CI : `adapter_smoke.py`, `adapter_chaos_timeout.py`.

### 5.4 Orchestrateur (Étape 6.3)
- API `/orchestrator/flow`, `/orchestrator/session`, `/orchestrator/step/{id}/approve|reject`.
- Lit les flows YAML (capamap, gates). Pause/resume avec AGP/Archiviste.
- Migration `080_orchestrator.sql` (tables `runtime.orch_*`).

### 5.5 UI & BFF (Étapes 4 + 6.4)
- Pages : Catalog (facettes), Launch Flow, Session View (timeline), Agents Directory, Projects Counters.
- API BFF : `/api/catalog`, `/api/resolve`, `/api/orch/*`.
- React Router, composants `StatusPill`, `KV`, `SessionTimeline`.

### 5.6 Contrats & Tests
- `contracts/openapi/*.yaml` + `jsonschema/*.json`.
- CI : `tests/system/contracts/contracts_lint.py`, `no_mocks_stubs_6_0.py`.
- Tests E2E : runner, adapters, orchestrator, UI, step4 consolidation, step5 DB.

---

## 6. Roadmap consolidée

### 6.1 Court terme (T1 terrain)
- Flows pilotes : `AUDIT:RGPD`, `SPEC_WRITE` (client ACME).
- KPI : réussite ≥ 90 %, latence step P50 < 20s, coûts < budget, zéro evidence manquante.
- Gate T1 conditionne étape 7.

### 6.2 Étape 6.5 (livrable sandbox prêt)
- Observabilité : `obs/compose.obs.yml`, Prometheus 9090, Grafana 3000, dashboards.
- Guardrails : redaction PII, quotas tokens, API keys.
- Actions restantes : appliquer patches (`apply_guardrails.sh`) puis activer overlay.

### 6.3 Étape 6.6 (hardening T2)
- Ajuster perfs (fallback multi-provider, retry backoff, quotas dynamiques).
- UX Gate : notifications + macro d’approbation.
- Pipelines GitOps/E2E sur tags.

### 6.4 Étape 7 (beta publique)
- Multi-tenancy, marketplace d’agents, vault secrets, RBAC complet.
- Observabilité SLO promus en alerting.
- Packaging Helm / Terraform.

---

## 7. Gouvernance & bonnes pratiques

- **ARKA_OS** : ne pas modifier dans ce dépôt (constitution). Toute évolution via livrable étape dédié.
- **ARKA_META** : laisser vide ; monté par services.
- **`.project-docs`** : uniquement `journal-echanges.md`. Archives détaillées dans `arka-labs-d`.
- **`.gitignore`** : inclut `.venv*/`, `db/`, `obs/`, `tests/tmp/`, `backend_server.log`.
- **Aucun mock/stub** dans services : tests connectés aux vrais adapters. Contrôlé par `no_mocks_stubs_6_0.py`.

---

## 8. Ressources complémentaires

- Plan Etape 6 détaillé : `.project-docs/sources-search/livraisons/Plan-etape 6 – Architecture.md`
- Guides livrables : `ARKA-DOCKER/docs/README-ETAPE3.md`, `.../STEP6_1_GUIDE.md`, etc. (sandbox).
- Repository sandbox : `C:/Users/grimo/Documents/Projets/arka-labs-d` (scripts, docs complètes, archives).

---

## 9. Support

- Contact technique : `support@arka-labs.com`
- Issues chantier : `.project-docs/sources-search/journal-echanges.md`
- Contributions : PR sur `git@github.com:JeremyGrim/arka-labs.git`

> **ARKA Labs** : la voie rapide de l’atelier LLM vers un produit orchestré, observable et gouverné.
