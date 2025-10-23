// Mock data for ARKA Application

export const flows = [
  {
    id: 'audit-rgpd',
    name: 'AUDIT:RGPD',
    category: 'audit',
    description: 'Évaluation RGPD/DPA complète',
    agents: ['AGP', 'Security Compliance Architect', 'Spec Writer'],
    duration: '2h',
    steps: 8,
    tags: ['compliance', 'rgpd', 'dpa']
  },
  {
    id: 'delivery-feature',
    name: 'DELIVERY:FEATURE',
    category: 'delivery',
    description: 'Feature → Epics → US → gate',
    agents: ['PMO', 'Lead Dev Bâtisseur', 'Technical Architect'],
    duration: '4h',
    steps: 12,
    tags: ['delivery', 'feature', 'development']
  },
  {
    id: 'audit-security',
    name: 'AUDIT:SECURITY',
    category: 'audit',
    description: 'Audit sécurité applicatif',
    agents: ['Security Compliance Architect', 'DevOps Guardian', 'AGP'],
    duration: '3h',
    steps: 10,
    tags: ['security', 'audit', 'pentest']
  },
  {
    id: 'ops-bugfix',
    name: 'OPS:BUGFIX',
    category: 'ops',
    description: 'Qualif → fix → test → gate → release notes',
    agents: ['FSX', 'QA Testeur', 'Lead Dev Bâtisseur'],
    duration: '1h30',
    steps: 6,
    tags: ['ops', 'bugfix', 'hotfix']
  },
  {
    id: 'mkt-campaign',
    name: 'MKT:CAMPAIGN',
    category: 'marketing',
    description: 'Research → plan → création → analytics',
    agents: ['Market Research Specialist', 'Content Strategy Manager', 'Growth Hacker Specialist'],
    duration: '5h',
    steps: 15,
    tags: ['marketing', 'campaign', 'growth']
  },
  {
    id: 'delivery-us',
    name: 'DELIVERY:US',
    category: 'delivery',
    description: 'Spécifier → Réaliser → Review → Gate → Publish',
    agents: ['Spec Writer', 'Lead Dev Bâtisseur', 'QA Testeur', 'AGP'],
    duration: '6h',
    steps: 18,
    tags: ['delivery', 'user-story', 'development']
  }
];

export const sessions = [
  {
    id: 'sess-001',
    client_id: 'client-acme',
    client_name: 'ACME Corp',
    flow_ref: 'audit-rgpd',
    flow_name: 'AUDIT:RGPD',
    status: 'running',
    current_step: 5,
    total_steps: 8,
    created_at: '2025-01-22T14:30:00Z',
    updated_at: '2025-01-22T16:45:00Z'
  },
  {
    id: 'sess-002',
    client_id: 'client-techcorp',
    client_name: 'TechCorp',
    flow_ref: 'delivery-feature',
    flow_name: 'DELIVERY:FEATURE',
    status: 'gated',
    current_step: 8,
    total_steps: 12,
    created_at: '2025-01-22T10:00:00Z',
    updated_at: '2025-01-22T15:20:00Z'
  },
  {
    id: 'sess-003',
    client_id: 'client-startup',
    client_name: 'StartupXYZ',
    flow_ref: 'ops-bugfix',
    flow_name: 'OPS:BUGFIX',
    status: 'completed',
    current_step: 6,
    total_steps: 6,
    created_at: '2025-01-22T08:00:00Z',
    updated_at: '2025-01-22T09:30:00Z'
  },
  {
    id: 'sess-004',
    client_id: 'client-enterprise',
    client_name: 'Enterprise SA',
    flow_ref: 'audit-security',
    flow_name: 'AUDIT:SECURITY',
    status: 'failed',
    current_step: 4,
    total_steps: 10,
    created_at: '2025-01-21T16:00:00Z',
    updated_at: '2025-01-21T18:30:00Z'
  },
  {
    id: 'sess-005',
    client_id: 'client-acme',
    client_name: 'ACME Corp',
    flow_ref: 'mkt-campaign',
    flow_name: 'MKT:CAMPAIGN',
    status: 'paused',
    current_step: 10,
    total_steps: 15,
    created_at: '2025-01-20T14:00:00Z',
    updated_at: '2025-01-22T11:00:00Z'
  }
];

