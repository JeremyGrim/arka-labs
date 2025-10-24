const CATEGORY_RULES = [
  {
    id: 'gouvernance',
    label: 'Gouvernance',
    keywords: ['agp', 'core guardian', 'pmo', 'archiviste', 'governance', 'guardian'],
  },
  {
    id: 'tech',
    label: 'Technique',
    keywords: [
      'lead dev',
      'dev',
      'architect',
      'tech',
      'engineer',
      'qa',
      'security',
      'infra',
      'runner',
      'orchestrator',
    ],
  },
  {
    id: 'delivery',
    label: 'Delivery',
    keywords: ['spec', 'delivery', 'scribe', 'bâtisseur', 'builder', 'project'],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    keywords: ['marketing', 'brand', 'growth', 'content', 'analytics'],
  },
  {
    id: 'commerce',
    label: 'Commerce',
    keywords: ['mission qualifier', 'outreach', 'pipeline', 'sales', 'commerce', 'positioning'],
  },
  {
    id: 'rh',
    label: 'RH',
    keywords: ['rh', 'hr', 'human', 'experience', 'learning', 'people', 'talent'],
  },
  {
    id: 'ops',
    label: 'Opérations',
    keywords: ['ops', 'operation', 'support'],
  },
];

const slugify = (value) =>
  value
    .toString()
    .trim()
    .toLowerCase();

export const humanize = (value) =>
  value
    ? value
        .replace(/[-_/]+/g, ' ')
        .replace(/\s+/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : '';

export const inferAgentCategory = (agent) => {
  const target = slugify(agent?.role || agent?.agent_id || '');
  if (!target) {
    return { id: 'autres', label: 'Autres' };
  }

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => target.includes(keyword))) {
      return { id: rule.id, label: rule.label };
    }
  }

  return { id: 'autres', label: 'Autres' };
};

export const formatAgentTitle = (agent) =>
  agent?.role?.trim()
    ? agent.role
    : humanize(agent?.agent_id || agent?.ref?.split('/').pop() || 'Agent');

export const buildAgentSummary = (agent) => {
  if (!agent) {
    return '';
  }

  const summaryParts = [];

  if (agent.ref) {
    const normalizedRef = agent.ref.replace(/\\/g, '/');
    const segments = normalizedRef.split('/');
    const client = segments.length > 1 ? segments[1] : null;
    const identifier = segments.pop();
    if (client) {
      summaryParts.push(`Client ${client}`);
    }
    if (identifier) {
      summaryParts.push(`Réf ${humanize(identifier)}`);
    }
  }

  if (agent.onboarding_path) {
    const normalized = agent.onboarding_path.replace(/\\/g, '/');
    const file = normalized.split('/').pop();
    if (file) {
      summaryParts.push(`Onboarding ${file}`);
    }
  }

  if (agent.created_at) {
    const created = new Date(agent.created_at);
    if (!Number.isNaN(created.getTime())) {
      summaryParts.push(`Sync ${created.toLocaleDateString('fr-FR')}`);
    }
  }

  return summaryParts.join(' · ');
};

export const STATE_META = {
  awake: {
    label: 'Éveillé',
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-400',
    badgeBg: 'bg-green-500/10',
    badgeColor: 'text-green-400',
    actionLabel: 'Mettre en veille',
    nextState: 'sleep',
  },
  sleep: {
    label: 'En veille',
    iconBg: 'bg-gray-500/10',
    iconColor: 'text-gray-400',
    badgeBg: 'bg-gray-500/10',
    badgeColor: 'text-gray-400',
    actionLabel: 'Réveiller',
    nextState: 'awake',
  },
  degraded: {
    label: 'Dégradé',
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-400',
    badgeBg: 'bg-orange-500/10',
    badgeColor: 'text-orange-300',
    actionLabel: 'Réinitialiser',
    nextState: 'awake',
  },
};

export const CONTEXT_META = {
  nominal: {
    label: 'Contexte nominal',
    badgeBg: 'bg-slate-500/10',
    badgeColor: 'text-slate-300',
  },
  low: {
    label: 'Contexte faible',
    badgeBg: 'bg-orange-500/10',
    badgeColor: 'text-orange-300',
  },
  critical: {
    label: 'Contexte critique',
    badgeBg: 'bg-red-500/10',
    badgeColor: 'text-red-400',
  },
};

export const getStateMeta = (agent) => {
  const state = agent?.state && STATE_META[agent.state] ? agent.state : 'awake';
  return { state, ...STATE_META[state] };
};

export const getContextMeta = (agent) => {
  const context = agent?.context_status && CONTEXT_META[agent.context_status] ? agent.context_status : 'nominal';
  return { context, ...CONTEXT_META[context] };
};
