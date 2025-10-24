import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Loader,
  Power,
  FileText,
  AlertTriangle,
  X,
  Play,
  Square,
  BellRing,
} from 'lucide-react';
import { apiCall } from '../../config/api';
import {
  buildAgentSummary,
  formatAgentTitle,
  getContextMeta,
  getStateMeta,
  inferAgentCategory,
} from '../../lib/agents';

const RUNTIME_ACTIONS = {
  start: {
    method: 'POST',
    url: '/api/agents/runtime/start',
    label: 'Démarrage',
    icon: Play,
  },
  stop: {
    method: 'POST',
    url: '/api/agents/runtime/stop',
    label: 'Arrêt',
    icon: Square,
  },
  wake: {
    method: 'POST',
    url: '/api/agents/runtime/wakeup',
    label: 'Wake-up',
    icon: BellRing,
  },
};

const MANAGE_SCRIPT_PATH = 'ARKA_OS/ARKA_CORE/management/sessions_agents/Manage-ArkaAgents.ps1';

const AgentsPage = () => {
  const CLIENT_CODE = 'ACME';
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stateFilter, setStateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [bulkAction, setBulkAction] = useState({ running: false, type: null });
  const [onboardingViewer, setOnboardingViewer] = useState({
    open: false,
    loading: false,
    agent: null,
    filename: null,
    content: '',
    error: null,
  });
  const [selectedAgentIds, setSelectedAgentIds] = useState(new Set());
  const [pendingAgentIds, setPendingAgentIds] = useState(new Set());

  useEffect(() => {
    if (!onboardingViewer.open) {
      return undefined;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [onboardingViewer.open]);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall(`/api/agents/directory?client=${CLIENT_CODE}`);
      setAgents(data.agents || []);
    } catch (err) {
      setError(err.message || 'Impossible de charger l’annuaire des agents');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [CLIENT_CODE]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    setSelectedAgentIds((prev) => {
      const next = new Set();
      agents.forEach((agent) => {
        if (prev.has(agent.agent_id)) {
          next.add(agent.agent_id);
        }
      });
      return next;
    });
  }, [agents]);

  const selectedAgents = useMemo(
    () => agents.filter((agent) => selectedAgentIds.has(agent.agent_id)),
    [agents, selectedAgentIds]
  );

  const categories = useMemo(() => {
    const map = new Map();
    agents.forEach((agent) => {
      const category = inferAgentCategory(agent);
      const current = map.get(category.id) || { id: category.id, label: category.label, count: 0 };
      current.count += 1;
      map.set(category.id, current);
    });
    return [{ id: 'all', label: 'Tous', count: agents.length }, ...Array.from(map.values())];
  }, [agents]);

  const stateOptions = useMemo(() => {
    const counts = agents.reduce(
      (acc, agent) => {
        const { state } = getStateMeta(agent);
        acc[state] = (acc[state] || 0) + 1;
        return acc;
      },
      { awake: 0, sleep: 0, degraded: 0 }
    );
    return [
      { id: 'all', label: 'Tous', count: agents.length },
      { id: 'awake', label: 'Éveillés', count: counts.awake || 0 },
      { id: 'sleep', label: 'En veille', count: counts.sleep || 0 },
      { id: 'degraded', label: 'Dégradés', count: counts.degraded || 0 },
    ];
  }, [agents]);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const category = inferAgentCategory(agent);
      const matchesCategory = categoryFilter === 'all' || category.id === categoryFilter;
      const { state } = getStateMeta(agent);
      const matchesState = stateFilter === 'all' || state === stateFilter;
      return matchesCategory && matchesState;
    });
  }, [agents, categoryFilter, stateFilter]);

  const allVisibleSelected = useMemo(() => {
    if (filteredAgents.length === 0) {
      return false;
    }
    return filteredAgents.every((agent) => selectedAgentIds.has(agent.agent_id));
  }, [filteredAgents, selectedAgentIds]);

  const viewOnboarding = async (agent) => {
    setActionError(null);
    setOnboardingViewer({
      open: true,
      loading: true,
      agent,
      filename: null,
      content: '',
      error: null,
    });
    try {
      const data = await apiCall(
        `/api/agents/onboarding?client=${CLIENT_CODE}&agent_id=${encodeURIComponent(agent.agent_id)}`
      );
      setOnboardingViewer((prev) => ({
        ...prev,
        loading: false,
        filename: data.filename,
        content: data.content,
      }));
    } catch (err) {
      console.error('Onboarding fetch failed', err);
      setOnboardingViewer((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Onboarding indisponible',
      }));
      setActionError(err.message || 'Impossible de charger le dossier onboarding');
    }
  };

  const clearSelection = useCallback(() => {
    setSelectedAgentIds(new Set());
  }, []);

  const toggleSelection = useCallback((agentId) => {
    setSelectedAgentIds((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  }, []);


  const syncAgentState = useCallback(async (agentId, state) => {
    try {
      await apiCall('/api/agents/directory', {
        method: 'PATCH',
        body: { client: CLIENT_CODE, agent_id: agentId, state },
      });
    } catch (err) {
      console.error('Patch agent state failed', err);
    }
  }, [CLIENT_CODE]);
  const selectVisibleAgents = useCallback(() => {
    setSelectedAgentIds(new Set(filteredAgents.map((agent) => agent.agent_id)));
  }, [filteredAgents]);

  const triggerRuntimeAction = useCallback(
    async (kind, agentIds) => {
      const action = RUNTIME_ACTIONS[kind];
      if (!action || !agentIds || agentIds.length === 0) {
        return null;
      }
      setBulkAction({ running: true, type: kind });
      setPendingAgentIds(new Set(agentIds));
      setActionError(null);
      setActionSuccess(null);
      try {
        const response = await apiCall(action.url, {
          method: action.method,
          body: {
            client: CLIENT_CODE,
            agents: agentIds,
          },
        });
        const statusLines = Array.isArray(response?.results)
          ? response.results
              .map((entry) => {
                const detail = entry.detail ? ` (${entry.detail})` : '';
                return `${entry.agent_id} → ${entry.status}${detail}`;
              })
              .join(', ')
          : `${agentIds.length} agent(s) traités`;
        const fallbackHint = response?.fallback
          ? ` · Fallback script : ${response.fallback}`
          : '';
        setActionSuccess(`${action.label} — ${statusLines}${fallbackHint}`);

        const nextState = kind === 'start' || kind === 'wake' ? 'awake' : kind === 'stop' ? 'sleep' : null;
        if (nextState) {
          await Promise.all(agentIds.map((id) => syncAgentState(id, nextState)));
        }
        await fetchAgents();
        return response;
      } catch (err) {
        const detail =
          err?.status === 404 || err?.status === 501
            ? `${action.label} indisponible côté backend. Utilise temporairement ${MANAGE_SCRIPT_PATH}.`
            : err?.message || `Impossible d'exécuter ${action.label.toLowerCase()}.`;
        setActionError(detail);
        return null;
      } finally {
        setBulkAction({ running: false, type: null });
        setPendingAgentIds(new Set());
      }
    },
    [CLIENT_CODE, fetchAgents, syncAgentState]
  );

  const performBulkAction = useCallback(
    async (kind) => {
      if (selectedAgents.length === 0) {
        return;
      }
      const response = await triggerRuntimeAction(
        kind,
        selectedAgents.map((agent) => agent.agent_id)
      );
      if (response) {
        clearSelection();
      }
    },
    [selectedAgents, triggerRuntimeAction, clearSelection]
  );

  const handleCardAction = useCallback(
    async (agentId, kind) => {
      await triggerRuntimeAction(kind, [agentId]);
    },
    [triggerRuntimeAction]
  );

  const closeOnboarding = () => {
    setOnboardingViewer({
      open: false,
      loading: false,
      agent: null,
      filename: null,
      content: '',
      error: null,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c111e] p-8">
        <Loader className="animate-spin text-blue-400" size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0c111e] p-8 flex flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle className="text-red-400" size={28} />
        <p className="text-sm text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c111e] p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Annuaire des Agents</h1>
        <p className="text-gray-400">Référentiel ACME importé depuis ARKA_OS</p>
      </div>

      <div className="bg-[#10172a] border border-gray-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-gray-300">
            <span className="font-medium text-white">{selectedAgents.length}</span> agent(s) sélectionné(s)
          </div>
          <div className="flex flex-wrap gap-2">
            {['start', 'wake', 'stop'].map((key) => {
              const action = RUNTIME_ACTIONS[key];
              const Icon = action.icon;
              const pending = bulkAction.running && bulkAction.type === key;
              const disabled = selectedAgents.length === 0 || pending;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => performBulkAction(key)}
                  disabled={disabled}
                  className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${
                    disabled
                      ? 'border-gray-700 bg-[#0c111e] text-gray-500 cursor-not-allowed'
                      : 'border-blue-500/40 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20'
                  }`}
                >
                  {pending ? <Loader className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
          <button
            type="button"
            onClick={selectVisibleAgents}
            disabled={filteredAgents.length === 0 || allVisibleSelected}
            className="rounded-md border border-gray-700 px-3 py-1 hover:border-blue-400 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tout sélectionner (vue courante)
          </button>
          <button
            type="button"
            onClick={clearSelection}
            disabled={selectedAgents.length === 0}
            className="rounded-md border border-gray-700 px-3 py-1 hover:border-blue-400 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Effacer la sélection
          </button>
          <span className="hidden md:inline text-gray-500">
            Fallback CLI : {MANAGE_SCRIPT_PATH}
          </span>
        </div>
      </div>

      {actionError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-lg">
          {actionError}
        </div>
      )}

      {actionSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-200 text-sm px-4 py-3 rounded-lg">
          {actionSuccess}
        </div>
      )}

      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 justify-between text-xs text-gray-500">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={selectVisibleAgents}
              disabled={filteredAgents.length === 0 || allVisibleSelected}
              className="rounded-md border border-gray-700 px-3 py-1 hover:border-blue-400 hover:text-white transition disabled:opacity-50"
            >
              Tout sélectionner (vue)
            </button>
            <button
              type="button"
              onClick={clearSelection}
              disabled={selectedAgents.length === 0}
              className="rounded-md border border-gray-700 px-3 py-1 hover:border-blue-400 hover:text-white transition disabled:opacity-50"
            >
              Effacer la sélection
            </button>
          </div>
          <span>
            Runtime direct indisponible&nbsp;? Utilise temporairement <span className="text-blue-300">{MANAGE_SCRIPT_PATH}</span>.
          </span>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Ensemble :</span>
            {stateOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setStateFilter(option.id)}
                className={`px-4 py-2 rounded-lg bg-[#0c111e] text-gray-400 hover:text-white hover:bg-blue-500/10 transition-all text-sm ${
                  stateFilter === option.id ? 'border border-blue-400 text-blue-300' : ''
                }`}
              >
                {option.label}
                <span className="text-xs text-gray-500 ml-1">
                  {option.id === 'all' ? option.count : `(${option.count})`}
                </span>
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-gray-700" />

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Rôle :</span>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setCategoryFilter(category.id)}
                  className={`px-4 py-2 rounded-lg bg-[#0c111e] text-gray-400 hover:text-white hover:bg-blue-500/10 transition-all text-sm ${
                    categoryFilter === category.id ? 'border border-blue-400 text-blue-300' : ''
                  }`}
                >
                  {category.label} ({category.count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAgents.map((agent) => {
          const category = inferAgentCategory(agent);
          const stateMeta = getStateMeta(agent);
          const contextMeta = getContextMeta(agent);
          const isSelected = selectedAgentIds.has(agent.agent_id);
          return (
            <div
              key={agent.agent_id}
              className={`rounded-xl p-6 transition-all border ${
                isSelected ? 'bg-[#1d2336] border-blue-500/60 shadow-[0_0_0_1px_rgba(56,189,248,0.35)]' : 'bg-[#1a1f2e] border-gray-800 hover:border-gray-700'
              }`}
            >
              <label className="flex items-start justify-between gap-3 cursor-pointer mb-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-5 w-5 accent-blue-500 cursor-pointer"
                    checked={isSelected}
                    onChange={() => toggleSelection(agent.agent_id)}
                  />
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stateMeta.iconBg}`}>
                    <Power className={stateMeta.iconColor} size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{formatAgentTitle(agent)}</h3>
                    <p className="text-sm text-gray-500">{agent.agent_id}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {category.label} · {stateMeta.label}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full ${contextMeta.badgeBg} ${contextMeta.badgeColor}`}
                >
                  {contextMeta.label}
                </span>
              </label>

              <div className="flex flex-wrap gap-2 mt-3">
                {['start', 'wake', 'stop'].map((key) => {
                  const action = RUNTIME_ACTIONS[key];
                  const Icon = action.icon;
                  const isPending =
                    bulkAction.running && bulkAction.type === key && pendingAgentIds.has(agent.agent_id);
                  const disabled = bulkAction.running;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleCardAction(agent.agent_id, key)}
                      disabled={disabled}
                      className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${
                        disabled
                          ? 'border-gray-700 bg-[#0c111e] text-gray-500 cursor-not-allowed'
                          : 'border-blue-500/40 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20'
                      }`}
                    >
                      {isPending ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
                      {action.label}
                    </button>
                  );
                })}
                <button
                  className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
                  title="Voir onboarding"
                  onClick={() => viewOnboarding(agent)}
                >
                  <FileText size={16} />
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-3 break-all">{buildAgentSummary(agent)}</p>
            </div>
          );
        })}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-12 text-gray-400">Aucun agent ne correspond au filtre.</div>
      )}

      {onboardingViewer.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => (!onboardingViewer.loading ? closeOnboarding() : null)}
            role="presentation"
          />
          <div className="relative z-10 w-full max-w-3xl rounded-xl border border-gray-700 bg-[#0c111e] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Onboarding — {onboardingViewer.agent?.agent_id}
                </h2>
                <p className="text-sm text-gray-500">
                  {onboardingViewer.filename || 'Fichier onboarding'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeOnboarding}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-lg bg-[#1a1f2e] border border-gray-800 p-4">
              {onboardingViewer.loading && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader className="animate-spin" size={16} /> Chargement du contenu...
                </div>
              )}
              {!onboardingViewer.loading && onboardingViewer.error && (
                <div className="text-sm text-red-300">{onboardingViewer.error}</div>
              )}
              {!onboardingViewer.loading && !onboardingViewer.error && (
                <pre className="whitespace-pre-wrap text-xs text-gray-300">
                  {onboardingViewer.content}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentsPage;