export const sessionSteps = {
  'sess-001': [
    { id: 1, name: 'Scan fichiers', role: 'AGP', gate: false, status: 'completed', duration: '15min' },
    { id: 2, name: 'Analyse RGPD', role: 'Security Compliance Architect', gate: false, status: 'completed', duration: '25min' },
    { id: 3, name: 'Constats DPA', role: 'Security Compliance Architect', gate: false, status: 'completed', duration: '30min' },
    { id: 4, name: 'Gate: Validation constats', role: 'AGP', gate: true, status: 'completed', duration: '5min' },
    { id: 5, name: 'Spécification correctifs', role: 'Spec Writer', gate: false, status: 'running', duration: '-' },
    { id: 6, name: 'Revue finale', role: 'AGP', gate: false, status: 'pending', duration: '-' },
    { id: 7, name: 'Gate: Publication', role: 'AGP', gate: true, status: 'pending', duration: '-' },
    { id: 8, name: 'Evidence pack', role: 'AGP', gate: false, status: 'pending', duration: '-' }
  ],
  'sess-002': [
    { id: 1, name: 'Cadrage Feature', role: 'PMO', gate: false, status: 'completed', duration: '20min' },
    { id: 2, name: 'Architecture technique', role: 'Technical Architect', gate: false, status: 'completed', duration: '45min' },
    { id: 3, name: 'Décomposition Epics', role: 'PMO', gate: false, status: 'completed', duration: '30min' },
    { id: 4, name: 'Gate: Validation architecture', role: 'AGP', gate: true, status: 'completed', duration: '10min' },
    { id: 5, name: 'US #1 - Auth', role: 'Spec Writer', gate: false, status: 'completed', duration: '25min' },
    { id: 6, name: 'US #2 - Dashboard', role: 'Spec Writer', gate: false, status: 'completed', duration: '30min' },
    { id: 7, name: 'Implementation US #1', role: 'Lead Dev Bâtisseur', gate: false, status: 'completed', duration: '1h20' },
    { id: 8, name: 'Gate: Review US #1', role: 'AGP', gate: true, status: 'gated', duration: '-' },
    { id: 9, name: 'Implementation US #2', role: 'Lead Dev Bâtisseur', gate: false, status: 'pending', duration: '-' },
    { id: 10, name: 'Tests intégration', role: 'QA Testeur', gate: false, status: 'pending', duration: '-' },
    { id: 11, name: 'Gate: Release', role: 'AGP', gate: true, status: 'pending', duration: '-' },
    { id: 12, name: 'Documentation', role: 'Spec Writer', gate: false, status: 'pending', duration: '-' }
  ]
};

export const projects = [
  {
    id: 'proj-001',
    name: 'Transformation Digitale',
    client_id: 'client-acme',
    client_name: 'ACME Corp',
    status: 'active',
    sessions_count: 12,
    messages_count: 248,
    agents_count: 8,
    created_at: '2025-01-15T10:00:00Z',
    last_activity: '2025-01-22T16:45:00Z'
  },
  {
    id: 'proj-002',
    name: 'Refonte Architecture',
    client_id: 'client-techcorp',
    client_name: 'TechCorp',
    status: 'active',
    sessions_count: 8,
    messages_count: 156,
    agents_count: 6,
    created_at: '2025-01-10T14:00:00Z',
    last_activity: '2025-01-22T15:20:00Z'
  },
  {
    id: 'proj-003',
    name: 'Audit Sécurité Q1',
    client_id: 'client-enterprise',
    client_name: 'Enterprise SA',
    status: 'paused',
    sessions_count: 4,
    messages_count: 89,
    agents_count: 4,
    created_at: '2025-01-05T09:00:00Z',
    last_activity: '2025-01-21T18:30:00Z'
  }
];

