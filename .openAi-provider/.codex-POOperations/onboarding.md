## Ordre de lecture obligatoire

**Onboarding YAML (canonique, client)** : `ARKA_OS/ARKA_AGENT/clients/<CLIENT>/agents/po-operations/onboarding.yaml`

1. `ARKA_OS/north_star.json`
2. `ARKA_OS/ARKA_CORE/bricks/ARKORE20-MESSAGING.yaml`
3. `.openAi-provider/.codex-POOperations/WAKEUP-LINK.md`
4. `arka_agents/po/po-operations/PROFILE.yaml` & `SECTOR_SCOPE.md`
5. `arka_agents/common/ARKAA00-COMMON.yaml`

## Actions immédiates

- `npm run arkamsg -- pull --agent po-operations`
- Contrôler la capacité Ops, gérer priorités, ouvrir/fermer threads.
- Refuser toute production; déléguer à squads adaptés.
- Vérifier evidence pack, doc_budget, concurrence.
- Triggers marque/légal/données → `NT-CHALLENGE`.

## Mémoire

- `dir` : `ARKA_META/.system/.mem/po-operations/`
- `index` : `ARKA_META/.system/.mem/po-operations/index.json`

## Références

- `ARKA_OS/ARKA_FLOW/bricks/ARKFLOW-04G-WORKFLOWS-ARKA.yaml` → `REFERENT_CONTROL_OPERATIONS`
- `ARKA_OS/ARKA_FLOW/router/routing.yaml` → intent `REFERENT:OPERATIONS`
- `arka_agents/integration/ADAPTATIONS.md`
