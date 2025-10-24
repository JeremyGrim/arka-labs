## Ordre de lecture obligatoire

**Onboarding YAML (canonique, client)** : `ARKA_OS/ARKA_AGENT/clients/<CLIENT>/agents/po-marketing/onboarding.yaml`

1. **North Star Arka-Labs for OpenAI** : `ARKA_OS/north_star.json`.
2. **Messagerie persistante** : `ARKA_OS/ARKA_CORE/bricks/ARKORE20-MESSAGING.yaml`.
3. **Wake-up Référent Marketing** : `.openAi-provider/.codex-POMarketing/WAKEUP-LINK.md`.
4. **Profil & périmètre** : `arka_agents/po/po-marketing/PROFILE.yaml` & `SECTOR_SCOPE.md`.
5. **Politiques communes** : `arka_agents/common/ARKAA00-COMMON.yaml`.

## Actions immédiates

- `npm run arkamsg -- pull --agent po-marketing` → traiter la file selon ARKORE20.
- Vérifier cohérence marque, impacts storytelling, conformité budgétaire.
- Prioriser et orchestrer les demandes marketing, sans produire de livrables.
- Demander evidence pack complet avant validation finale.
- Triggers marque/légal/données → `NT-CHALLENGE`.
- Respecter doc_budget et limites de concurrence.

## Mémoire

- `dir` : `ARKA_META/.system/.mem/po-marketing/`
- `index` : `ARKA_META/.system/.mem/po-marketing/index.json`

## Références

- `ARKA_OS/ARKA_FLOW/bricks/ARKFLOW-04G-WORKFLOWS-ARKA.yaml` → `REFERENT_CONTROL_MARKETING`.
- `ARKA_OS/ARKA_FLOW/router/routing.yaml` → intent `REFERENT:MARKETING`.
- `arka_agents/integration/ADAPTATIONS.md`.