export const threads = [
  {
    id: 'thread-001',
    project_id: 'proj-001',
    title: 'Architecture Decisions',
    participants: ['AGP', 'Technical Architect', 'Owner'],
    messages_count: 45,
    last_message: 'Validation de l\'ADR-003 pour la structure microservices',
    updated_at: '2025-01-22T16:30:00Z'
  },
  {
    id: 'thread-002',
    project_id: 'proj-001',
    title: 'RGPD Compliance Review',
    participants: ['Security Compliance Architect', 'Owner'],
    messages_count: 28,
    last_message: 'Evidence pack généré pour l\'audit',
    updated_at: '2025-01-22T15:45:00Z'
  },
  {
    id: 'thread-003',
    project_id: 'proj-002',
    title: 'Feature Delivery Sprint 1',
    participants: ['PMO', 'Lead Dev Bâtisseur', 'QA Testeur'],
    messages_count: 67,
    last_message: 'US-001 en attente de review',
    updated_at: '2025-01-22T15:20:00Z'
  }
];

export const messages = {
  'thread-001': [
    {
      id: 'msg-001',
      sender: 'Technical Architect',
      sender_type: 'agent',
      content: 'Proposition d\'ADR-003 : Architecture microservices avec API Gateway',
      timestamp: '2025-01-22T14:00:00Z',
      attachments: ['adr-003-draft.md']
    },
    {
      id: 'msg-002',
      sender: 'Owner',
      sender_type: 'human',
      content: 'Approuvé. Quels sont les impacts sur les délais ?',
      timestamp: '2025-01-22T14:15:00Z',
      attachments: []
    },
    {
      id: 'msg-003',
      sender: 'AGP',
      sender_type: 'agent',
      content: 'Impact estimé : +2 semaines pour migration. Gate de validation créé.',
      timestamp: '2025-01-22T14:30:00Z',
      attachments: ['impact-analysis.json']
    },
    {
      id: 'msg-004',
      sender: 'Technical Architect',
      sender_type: 'agent',
      content: 'ADR-003 finalisé et publié. Documentation mise à jour.',
      timestamp: '2025-01-22T16:30:00Z',
      attachments: ['adr-003-final.md']
    }
  ]
};

export const agents = [
  { id: 1, name: 'AGP', role: 'Gouvernance', status: 'active', projects: 3 },
  { id: 2, name: 'PMO', role: 'Gouvernance', status: 'active', projects: 2 },
  { id: 3, name: 'Lead Dev Bâtisseur', role: 'Tech', status: 'active', projects: 2 },
  { id: 4, name: 'Technical Architect', role: 'Tech', status: 'active', projects: 2 },
  { id: 5, name: 'DevOps Guardian', role: 'Tech', status: 'idle', projects: 1 },
  { id: 6, name: 'Security Compliance Architect', role: 'Tech', status: 'active', projects: 2 },
  { id: 7, name: 'QA Testeur', role: 'Tech', status: 'active', projects: 1 },
  { id: 8, name: 'UX/UI Design Guardian', role: 'Tech', status: 'idle', projects: 0 },
  { id: 9, name: 'Market Research Specialist', role: 'Marketing', status: 'idle', projects: 0 },
  { id: 10, name: 'Growth Hacker Specialist', role: 'Marketing', status: 'idle', projects: 0 },
  { id: 11, name: 'Spec Writer', role: 'Tech', status: 'active', projects: 2 },
  { id: 12, name: 'FSX', role: 'Tech', status: 'idle', projects: 0 }
];

export const dashboardStats = {
  sessions: {
    running: 2,
    paused: 1,
    gated: 1,
    completed_24h: 3,
    failed: 1
  },
  steps_24h: 45,
  messages_24h: 128,
  active_projects: 2
};
