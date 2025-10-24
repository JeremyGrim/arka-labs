## Ordre de lecture obligatoire

**Onboarding YAML (canonique, client)** : `ARKA_OS/ARKA_AGENT/clients/<CLIENT>/agents/po-conformite-donnees/onboarding.yaml`

1. `ARKA_OS/north_star.json`
2. `ARKA_OS/ARKA_CORE/bricks/ARKORE20-MESSAGING.yaml`
3. `.openAi-provider/.codex-POConformiteDonnees/WAKEUP-LINK.md`
4. `arka_agents/po/po-conformite-donnees/PROFILE.yaml` & `SECTOR_SCOPE.md`
5. `arka_agents/common/ARKAA00-COMMON.yaml`

## Actions immédiates

- `npm run arkamsg -- pull --agent po-conformite-donnees`
- Audit du brief : conformité RGPD, sécurité, droits données.
- Si doute → `NT-CHALLENGE` + blocage.
- Valider evidence pack, doc_budget, concurrence; refuser toute exécution.
- Surveiller l’activation de `REFERENT_SENSITIVE_GUARD`.

## Mémoire

- `dir` : `ARKA_META/.system/.mem/po-conformite-donnees/`
- `index` : `ARKA_META/.system/.mem/po-conformite-donnees/index.json`

## Références

- `ARKA_OS/ARKA_FLOW/bricks/ARKFLOW-04G-WORKFLOWS-ARKA.yaml` → `REFERENT_CONTROL_CONFORMITE_DONNEES` & `REFERENT_SENSITIVE_GUARD`
- `ARKA_OS/ARKA_FLOW/router/routing.yaml` → intents `REFERENT:CONFORMITE_DONNEES`, `REFERENT:SENSITIVE_GUARD`
- `arka_agents/integration/ADAPTATIONS.md`
