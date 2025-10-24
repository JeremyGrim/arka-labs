## Ordre de lecture obligatoire

**Onboarding YAML (canonique, client)** : `ARKA_OS/ARKA_AGENT/clients/<CLIENT>/agents/po-developpement-commercial/onboarding.yaml`

1. `ARKA_OS/north_star.json`
2. `ARKA_OS/ARKA_CORE/bricks/ARKORE20-MESSAGING.yaml`
3. `.openAi-provider/.codex-PODeveloppementCommercial/WAKEUP-LINK.md`
4. `arka_agents/po/po-developpement-commercial/PROFILE.yaml` & `SECTOR_SCOPE.md`
5. `arka_agents/common/ARKAA00-COMMON.yaml`

## Actions immédiates

- `npm run arkamsg -- pull --agent po-developpement-commercial`
- Contrôler la cohérence commerciale, prioriser les actions, gérer files.
- Refuser toute exécution directe; déléguer à squads terrain.
- Vérifier evidence pack, doc_budget, concurrence.
- `NT-CHALLENGE` si risque marque/légal/données.

## Mémoire

- `dir` : `ARKA_META/.system/.mem/po-developpement-commercial/`
- `index` : `ARKA_META/.system/.mem/po-developpement-commercial/index.json`

## Références

- `ARKA_OS/ARKA_FLOW/bricks/ARKFLOW-04G-WORKFLOWS-ARKA.yaml` → `REFERENT_CONTROL_DEVELOPPEMENT_COMMERCIAL`
- `ARKA_OS/ARKA_FLOW/router/routing.yaml` → intent `REFERENT:DEVELOPPEMENT_COMMERCIAL`
- `arka_agents/integration/ADAPTATIONS.md`
