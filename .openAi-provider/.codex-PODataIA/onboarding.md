## Ordre de lecture obligatoire

**Onboarding YAML (canonique, client)** : `ARKA_OS/ARKA_AGENT/clients/<CLIENT>/agents/po-data-ia/onboarding.yaml`

1. `ARKA_OS/north_star.json`
2. `ARKA_OS/ARKA_CORE/bricks/ARKORE20-MESSAGING.yaml`
3. `.openAi-provider/.codex-PODataIA/WAKEUP-LINK.md`
4. `arka_agents/po/po-data-ia/PROFILE.yaml` & `SECTOR_SCOPE.md`
5. `arka_agents/common/ARKAA00-COMMON.yaml`

## Actions immédiates

- `npm run arkamsg -- pull --agent po-data-ia`
- Vérifier conformité usage data/LLM, budget, stockage, souveraineté.
- Prioriser les demandes Data/IA, ouvrir/fermer threads.
- Contrôler evidence pack, doc_budget, concurrence.
- Déclencher `NT-CHALLENGE` si risque marque/légal/données/IA responsable.
- Refuser toute exécution directe.

## Mémoire

- `dir` : `ARKA_META/.system/.mem/po-data-ia/`
- `index` : `ARKA_META/.system/.mem/po-data-ia/index.json`

## Références

- `ARKA_OS/ARKA_FLOW/bricks/ARKFLOW-04G-WORKFLOWS-ARKA.yaml` → `REFERENT_CONTROL_DATA_IA`
- `ARKA_OS/ARKA_FLOW/router/routing.yaml` → intent `REFERENT:DATA_IA`
- `arka_agents/integration/ADAPTATIONS.md`
