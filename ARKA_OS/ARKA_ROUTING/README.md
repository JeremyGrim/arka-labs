# ARKA_ROUTING

GPS d’ARKA : lookup, catalog et resolve multi-facettes pour connecter une intention, un flow, un doc, un agent et ses capacités.

## Fonctionnalités
- `lookup` : terme / alias → intent canonique.
- `resolve` : intent/terme → `flow_ref`, rôles suggérés (CAPAMAP), agents candidats (via onboarding).
- `catalog` : explorer `flow`, `agent`, `doc`, `term`, `capability`.
- `serve` : exposition HTTP légère (`/ping`, `/lookup`, `/resolve`, `/catalog`).

## Configuration
`bricks/ARKAROUTING-03-CONFIG.yaml` peut rester minimal ; le script autodétecte `ARKA_OS`. Pour personnaliser :
```yaml
paths:
  os_root: ../ARKA_OS
  flow: ../ARKA_OS/ARKA_FLOW
  core: ../ARKA_OS/ARKA_CORE
  agents: ../ARKA_OS/ARKA_AGENT
options:
  doc_frontmatter_key: arkaref
  max_results: 50
```

## Commandes clés
```bash
python arkarouting.py lookup --term "rgpd"
python arkarouting.py resolve --intent AUDIT:RGPD --client ACME
python arkarouting.py catalog --facet agent --client ACME
python arkarouting.py serve --port 8087
```

## Tests
| Commande | Objectif |
| --- | --- |
| `python ../scripts/test/ci_resolve_all.py .` | Garantit intents ↔ flow_ref cohérents (pré-requis) |
| `python arkarouting.py resolve --term <alias>` | Vérification manuelle rapide |

## Points d’attention
- Chaque wake-up / onboarding doit inclure `routing_ref: ARKA_ROUTING` pour rappeler le GPS.
- `catalog --facet doc` nécessite des docs avec front-matter `arkaref`.
- Exposer `serve` derrière un reverse proxy si partagé (port par défaut au choix).
