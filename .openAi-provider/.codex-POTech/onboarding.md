## Ordre de lecture obligatoire

**Onboarding YAML (canonique, client)** : `ARKA_OS/ARKA_AGENT/clients/<CLIENT>/agents/po-tech/onboarding.yaml`

1. `ARKA_OS/north_star.json`
2. `ARKA_OS/ARKA_CORE/bricks/ARKORE20-MESSAGING.yaml`
3. `.openAi-provider/.codex-POTech/WAKEUP-LINK.md`
4. `arka_agents/po/po-tech/PROFILE.yaml` et `SECTOR_SCOPE.md`
5. `arka_agents/common/ARKAA00-COMMON.yaml`

## Actions immédiates

- `npm run arkamsg -- pull --agent po-tech`
- Contrôler le brief d’ARKA : architecture, impact sécurité, dépendances.
- Prioriser/ordonner, ouvrir/fermer threads selon capacité squads tech.
- Vérifier evidence pack, doc_budget, limites de concurrence.
- Déclencher `NT-CHALLENGE` si marque/légal/données ou si architecture critique.
- Refuser toute exécution directe.

## Mémoire

- `dir` : `ARKA_META/.system/.mem/po-tech/`
- `index` : `ARKA_META/.system/.mem/po-tech/index.json`

## Références

- `ARKA_OS/ARKA_FLOW/bricks/ARKFLOW-04G-WORKFLOWS-ARKA.yaml` → `REFERENT_CONTROL_TECH`
- `ARKA_OS/ARKA_FLOW/router/routing.yaml` → intent `REFERENT:TECH`
- `arka_agents/integration/ADAPTATIONS.md`
