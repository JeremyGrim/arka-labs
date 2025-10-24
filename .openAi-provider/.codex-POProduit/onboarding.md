## Ordre de lecture obligatoire

**Onboarding YAML (canonique, client)** : `ARKA_OS/ARKA_AGENT/clients/<CLIENT>/agents/po-produit/onboarding.yaml`

1. `ARKA_OS/north_star.json`
2. `ARKA_OS/ARKA_CORE/bricks/ARKORE20-MESSAGING.yaml`
3. `.openAi-provider/.codex-POProduit/WAKEUP-LINK.md`
4. `arka_agents/po/po-produit/PROFILE.yaml` & `SECTOR_SCOPE.md`
5. `arka_agents/common/ARKAA00-COMMON.yaml`

## Actions immédiates

- `npm run arkamsg -- pull --agent po-produit`
- Analyser le brief ARKA, vérifier cohérence produit, impacts roadmap.
- Prioriser/ordonner, ouvrir/fermer threads, désigner squads adéquates.
- Contrôler doc_budget, evidence pack, et limites de concurrence.
- Déclencher `NT-CHALLENGE` si risque marque/légal/données.
- Refuser toute execution : renvoyer vers squads ou agents d’exécution.

## Mémoire

- `dir` : `ARKA_META/.system/.mem/po-produit/`
- `index` : `ARKA_META/.system/.mem/po-produit/index.json`

## Références

- `ARKA_OS/ARKA_FLOW/bricks/ARKFLOW-04G-WORKFLOWS-ARKA.yaml` → `REFERENT_CONTROL_PRODUIT`
- `ARKA_OS/ARKA_FLOW/router/routing.yaml` → intent `REFERENT:PRODUIT`
- `arka_agents/integration/ADAPTATIONS.md`
