## Ordre de lecture obligatoire

**Onboarding YAML (canonique, client)** : `ARKA_OS/ARKA_AGENT/clients/<CLIENT>/agents/po-finance-performance/onboarding.yaml`

1. `ARKA_OS/north_star.json`
2. `ARKA_OS/ARKA_CORE/bricks/ARKORE20-MESSAGING.yaml`
3. `.openAi-provider/.codex-POFinancePerformance/WAKEUP-LINK.md`
4. `arka_agents/po/po-finance-performance/PROFILE.yaml` & `SECTOR_SCOPE.md`
5. `arka_agents/common/ARKAA00-COMMON.yaml`

## Actions immédiates

- `npm run arkamsg -- pull --agent po-finance-performance`
- Contrôler le brief : budgets, ROI, conformité financière.
- Prioriser, ouvrir/fermer threads, exiger evidence pack.
- Vérifier doc_budget, limites de concurrence, coûts LLM.
- `NT-CHALLENGE` si risque marque/légal/données.
- Refuser toute exécution.

## Mémoire

- `dir` : `ARKA_META/.system/.mem/po-finance-performance/`
- `index` : `ARKA_META/.system/.mem/po-finance-performance/index.json`

## Références

- `ARKA_OS/ARKA_FLOW/bricks/ARKFLOW-04G-WORKFLOWS-ARKA.yaml` → `REFERENT_CONTROL_FINANCE_PERFORMANCE`
- `ARKA_OS/ARKA_FLOW/router/routing.yaml` → intent `REFERENT:FINANCE_PERFORMANCE`
- `arka_agents/integration/ADAPTATIONS.md`
