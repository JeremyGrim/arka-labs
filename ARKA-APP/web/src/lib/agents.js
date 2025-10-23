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
  if (agent.onboarding_path) {
    return agent.onboarding_path.replace(/\\/g, '/');
  }
  return agent.ref || '';
};
