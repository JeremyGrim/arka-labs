import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, Loader2, Power } from 'lucide-react';
import { apiCall } from '../../config/api';

const formatActionLabel = (action) => {
  if (!action) {
    return '';
  }
  if (action.total !== undefined) {
    return `${action.value}/${action.total}`;
  }
  return action.value;
};

const formatTimestamp = (value) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  return date.toLocaleString('fr-FR');
};

const ActivityPanel = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runtime, setRuntime] = useState({ sessions: [], fallback: null, error: null });

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryData, runtimeData] = await Promise.all([
          apiCall('/api/hp/summary'),
          apiCall('/api/agents/runtime/sessions?client=ACME&provider=codex').catch((err) => ({
            sessions: [],
            fallback: err?.status === 503 ? err.detail || err.message : null,
            error: err?.message || null,
          })),
        ]);
        if (!active) {
          return;
        }
        setSummary(summaryData);
        if (runtimeData) {
          setRuntime({
            sessions: runtimeData.sessions || [],
            fallback: runtimeData.fallback || null,
            error: runtimeData.error || null,
            client: runtimeData.client,
            provider: runtimeData.provider,
          });
        } else {
          setRuntime({ sessions: [], fallback: null, error: null });
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Impossible de charger le résumé HP');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const actions = summary?.actions || [];
  const journal = summary?.journal || [];
  const validations = summary?.validations || { delivery: 0, architecture: 0 };
  const runtimeSessions = runtime?.sessions || [];

  const todayMetrics = useMemo(
    () => [
      {
        label: 'Sessions actives',
        value:
          runtimeSessions.length ||
          actions.find((action) => (action.label || '').toLowerCase().includes('session'))?.value || 0,
      },
      {
        label: 'Flows publiés',
        value: actions.find((action) => (action.label || '').toLowerCase().includes('flow'))?.value || 0,
      },
      {
        label: 'Validations delivery',
        value: validations.delivery || 0,
      },
      {
        label: 'Validations architecture',
        value: validations.architecture || 0,
      },
    ],
    [actions, validations]
  );

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) {
      return '—';
    }
    if (seconds < 60) {
      return `${seconds}s`;
    }
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remain = seconds % 60;
      return `${minutes}m${remain ? ` ${remain}s` : ''}`;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h${minutes ? ` ${minutes}m` : ''}`;
  };

  if (loading) {
    return (
      <div className="w-80 bg-[#0f1117] border-l border-gray-800 flex flex-col h-screen">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-400" size={28} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-80 bg-[#0f1117] border-l border-gray-800 flex flex-col h-screen">
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <AlertTriangle className="text-red-400" size={24} />
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-[#0f1117] border-l border-gray-800 flex flex-col h-screen relative">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">ARKA en activité</h2>
          <p className="text-sm text-gray-400">Synchronisé avec le backend FastAPI</p>
        </div>

        <div className="space-y-3">
          {['Orchestrateur', 'Runner'].map((service) => (
            <div key={service} className="flex items-center justify-between p-3 bg-[#1a1f2e] rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-emerald-500" size={16} />
                <span className="text-sm text-white">{service}</span>
              </div>
              <span className="text-xs text-emerald-500 font-medium">OK</span>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Actions clés</h3>
          <div className="space-y-3">
            {actions.map((action) => (
              <div key={action.label} className="p-3 bg-[#1a1f2e] rounded-lg border border-gray-800">
                <p className="text-sm text-gray-200 mb-1">{action.label}</p>
                <p className="text-xs text-gray-500">Valeur : {formatActionLabel(action)}</p>
                {action.target && (
                  <p className="text-xs text-blue-400 mt-1">Target : {action.target}</p>
                )}
              </div>
            ))}
            {actions.length === 0 && (
              <p className="text-xs text-gray-500">Aucune action enregistrée.</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Validations</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#1a1f2e] rounded-lg border border-gray-800">
              <p className="text-xs text-gray-400 mb-1">Delivery (AGP)</p>
              <p className="text-lg font-semibold text-white">{validations.delivery || 0}</p>
            </div>
            <div className="p-3 bg-[#1a1f2e] rounded-lg border border-gray-800">
              <p className="text-xs text-gray-400 mb-1">Architecture</p>
              <p className="text-lg font-semibold text-white">{validations.architecture || 0}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Sessions runtime</h3>
          <div className="space-y-3">
            {runtimeSessions.map((session) => (
              <div key={session.session} className="p-3 bg-[#1a1f2e] rounded-lg border border-gray-800">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-200">
                    <Power className="text-emerald-400" size={14} />
                    <span>{session.agent_slug || 'agent inconnu'}</span>
                  </div>
                  <span className="text-xs text-gray-500">{session.session}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Uptime : {formatDuration(session.uptime_seconds)}
                </div>
                {session.created_at && (
                  <div className="text-xs text-gray-500">
                    Démarré : {formatTimestamp(session.created_at)}
                  </div>
                )}
              </div>
            ))}
            {runtimeSessions.length === 0 && (
              <p className="text-xs text-gray-500">Aucune session tmux active côté backend.</p>
            )}
            {runtime?.fallback && (
              <p className="text-xs text-blue-400">
                Fallback CLI : {runtime.fallback}
              </p>
            )}
            {runtime?.error && (
              <p className="text-xs text-red-300">{runtime.error}</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Journal récent</h3>
          <div className="space-y-3">
            {journal.map((item, idx) => (
              <div key={`${item.timestamp}-${idx}`} className="p-3 bg-[#1a1f2e] rounded-lg border border-gray-800">
                <p className="text-sm text-gray-200 mb-1">{item.text}</p>
                <p className="text-xs text-gray-500">{formatTimestamp(item.timestamp)}</p>
              </div>
            ))}
            {journal.length === 0 && (
              <p className="text-xs text-gray-500">Aucune activité récente disponible.</p>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-[#0f1117] border-t border-gray-800 p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-3">Aujourd'hui</h3>
        <div className="grid grid-cols-2 gap-3">
          {todayMetrics.map((metric) => (
            <div key={metric.label} className="p-3 bg-[#1a1f2e] rounded-lg">
              <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
              <div className="text-xs text-gray-400">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityPanel;
