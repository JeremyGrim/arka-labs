# ARKA_EXT

Couche extensions : packs d’abonnements et de scripts pour brancher des automations sans modifier ARKA_CORE.

## Comment ça marche ?
- Créez un fichier `ARKAEXTXX-<slug>.yaml` déclarant `override:`, `subscriptions:` ou `scripts:`.
- Référencez le pack dans le profil (`profiles/*.override.yaml`) pour l’activer.
- Les scripts locaux résident dans `scripts/handlers/` et sont invoqués via l’Event Bus (`ARKORE16`).

## Exemple minimal
```yaml
id: ARKAEXT01-SUBS-CI
version: 1.0.0
override:
  ARKORE16-EVENT-BUS:
    subscriptions:
      - on: US_CREATED
        using: local
        run: "scripts/handlers/us_created__issue_links.js"
```

## Bonnes pratiques
- Toujours définir `isolation: true` et versionner chaque pack (SemVer).
- Cibler des topics existants (`ARKORE16-EVENT-BUS.yaml`) ; documenter tout nouveau handler.
- Les scripts doivent rester idempotents ; tester localement via `tests/events/local-run.sh`.

## Tests
| Commande | Objectif |
| --- | --- |
| `npm run validate` (si configuré) | Vérifie existence des handlers référencés |
| `node ../ARKA_CORE/tests/events/local-run.sh` | Simulation d’un event pour déboguer |
