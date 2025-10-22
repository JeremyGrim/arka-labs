# ARKA_OS — Documentation Technique Complète

**Version:** 2.0.0  
**Status:** Pre-Beta  
**Date:** 22 Octobre 2025  
**Licence:** MIT

---

## 📋 Table des Matières

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Architecture du Système](#2-architecture-du-système)
3. [Installation & Configuration](#3-installation--configuration)
4. [Composants Principaux](#4-composants-principaux)
5. [Système de Notifications](#5-système-de-notifications)
6. [Module Workflow](#6-module-workflow)
7. [Gestion des Agents](#7-gestion-des-agents)
8. [PMO & Contraintes Opérationnelles](#8-pmo--contraintes-opérationnelles)
9. [API & Intégrations](#9-api--intégrations)
10. [Développement](#10-développement)
11. [Troubleshooting](#11-troubleshooting)
12. [Roadmap](#12-roadmap)

---

## 1. Vue d'Ensemble

### 1.1 Qu'est-ce qu'ARKA_OS ?

**ARKA_OS** est un système d'orchestration multi-agents LLM avec gouvernance stricte, conçu comme un "Microsoft Project pour équipes d'IA". Il transforme une constitution complexe en **clés d'action simples** pour orchestrer des équipes d'agents spécialisés.

### 1.2 Problème Résolu

```
❌ Sans ARKA : 1 LLM + 1000 lignes de prompt = dérive, confusion, mock APIs
✅ Avec ARKA  : 1 LLM + 5 lignes = expert focalisé et efficace
```

### 1.3 Principes Fondamentaux

- **Modularité** : Architecture en briques indépendantes
- **Traçabilité** : Append-only logs, evidence packs obligatoires
- **Gouvernance** : Gates AGP, validation croisée, hiérarchie stricte
- **Extensibilité** : Event Bus, packs d'extensions (ARKA_EXT)
- **Multi-provider** : Support GPT-5, Claude Opus, Gemini

---

## 2. Architecture du Système

### 2.1 Structure Globale

```
┌────────────────────────────────────────────────┐
│              ARKA_OS (READ-ONLY)               │
│                                                 │
│  ┌──────────┬──────────┬───────────────────┐  │
│  │ARKA_CORE │ARKA_PROFIL│  ARKA_AGENT      │  │
│  │(Moteur)  │ (Droits) │  (Config Client) │  │
│  └──────────┴──────────┴───────────────────┘  │
│  ┌──────────┬──────────┬───────────────────┐  │
│  │ARKA_FLOW │ ARKA_EXT │  ARKA_ROUTING    │  │
│  │(Workflows│(Plugins) │  (Resolver)       │  │
│  └──────────┴──────────┴───────────────────┘  │
└────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────┐
│          ARKA_META (RUNTIME ISOLÉ)             │
│                                                 │
│  ┌──────────┬─────────┬──────────┬──────────┐ │
│  │ .system  │  INPUT  │  OUTPUT  │messaging │ │
│  │(Runtime) │(Entrées)│(Artefacts│(Channels)│ │
│  └──────────┴─────────┴──────────┴──────────┘ │
└────────────────────────────────────────────────┘
```

### 2.2 Principe d'Isolation

**Séparation stricte READ-ONLY vs RUNTIME :**

| Composant | Type | Modification | Usage |
|-----------|------|--------------|-------|
| **ARKA_CORE** | READ-ONLY | Jamais | Moteur gouvernance |
| **ARKA_PROFIL** | READ-ONLY | Jamais | Gestion droits |
| **ARKA_AGENT** | CUSTOMIZABLE | Client | Config agents |
| **ARKA_META** | RUNTIME | Agents | Données projet |

**Avantage :** Évolutions système sans casser clients, customisations sans polluer core.

### 2.3 Arborescence Détaillée

```
ARKA_OS/
├── ARKA_CORE/                  # Moteur de gouvernance
│   ├── bricks/                 # 22 briques ARKORE*
│   │   ├── ARKORE01-HIERARCHY.yaml
│   │   ├── ARKORE08-PATHS-GOVERNANCE.yaml
│   │   ├── ARKORE12-ACTION-KEYS.yaml
│   │   ├── ARKORE14-MEMORY-OPS.yaml
│   │   ├── ARKORE15-AGP-REACTIVE-CONTROL.yaml
│   │   ├── ARKORE16-EVENT-BUS.yaml
│   │   ├── ARKORE20-MESSAGING.yaml
│   │   └── ARKORE22-INTENT-NOTIFY.yaml
│   ├── build/                  # Bundles assemblés
│   ├── docs/                   # Documentation système
│   ├── scripts/                # Handlers événements
│   ├── master-assembly.yaml    # Config assemblage
│   └── readme.md
│
├── ARKA_PROFIL/                # Gestion des permissions
│   ├── bricks/                 # 8 briques ARKPR*
│   │   ├── ARKPR08-PROFILES-CATALOG.yaml
│   │   └── ARKPR20-WAKEUP-POLICIES.yaml
│   └── build/
│
├── ARKA_AGENT/                 # Configuration agents
│   ├── client/acme/            # Client exemple
│   │   ├── experts/            # Expert cards (ARKA_AGENT*)
│   │   ├── wakeup/             # Wake-up configs (ARKAA08-*)
│   │   ├── docs/               # Guides agents
│   │   └── ARKAA21-PROJECT-CONTEXT.yaml
│   └── experts/                # Catalogue global experts
│
├── ARKA_FLOW/                  # Workflows métier
│   ├── bricks/                 # 16 chaînes de workflows
│   │   ├── ARKFLOW-04A-WORKFLOWS-AUDIT.yaml
│   │   ├── ARKFLOW-04B-WORKFLOWS-DELIVERY.yaml
│   │   ├── ARKFLOW-04C-WORKFLOWS-DOC.yaml
│   │   └── ...
│   └── ARKFLOW00-INDEX.yaml
│
├── ARKA_ROUTING/               # Résolution intents → workflows
│   ├── arkarouting.py          # CLI/API Python
│   └── bricks/
│
├── ARKA_EXT/                   # Packs d'extensions
│   ├── README-EXT.md
│   └── ARKAEXT*-*.yaml
│
├── ARKA_META/                  # Runtime (gitignored)
│   ├── .system/
│   │   ├── .mem/               # Mémoires agents
│   │   ├── .index/
│   │   ├── .config/
│   │   └── Governance/         # Ordres, CR, logs
│   ├── INPUT/                  # Documents client
│   ├── OUTPUT/                 # Artefacts générés
│   └── messaging/              # Fils de messages
│       ├── general.yaml
│       ├── agents/             # inbox/outbox par agent
│       └── msg/                # Threads
│
├── bin/                        # Scripts build/run
│   ├── os-build.sh
│   ├── os-run.sh
│   ├── generate-wakeup-matrix.mjs
│   └── os-validate.mjs
│
├── package.json                # NPM scripts
└── readme.md
```

---

## 3. Installation & Configuration

### 3.1 Prérequis

**Système :**
- **OS:** Windows 11 (WSL2) / Linux / macOS
- **Node.js:** >= 18.0.0
- **Ruby:** >= 3.0.0 (pour parsing YAML)
- **Python:** >= 3.8 (pour ARKA_ROUTING)
- **Git:** Dernière version

**Outils optionnels :**
- **tmux:** Pour gestion sessions agents (Linux/WSL)
- **PowerShell:** >= 7.0 (Windows)

### 3.2 Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/votre-org/ARKA_OS.git
cd ARKA_OS

# 2. Installer dépendances Node
npm install

# 3. Builder les assemblages
npm run build
# Équivalent à:
# bash bin/os-build.sh (Linux/macOS)
# pwsh bin/os-build.ps1 (Windows)

# 4. Valider l'installation
npm run validate
```

**Sortie attendue :**
```
✓ ARKORE00-INDEX.yaml updated
✓ All brick references resolved
✓ No duplicate exports found
✓ Contracts validated
✓ Wakeup matrix generated
```

### 3.3 Configuration Initiale

#### 3.3.1 Créer un Nouveau Client

```bash
# Copier la structure client exemple
cp -r ARKA_AGENT/client/acme ARKA_AGENT/client/votre-client

# Éditer le contexte projet
vim ARKA_AGENT/client/votre-client/ARKAA21-PROJECT-CONTEXT.yaml
```

#### 3.3.2 Configurer ARKA_META

```bash
# Créer l'arborescence runtime
mkdir -p ARKA_META/{.system/{.mem,.index,.config,Governance},INPUT,OUTPUT,messaging}

# Initialiser la messagerie
mkdir -p ARKA_META/messaging/{agents,msg}
touch ARKA_META/messaging/general.yaml
```

#### 3.3.3 Variables d'Environnement

```bash
# .env (racine du projet)
ARKA_META_PATH=./ARKA_META
ARKA_CLIENT=votre-client
ARKA_PROVIDER=codex  # ou claude, gemini
ARKA_LOG_LEVEL=info
```

---

## 4. Composants Principaux

### 4.1 ARKA_CORE — Moteur de Gouvernance

**22 briques modulaires :**

| Brique | Rôle | Exports Clés |
|--------|------|--------------|
| **ARKORE01** | Hiérarchie & autorités | Rôles (Owner, AGP, PMO...) |
| **ARKORE02** | Règles globales | Principes, contraintes |
| **ARKORE08** | Chemins & gouvernance | Routes, paths, ownership |
| **ARKORE09** | Patterns de nommage | Regex (FEAT, EPIC, US...) |
| **ARKORE12** | Action Keys (96 actions) | API LLMs compacte |
| **ARKORE13** | Templates | Modèles Markdown |
| **ARKORE14** | Memory Ops | MEMORY_UPDATE, persistence |
| **ARKORE15** | AGP Reactive Control | Contrôle sans pause |
| **ARKORE16** | Event Bus | Topics, dispatch, hooks |
| **ARKORE20** | Messagerie | Inbox/outbox, threads |
| **ARKORE22** | Intent Notify | Notifications typées |

**Principe clé :** Une règle = une source de vérité. Ailleurs = références.

**Exemple :**
```yaml
# Au lieu de dupliquer
path: "ARKA_META/OUTPUT/features/${featureId}"

# On référence
path_ref: ARKORE08-PATHS-GOVERNANCE:path_templates.feature_dir
```

### 4.2 Action Keys — API pour LLMs

**96 actions disponibles** organisées par groupes :

```yaml
# Exemple US_CREATE
US_CREATE:
  inputs:
    featureId: string
    epicId: string
    usId: string
    title: string
    kebab_title: string
  outputs:
    path: string
    files: [readme.md, acceptance_checklist.md]
  refs:
    route: ARKORE08:path_templates.us_dir
    regex: ARKORE09:regex.user_story
    template: ARKORE13:templates.us.readme
    acceptance: ARKORE05:acceptance.functional_ok
  post:
    - ARKORE14:MEMORY_UPDATE
```

**Utilisation LLM :**
```python
# Le LLM appelle simplement
action = "US_CREATE"
payload = {
    "featureId": "FEAT-12",
    "epicId": "EPIC-12-03",
    "usId": "US-12-03-07",
    "title": "Export CSV",
    "kebab_title": "export-csv"
}

# ARKA résout les refs et exécute
result = arka_execute(action, payload)
```

### 4.3 ARKA_PROFIL — Gestion des Permissions

**8 briques de permissions :**

| Brique | Rôle |
|--------|------|
| **ARKPR08** | Catalogue profils (AGP, PMO, Lead Dev...) |
| **ARKPR03** | Action sets (CRUD par type) |
| **ARKPR09** | Permission compact format |
| **ARKPR20** | Wake-up policies |

**Format compact :**
```yaml
# Permissions agent
permissions:
  - "ticket:*"        # Tout sur tickets
  - "document:cru"    # Create/Read/Update documents
  - "report:cr"       # Create/Read reports
  - "-delete"         # Jamais delete
```

### 4.4 ARKA_AGENT — Configuration Agents

**Structure par agent :**

```
ARKA_AGENT/client/acme/
├── experts/
│   └── ARKA_AGENT04-lead-dev-batisseur.yaml  # Expert card
├── wakeup/
│   └── ARKAA08-WAKEUP-LEAD_DEV.yaml          # Wake-up config
└── ARKAA19-AGENT-CAPABILITIES.yaml           # Permissions
```

**Composants obligatoires :**

1. **Expert Card** — Définition métier
```yaml
id: lead-dev-batisseur
expertise:
  domains: [development, testing, ci_cd]
  skills: [coding, debugging, test_automation]
capabilities:
  do:
    - "Implémenter features techniques"
    - "Écrire tests unitaires"
  dont:
    - "Décider architecture"
    - "Créer ADR"
```

2. **Wake-up Config** — Configuration runtime
```yaml
id: ARKAA08-WAKEUP-LEAD_DEV
use_profile_ref: ARKPR08-PROFILES-CATALOG:profiles.lead-dev-batisseur
project_context_ref: ARKAA21-PROJECT-CONTEXT:vars
memory:
  dir: ARKA_META/.system/.mem/lead-dev/
available_intents:
  - TICKET_CREATE
  - TICKET_UPDATE
  - DOCUMENT_CREATE
```

3. **Capabilities** — Permissions détaillées
```yaml
agents:
  lead-dev-batisseur:
    use_profile: lead-dev
    permissions:
      - "ticket:*"
      - "document:cru"
      - "-delete"
```

---

## 5. Système de Notifications

### 5.1 Architecture Messagerie

**Principe :** Communication inter-agents **exclusivement** via messagerie persistante.

```
ARKA_META/messaging/
├── general.yaml              # Index global
├── agents/
│   ├── pmo/
│   │   ├── inbox.yaml        # Messages entrants
│   │   └── outbox.yaml       # Messages sortants
│   └── lead-dev/
│       ├── inbox.yaml
│       └── outbox.yaml
└── msg/
    └── 2025-10-22T14-30__onboarding/  # Thread
        ├── TODO__pmo@leaddev__onboarding.yaml
        ├── IN_PROGRESS__pmo@leaddev__onboarding.yaml
        ├── RESULT__leaddev@pmo__completed.yaml
        └── Attachments/
```

### 5.2 Format Message Standard

```yaml
tid: T-129834
type: STATUS | RESULT
status: TODO | IN_PROGRESS | BLOCKED | OBSOLETE
from: pmo
to: lead-dev
thread_id: THR-1f3b9c__onboarding
relates_to: msg-20251020-0001
sujet: "Implémenter authentification OAuth"
message: |
  1. Ack
  2. Créer ticket TCK-AUTH-001
  3. Implémenter OAuth2 flow
  4. Écrire tests (coverage > 80%)
  5. Envoyer résultat avec evidences

links:
  attachments:
    - ./Attachments/spec-oauth.pdf
  output:
    - ARKA_META/OUTPUT/features/FEAT-12/auth-impl.md
```

### 5.3 Types de Notifications (NT)

#### NT-A2A-MESSAGE_TO_RESULT (Agent → Agent)

```json
{
  "nt_id": "NT-A2A-MESSAGE_TO_RESULT",
  "from_agent": "pmo",
  "to_agent": "lead-dev",
  "resource": {
    "type": "message",
    "pointer": "msg-20251020-0001"
  },
  "intent.key": "EXECUTE_DELIVERABLE",
  "constraints": ["NO_TIME", "EXECUTE_NOW"]
}
```

**Workflow :**
1. READ message (marquage lecture)
2. Exécuter ordre référencé
3. Envoyer réponse (RESULT)
4. Mettre à jour session

#### NT-HUMAN-INLINE_EXEC (Humain → Agent)

```json
{
  "nt_id": "NT-HUMAN-INLINE_EXEC",
  "from_human": "owner",
  "to_agent": "archiviste",
  "resource": {
    "inline_message": "Auditer ARKA_OS/ARKA_CORE/"
  },
  "constraints": ["NO_TIME", "EXECUTE_NOW"]
}
```

### 5.4 Ordres Standardisés (8 types)

| Ordre | Usage | Workflow |
|-------|-------|----------|
| **ORDER_SPEC** | Spécification | READ → ANALYZE → SPEC_DRAFT → SEND |
| **ORDER_ANALYSE** | Analyse | READ → ANALYZE → REPORT_BUILD → SEND |
| **ORDER_RÉDACTION** | Rédaction | READ → CONTEXT → WRITE → SEND |
| **ORDER_INFO_REQUEST** | Demande d'infos (≤3 questions) | READ → GAP_LIST → QUESTIONS → SEND |
| **ORDER_INTERMEDIATE_RESPONSE** | Réponse intermédiaire | READ → SUMMARY → NEXT_ACTIONS_PROPOSE |
| **ORDER_FINAL_DELIVERY_OWNER** | Livraison finale | READ → DELIVERY_PACK → SUBMIT_TO_OWNER → CLOSE |
| **ORDER_ESCALATE_TO_PMO** | Escalade PMO | READ → ESCALATION_NOTE → SEND(to=PMO) |
| **ORDER_ESCALATE_TO_OWNER** | Escalade Owner (PMO/AGP only) | READ → OWNER_PACKET → SEND(to=OWNER) |

**Anti-boucles strictes :**
- 1× INFO_REQUEST / thread
- 1× INTERMEDIATE_RESPONSE / thread
- 1× ESCALATE_TO_PMO et 1× ESCALATE_TO_OWNER / thread

### 5.5 Statuts Autorisés

| Statut | Signification | Transition |
|--------|---------------|------------|
| **TODO** | Sélectionné, non démarré | → IN_PROGRESS |
| **IN_PROGRESS** | Exécution en cours | → BLOCKED / RESULT |
| **BLOCKED** | Bloqué (cause claire) | → IN_PROGRESS / OBSOLETE |
| **OBSOLETE** | Supplanté/périmé | Fin (pointer vers correct) |

**Fin de travail = `type: RESULT`** (jamais "STATUS: complete")

### 5.6 Règles Critiques

1. **Canal unique** : Toutes réponses via messagerie (jamais chat après notify)
2. **Aucun ACK LLM** : Les agents NE produisent JAMAIS d'ACK
3. **Pas de polling** : Aucune relève sans notification
4. **Format strict** : `[Notification-Auto] @DEST — ptr:msg:<ID>`
5. **Option A - Attach Only** : Pas de création auto de session

### 5.7 CLI Messagerie (`arkamsg`)

```bash
# Lire messages entrants
arkamsg pull --agent lead-dev

# Marquer comme lu
arkamsg mark-read --message-id msg-20251020-0001

# Envoyer message
arkamsg send --from pmo --to lead-dev \
  --thread THR-XXX --relates-to msg-YYY \
  --type RESULT --body "Implémentation terminée"
```

---

## 6. Module Workflow

### 6.1 Catalogue des Workflows (16 chaînes)

**Famille AUDIT (6 workflows) :**
- **AUDIT:FILES** — Scan fichiers → constats → gate
- **AUDIT:TREE** — Évaluation structure/nommage
- **AUDIT:RGPD** — Évaluation RGPD/DPA
- **AUDIT:COMPLIANCE** — Conformité normes
- **AUDIT:FEATURE** — Impacts/dépendances
- **AUDIT:ACCOUNTING** — Contrôles comptables

**Famille DELIVERY (3 workflows) :**
- **DELIVERY:EPIC** — Cadrage Epic → US
- **DELIVERY:FEATURE** — Feature → US → gate
- **DELIVERY:US** — Spécifier → Réaliser → Review → Gate → Publish

**Famille DOC (2 workflows) :**
- **DOC:ADR** — ADR draft → review → gate core → merge
- **DOC:CONTENT** — Brief → rédaction → gate → publish

**Famille OPS (3 workflows) :**
- **OPS:BUGFIX** — Qualif → fix → test → gate → RN
- **OPS:SECURITY** — Audit sécu → remédiation → gate
- **OPS:DATA_REPORT** — Extract → analyse → report

**Famille MKT (1 workflow) :**
- **MKT:CAMPAIGN** — Research → plan → création → analytics

**Famille PEOPLE (1 workflow) :**
- **PEOPLE:HR_CHANGE** — Diag → roadmap → gate → déploiement

### 6.2 Exemple Détaillé : DELIVERY_US_CHAIN

```yaml
DELIVERY_US_CHAIN:
  sequence:
    # Step 1: Intake
    - step: Intake
      action_key: INTAKE
      requires_caps: [mission.qualify]
      select_actor:
        required_caps: [mission.qualify]
    
    # Step 2: Specify
    - step: Specify
      action_key: SPEC_DRAFT
      requires_caps: [spec.write]
      requires:
        - prev_step: Intake
          type: RESULT
    
    # Step 3: Do_Work
    - step: Do_Work
      action_key: DO_WORK
      requires_caps_any: [dev.implement, content.plan]
      requires:
        - prev_step: Specify
          type: RESULT
    
    # Step 4: Review
    - step: Review
      action_key: REVIEW
      requires_caps_any: [pmo.review, arch.design]
      requires:
        - prev_step: Do_Work
          type: RESULT
    
    # Step 5: Gate
    - step: Gate
      action_key: GATE_FINAL
      gate_select:
        choose:
          - when:
              any_tag: [adr, core]
            actor: Archiviste
          - default: AGP
      requires:
        - prev_step: Review
          type: RESULT
    
    # Step 6: Publish
    - step: Publish
      action_key: PUBLISH
      requires_caps_any: [devops.guard]
      requires:
        - prev_step: Gate
          type: RESULT
```

### 6.3 Principes des Workflows

**1. Single Thread Policy :**
```yaml
policy:
  single_thread: true
  require_result_to_advance: true
  timeout_sec: 3600
```

**2. Sélection Dynamique d'Acteurs :**
```yaml
select_actor:
  use: ARKFLOW-17-ORCHESTRATION-RULES:actor_selector
  required_caps: [dev.implement]
```

Le système sélectionne automatiquement l'agent avec les capacités requises.

**3. Gates Conditionnels :**
```yaml
gate_select:
  choose:
    - when:
        any_tag: [adr, core, security]
      actor: Archiviste
    - default: AGP
```

**4. Chaînage de Workflows :**
```yaml
- step: US_Cycle
  use_chain: DELIVERY_US_CHAIN  # Appelle un autre workflow
```

### 6.4 Routing avec ARKA_ROUTING

```bash
# Lister tous les workflows
python ARKA_ROUTING/arkarouting.py catalog --facet flow

# Résoudre un intent
python ARKA_ROUTING/arkarouting.py resolve \
  --intent "AUDIT:RGPD" \
  --client ACME

# Sortie:
{
  "intent": "AUDIT:RGPD",
  "flow_ref": "ARKFLOW-04A-WORKFLOWS-AUDIT:AUDIT_RGPD_CHAIN",
  "steps": [...],
  "first_actor_candidates": ["mission-qualifier", "compliance-officer"]
}
```

---

## 7. Gestion des Agents

### 7.1 Écosystème d'Agents (14+)

| Agent | Spécialité | Provider | Actions Principales |
|-------|------------|----------|---------------------|
| **AGP** | Gouvernance & ADR | GPT-5/Codex | ORDER_*, DECISION_*, GATE_* |
| **PMO** | Orchestration | Claude | WORKFLOW_PLAN, DELEGATION_CREATE |
| **Lead Dev** | Développement | Claude/Opus | TICKET_*, DOCUMENT_CREATE |
| **Technical Architect** | Architecture | GPT-4 | ADR_CREATE, PLAN_CREATE |
| **DevOps Guardian** | Infrastructure | - | REPORT_CREATE, monitoring |
| **QA Testeur** | Qualité | - | TICKET_CREATE (bugs), REPORT_* |
| **UX/UI Guardian** | Design | - | DOCUMENT_*, PLAN_* |
| **Security Architect** | Sécurité | - | ANALYSIS_*, audits |
| **Market Research** | Veille | Gemini | ANALYSIS_CREATE, sourcing |
| **Archiviste** | Documentation | - | ARCHIVE_CAPTURE, traçabilité |
| **Mission Qualifier** | Évaluation | - | ANALYSIS_*, scoring |
| **Outreach** | Communication | - | DOCUMENT_*, messaging |
| **Pipeline Tracker** | Suivi | - | REPORT_*, dashboards |
| **Spec Writer** | Spécifications | - | FEATURE_CREATE, EPIC_CREATE, US_CREATE |

### 7.2 Configuration d'un Agent

**Étape 1 : Expert Card**

```yaml
# ARKA_AGENT/client/acme/experts/ARKA_AGENT30-spec-writer.yaml
id: spec-writer
name: "Spec Writer — Ingénieur Spécifications"
role: "Transformer ADR en spécifications techniques"

expertise:
  domains: [specification_engineering, technical_writing]
  skills:
    - technical_specification_writing
    - requirements_engineering
    - api_specification

capabilities:
  do:
    - "Analyser ADR pour extraire requirements"
    - "Écrire features avec contexte architectural"
    - "Décomposer en epics"
  dont:
    - "Coder ou implémenter"
    - "Estimer en temps"
```

**Étape 2 : Wake-up Config**

```yaml
# ARKA_AGENT/client/acme/wakeup/ARKAA08-WAKEUP-SPEC_WRITER.yaml
id: ARKAA08-WAKEUP-SPEC_WRITER
version: 1.0.0
agent_id: spec-writer

use_profile_ref: ARKPR08-PROFILES-CATALOG:profiles.spec-writer
capabilities_ref: ARKAA19-AGENT-CAPABILITIES:agents.spec-writer
project_context_ref: ARKAA21-PROJECT-CONTEXT:vars

memory:
  dir: ARKA_META/.system/.mem/spec-writer/
  index: ARKA_META/.system/.mem/spec-writer/index.json

available_intents:
  - FEATURE_CREATE  # Requiert ADR_EXISTS
  - EPIC_CREATE     # Requiert FEATURE_EXISTS
  - US_CREATE       # Requiert EPIC_EXISTS

messaging:
  inbox_ref: ARKA_META/messaging/agents/spec-writer/inbox.yaml
  outbox_ref: ARKA_META/messaging/agents/spec-writer/outbox.yaml
  ack_policy: immediate

startup:
  sequence: [resolve_profile, mount_memory, check_messages]
  default_intent: FEATURE_CREATE
```

**Étape 3 : Capabilities**

```yaml
# ARKA_AGENT/client/acme/ARKAA19-AGENT-CAPABILITIES.yaml
agents:
  spec-writer:
    use_profile: spec-writer
    permissions:
      - "feature:cru"
      - "epic:cru"
      - "us:cru"
      - "document:cru"
      - "-delete"
    default_map: FEATURE_CREATE
```

### 7.3 Lancer un Agent

```bash
# Via script PowerShell (Windows/WSL)
pwsh ARKA_CORE/management/sessions_agents/Start-ArkaEnv.ps1 \
  -Agents spec-writer \
  -Provider codex \
  -Project arka-labs

# Via tmux direct (Linux)
tmux new-session -s arka-spec-writer -c /path/to/repo
tmux send-keys -t arka-spec-writer "codex" C-m
# Puis injecter onboarding...
```

---

## 8. PMO & Contraintes Opérationnelles

### 8.1 Rôle du PMO

**Le PMO (Product Manager Officer)** est l'orchestrateur principal :

- **Responsabilités :**
  - Planifier sprints et backlogs
  - Créer/déléguer Features, Epics, US
  - Coordonner les agents spécialisés
  - Suivre vélocité et KPIs
  - Produire rapports hebdomadaires

- **Interdictions :**
  - Coder ou implémenter
  - Modifier la gouvernance
  - Court-circuiter l'AGP
  - Valider son propre travail

### 8.2 Contrainte Opérationnelle CRITIQUE

**⚠️ PMO peut gérer MAX 2 agents simultanément + gate + son travail propre**

Cette contrainte est **fondamentale** pour :
- Éviter surcharge cognitive
- Garantir qualité orchestration
- Maintenir traçabilité
- Permettre escalades efficaces

**Architecture PMO simplifiée :**

```yaml
# ARKAA08-WAKEUP-PMO.yaml (version contrainte)
delegation:
  mode: Task
  max_parallel_agents: 2  # LIMITATION STRICTE
  max_delegations_per_agent: 3
  timeout_minutes: 30

specializations:
  orchestration:
    max_parallel_agents: 2  # Répété pour clarté
    agent_pool:
      slot_1: [lead-dev, technical-architect]
      slot_2: [qa-testeur, devops-guardian]
    rotation_policy: "Finir avant démarrer nouveau"

workflow:
  typical_sprint:
    - Phase 1: PMO + Spec Writer
      agents: [spec-writer]
      output: Features/Epics/US specs
    
    - Phase 2: PMO + Lead Dev + QA
      agents: [lead-dev, qa-testeur]  # MAX 2
      output: Implémentation + tests
    
    - Phase 3: PMO + DevOps (si nécessaire)
      agents: [devops-guardian]
      output: Déploiement
    
    - Gate AGP: Entre chaque phase
```

**Conséquences architecturales :**

1. **Workflow séquentiel** : Pas de multi-équipes en parallèle
2. **Spec Writer dédié** : Sépare conception (Spec Writer) de coordination (PMO)
3. **Gates fréquents** : Validation AGP entre phases
4. **Escalades claires** : Si blocage, escalade immédiate Owner

**Évolution future** : Multi-équipes nécessite PMO instances multiples (hors scope V2.0)

---

## 9. API & Intégrations

### 9.1 ARKA_ROUTING CLI

```bash
# Ping
python ARKA_ROUTING/arkarouting.py ping

# Cataloguer workflows
python ARKA_ROUTING/arkarouting.py catalog --facet flow

# Cataloguer agents
python ARKA_ROUTING/arkarouting.py catalog --facet agent --client ACME

# Lookup intent
python ARKA_ROUTING/arkarouting.py lookup --term "rgpd"

# Résoudre workflow
python ARKA_ROUTING/arkarouting.py resolve \
  --intent "AUDIT:RGPD" \
  --client ACME
```

### 9.2 ARKA_ROUTING HTTP API

```bash
# Lancer serveur
python ARKA_ROUTING/arkarouting.py serve --port 8087

# Requêtes HTTP
curl http://localhost:8087/ping
curl http://localhost:8087/catalog?facet=flow
curl "http://localhost:8087/resolve?intent=AUDIT:RGPD&client=ACME"
```

### 9.3 Event Bus (ARKORE16)

**Topics disponibles :**

```yaml
topics:
  - US_CREATED
  - EPIC_CREATED
  - FEATURE_CREATED
  - TICKET_CREATED
  - MEMORY_UPDATED
  - DELIVERY_RECEIVED
  - GATE_PASSED
  - GATE_FAILED
```

**Subscription via Extension Pack :**

```yaml
# ARKA_EXT/ARKAEXT01-GITHUB.yaml
id: ARKAEXT01-GITHUB
version: 1.0.0
override:
  ARKORE16-EVENT-BUS:
    subscriptions:
      - on: US_CREATED
        using: webhook
        url: https://api.github.com/repos/{owner}/{repo}/issues
        payload_template: |
          {
            "title": "${usId} — ${title}",
            "body": "${description}",
            "labels": ["user-story"]
          }
```

---

## 10. Développement

### 10.1 Scripts NPM

```bash
# Build complet
npm run build

# Validation (intents, wakeups, refs)
npm run validate

# Lint wakeups
npm run lint:wakeups

# Générer matrice wake-up
npm run build:matrix
```

### 10.2 Structure de Commit

```bash
feat(ARKORE12): add NEW_ACTION support
fix(ARKORE16): resolve event dispatch issue  
docs(README): update installation steps
test(integration): add end-to-end scenarios
```

### 10.3 Ajouter une Nouvelle Brique

```yaml
# ARKA_CORE/bricks/ARKORE23-NEW-BRICK.yaml
id: ARKORE23-NEW-BRICK
version: 1.0.0
title: "Nouvelle fonctionnalité"
summary: "Description courte"
maintainers: ["votre-nom"]
exports:
  nouvelle_fonctionnalite:
    key1: value1
    key2: value2
provides: ["nouvelle_fonctionnalite"]
requires: ["ARKORE01-HIERARCHY@>=1.0.0"]
contracts:
  invariants:
    - "Règle 1"
    - "Règle 2"
change_policy:
  compatibility: semver
```

```bash
# Rebuild
npm run build

# Valider
npm run validate
```

### 10.4 Ajouter un Nouvel Agent

```bash
# 1. Expert card
cat > ARKA_AGENT/client/acme/experts/ARKA_AGENT99-new-agent.yaml

# 2. Wake-up config
cat > ARKA_AGENT/client/acme/wakeup/ARKAA08-WAKEUP-NEW_AGENT.yaml

# 3. Capabilities
vim ARKA_AGENT/client/acme/ARKAA19-AGENT-CAPABILITIES.yaml

# 4. Rebuild matrix
npm run build:matrix

# 5. Tester
pwsh Start-ArkaEnv.ps1 -Agents new-agent -Provider codex
```

---

## 11. Troubleshooting

### 11.1 Problèmes Fréquents

**Erreur : "Brick not found"**

```bash
# Vérifier index
cat ARKA_CORE/ARKORE00-INDEX.yaml | grep ARKORE12

# Rebuild
npm run build
```

**Erreur : "Reference not resolved"**

```bash
# Valider les références
npm run validate

# Chercher référence manquante
grep -r "ARKORE12-ACTION-KEYS" ARKA_CORE/bricks/
```

**Agent ne démarre pas**

```bash
# Vérifier profil existe
grep "spec-writer" ARKA_PROFIL/bricks/ARKPR08-PROFILES-CATALOG.yaml

# Vérifier mémoire
ls -la ARKA_META/.system/.mem/spec-writer/

# Créer si manquant
mkdir -p ARKA_META/.system/.mem/spec-writer/log/
```

**Messages non livrés**

```bash
# Vérifier inbox
cat ARKA_META/messaging/agents/lead-dev/inbox.yaml

# Vérifier sessions tmux
tmux ls | grep arka

# Relancer agent
pwsh Start-ArkaEnv.ps1 -Agents lead-dev -Provider codex
```

### 11.2 Logs & Debugging

```bash
# Logs agents
tail -f ARKA_META/.system/.mem/{agent}/log/$(date +%Y-%m-%d).jsonl

# Logs messagerie
cat ARKA_META/messaging/general.yaml

# Logs gouvernance
ls -lt ARKA_META/.system/Governance/logs/
```

---

## 12. Roadmap

### 12.1 Version Actuelle (2.0.0 Pre-Beta)

**Livrés :**
- ✅ 22 briques CORE modulaires
- ✅ 96 Action Keys
- ✅ 16 workflows métier
- ✅ 14+ agents spécialisés
- ✅ Système messagerie complet
- ✅ Event Bus extensible
- ✅ ARKA_ROUTING CLI/API

**Limitations connues :**
- ⚠️ PMO limité à 2 agents simultanés
- ⚠️ Pas de multi-tenancy
- ⚠️ Monitoring basique
- ⚠️ Tests E2E incomplets

### 12.2 Prochaines Étapes (Q1 2026)

**Phase 1 : Stabilisation**
- [ ] Tests E2E complets (couverture 80%+)
- [ ] Documentation consolidée (GitBook)
- [ ] Tutorial interactif
- [ ] ARKA_LITE (version simplifiée)

**Phase 2 : Scalabilité**
- [ ] PMO multi-instances (orchestration distribuée)
- [ ] Queue avec priorités
- [ ] Monitoring & observabilité (Grafana/Prometheus)
- [ ] Dashboard agents temps réel

**Phase 3 : Intégrations**
- [ ] Jira, GitHub, GitLab
- [ ] Slack, Teams notifications
- [ ] Support modèles open-source (Llama, Mistral)
- [ ] Marketplace d'agents

### 12.3 Vision Long Terme (2026+)

- **SaaS multi-tenant** : ARKA Cloud Platform
- **Certification ARKA Developers**
- **Templates industrie** (fintech, healthtech, e-commerce)
- **AI-powered PMO** : Orchestration autonome intelligente

---

## 13. Conclusion

ARKA_OS est un **système d'orchestration multi-agents LLM mature** avec :

- ✅ **Architecture modulaire** exemplaire
- ✅ **Gouvernance stricte** (AGP gates, evidence packs)
- ✅ **Traçabilité complète** (append-only logs, JSONL memory)
- ✅ **Extensibilité** (Event Bus, packs ARKA_EXT)
- ✅ **Multi-provider** (GPT, Claude, Gemini)

**Contraintes acceptées :**
- PMO limité à 2 agents simultanés (V2.0)
- Workflow séquentiel (pas multi-équipes)
- Complexité initiale élevée

**Pour démarrer :**
1. Installer prérequis (Node, Ruby, Python)
2. Cloner dépôt et build
3. Configurer client dans ARKA_AGENT
4. Lancer agents via Start-ArkaEnv.ps1
5. Consulter guides agents

---

## 📚 Ressources Complémentaires

- **README Principal** : `readme.md`
- **Guide Agents** : `ARKA_AGENT/client/acme/docs/agents-configuration-guide.md`
- **Architecture CORE** : `ARKA_CORE/docs/ARCHITECTURE.md`
- **Messagerie** : `ARKA_CORE/docs/MESSAGERIE.md`
- **Plan Migration** : `ARKA_AGENT/client/acme/docs/agents-migration-plan.md`
- **ARKA_ROUTING** : `ARKA_ROUTING/README-ARKA_ROUTING.md`

---

**Licence :** MIT  
**Contact :** support@arka-labs.com  
**Construit avec ❤️ pour révolutionner l'orchestration d'équipes LLM**