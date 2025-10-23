import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  Clock,
  Loader2,
  MessageSquare,
  Play,
  RotateCcw,
  Terminal,
  Users,
} from 'lucide-react';
import { apiCall } from '../../config/api';

const ACTION_PALETTE = [
  { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'text-blue-400', hover: 'hover:bg-blue-500/20 hover:border-blue-500/40' },
  { bg: 'bg-green-500/10', border: 'border-green-500/20', icon: 'text-green-400', hover: 'hover:bg-green-500/20 hover:border-green-500/40' },
  { bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: 'text-purple-400', hover: 'hover:bg-purple-500/20 hover:border-purple-500/40' },
  { bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: 'text-orange-400', hover: 'hover:bg-orange-500/20 hover:border-orange-500/40' },
];

const pickActionIcon = (label = '') => {
  const normalized = label.toLowerCase();
  if (normalized.includes('session') || normalized.includes('mission')) return Play;
  if (normalized.includes('reprendre') || normalized.includes('relancer')) return RotateCcw;
  if (normalized.includes('équipe') || normalized.includes('team')) return Users;
  if (normalized.includes('terminal') || normalized.includes('console')) return Terminal;
  return Play;
};

const actionLabel = (action) => (typeof action === 'string' ? action : action?.label || 'Action');

const actionValue = (action) => {
  if (action && typeof action === 'object') {
    if (action.total !== undefined && action.total !== null) {
      const value = action.value ?? 0;
      return `${value}/${action.total}`;
    }
    if (action.value !== undefined && action.value !== null) {
      return action.value;
    }
  }
  return '';
};

const formatRelative = (iso) => {
  if (!iso) return 'n/a';
  const date = new Date(iso);
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return "À l'instant";
  if (diffSeconds < 3600) return `Il y a ${Math.floor(diffSeconds / 60)} min`;
  if (diffSeconds < 86400) return `Il y a ${Math.floor(diffSeconds / 3600)} h`;
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

const formatDateTime = (iso) => {
  if (!iso) return 'n/a';
  const date = new Date(iso);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusClasses = (status) => {
  const normalized = (status || 'active').toLowerCase();
  switch (normalized) {
    case 'active':
      return 'bg-green-500/10 text-green-300 border border-green-500/30';
    case 'attention':
    case 'warning':
      return 'bg-orange-500/10 text-orange-300 border border-orange-500/30';
    case 'paused':
    case 'sleep':
      return 'bg-gray-500/10 text-gray-300 border border-gray-500/30';
    default:
      return 'bg-gray-700/20 text-gray-300 border border-gray-600/40';
  }
};

const statusLabel = (status) => {
  const normalized = (status || 'active').toLowerCase();
  switch (normalized) {
    case 'active':
      return 'Actif';
    case 'attention':
    case 'warning':
      return 'Attention';
    case 'paused':
    case 'sleep':
      return 'En veille';
    default:
      return status || 'N/A';
  }
};

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectKey, setSelectedProjectKey] = useState(null);
  const [projectThreads, setProjectThreads] = useState([]);
  const [projectMeta, setProjectMeta] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detailsError, setDetailsError] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const errors = [];
      let summaryData = null;
      let projectData = [];
      try {
        summaryData = await apiCall('/api/hp/summary');
      } catch (err) {
        errors.push(err.message || "Impossible de récupérer le résumé HP");
      }

      try {
        const res = await apiCall('/api/projects');
        if (Array.isArray(res)) {
          projectData = res;
        } else if (res?.items) {
          projectData = res.items;
        }
      } catch (err) {
        errors.push(err.message || "Impossible de récupérer les projets");
      }

      if (!active) {
        return;
      }
      setSummary(summaryData);
      setProjects(projectData);
      if (projectData.length) {
        setSelectedProjectKey(projectData[0].key);
      } else {
        setSelectedProjectKey(null);
      }
      setError(errors.length ? errors.join(' / ') : null);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!projects.length) {
      setMetrics({});
      return;
    }
    let active = true;
    const loadMetrics = async () => {
      const entries = await Promise.all(
        projects.map(async (project) => {
          try {
            const res = await apiCall(`/api/threads?project_key=${encodeURIComponent(project.key)}&limit=200`);
            const threads = res.items || [];
            return [
              project.key,
              {
                threads,
                threadsCount: threads.length,
                lastActivity: threads[0]?.last_activity || null,
              },
            ];
          } catch (err) {
            return [
              project.key,
              {
                threads: [],
                threadsCount: 0,
                lastActivity: null,
                error: err.message || null,
              },
            ];
          }
        })
      );
      if (!active) {
        return;
      }
      setMetrics(Object.fromEntries(entries));
    };
    loadMetrics();
    return () => {
      active = false;
    };
  }, [projects]);

  useEffect(() => {
    if (!selectedProjectKey) {
      setProjectThreads([]);
      setProjectMeta([]);
      setDetailsError(null);
      return;
    }
    const metric = metrics[selectedProjectKey];
    setProjectThreads(metric?.threads || []);

    let active = true;
    const loadMeta = async () => {
      setDetailsLoading(true);
      setDetailsError(null);
      try {
        const res = await apiCall(`/api/meta/search?q=${encodeURIComponent(selectedProjectKey)}&limit=20`);
        if (!active) {
          return;
        }
        const filtered = (res.items || []).filter((item) => item.project_key === selectedProjectKey);
        setProjectMeta(filtered);
      } catch (err) {
        if (!active) {
          return;
        }
        setDetailsError(err.message || "Impossible de charger l'activité du projet");
        setProjectMeta([]);
      } finally {
        if (active) {
          setDetailsLoading(false);
        }
      }
    };
    loadMeta();
    return () => {
      active = false;
    };
  }, [selectedProjectKey, metrics]);

  const actions = summary?.actions || [];
  const validations = summary?.validations || { delivery: 0, architecture: 0 };
  const journal = summary?.journal || [];
  const lastActivityText = summary?.last_activity ? formatRelative(summary.last_activity) : 'activité inconnue';

  const projectCards = useMemo(
    () =>
      projects.map((project) => {
        const metric = metrics[project.key] || {};
        return {
          ...project,
          threadsCount: metric.threadsCount ?? null,
          lastActivity: metric.lastActivity || null,
        };
      }),
    [projects, metrics]
  );

  const selectedProject = useMemo(
    () => projectCards.find((project) => project.key === selectedProjectKey) || null,
    [projectCards, selectedProjectKey]
  );
  const selectedMetric = metrics[selectedProjectKey] || {};

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c111e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="animate-spin text-blue-400" size={28} />
          <span>Chargement du tableau de bord…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c111e] p-8 space-y-8">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{summary?.tagline || 'Tableau de bord ARKA'}</h1>
          <p className="text-gray-400">Dernière activité : {lastActivityText}</p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Actions immédiates</h2>
        {actions.length === 0 ? (
          <div className="text-sm text-gray-500 bg-[#1a1f2e] border border-gray-800 rounded-lg px-4 py-3">
            Aucune action prioritaire exposée par le backend.
          </div>
        ) : (
          <div className={`grid gap-4 ${actions.length >= 4 ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {actions.map((action, idx) => {
              const palette = ACTION_PALETTE[idx % ACTION_PALETTE.length];
              const Icon = pickActionIcon(actionLabel(action));
              return (
                <div
                  key={actionLabel(action)}
                  className={`p-6 border rounded-xl transition-all ${palette.bg} ${palette.border} ${palette.hover}`}
                >
                  <Icon className={`${palette.icon} mb-3`} size={22} />
                  <div className="text-white font-medium">{actionLabel(action)}</div>
                  {actionValue(action) && <div className="text-sm text-gray-400 mt-1">Valeur : {actionValue(action)}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-blue-400" size={20} />
            <h3 className="text-lg font-semibold text-white">Points de validation</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[#0c111e] rounded-lg border border-gray-800">
              <div className="text-xs text-gray-500 uppercase mb-1">Delivery</div>
              <div className="text-2xl font-semibold text-blue-300">{validations.delivery ?? 0}</div>
              <div className="text-xs text-gray-500 mt-2">Validations AGP</div>
            </div>
            <div className="p-4 bg-[#0c111e] rounded-lg border border-gray-800">
              <div className="text-xs text-gray-500 uppercase mb-1">Architecture</div>
              <div className="text-2xl font-semibold text-purple-300">{validations.architecture ?? 0}</div>
              <div className="text-xs text-gray-500 mt-2">Validations Archiviste</div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="text-gray-400" size={20} />
            <h3 className="text-lg font-semibold text-white">Journal global</h3>
          </div>
          <div className="space-y-3">
            {journal.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune entrée récente.</p>
            ) : (
              journal.slice(0, 6).map((entry, idx) => (
                <div key={`${entry}-${idx}`} className="flex items-start gap-3 text-sm text-gray-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600 mt-2 flex-shrink-0" />
                  <p>{entry}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Projets actifs</h2>
          <div className="text-xs text-gray-500">
            {projectCards.length} projet{projectCards.length > 1 ? 's' : ''}
          </div>
        </div>
        {projectCards.length === 0 ? (
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-lg px-4 py-6 text-sm text-gray-400">
            Aucun projet n’est enregistré dans la base.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projectCards.map((project) => (
              <button
                key={project.key}
                onClick={() => setSelectedProjectKey(project.key)}
                className={`p-6 bg-[#1a1f2e] border rounded-xl text-left transition-all ${
                  selectedProjectKey === project.key ? 'border-blue-500' : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 text-xs rounded-full ${statusClasses(project.status)}`}>
                    {statusLabel(project.status)}
                  </span>
                  <span className="text-xs font-mono text-gray-500">{project.key}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {project.title || project.key}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
                  <span>{project.threadsCount !== null ? `${project.threadsCount} thread(s)` : '— thread'}</span>
                  <span>{project.lastActivity ? formatRelative(project.lastActivity) : 'activité inconnue'}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {selectedProject ? `Projet ${selectedProject.key}` : 'Aucun projet sélectionné'}
            </h3>
            {selectedProject && (
              <p className="text-sm text-gray-500 mt-1">{selectedProject.title || ''}</p>
            )}
          </div>
          {selectedProject && (
            <div className="flex gap-2 text-xs text-gray-500">
              <span>Threads : {projectThreads.length}</span>
              <span>Messages chargés : {projectMeta.length}</span>
              <span>
                Dernière activité :{' '}
                {selectedMetric.lastActivity ? formatRelative(selectedMetric.lastActivity) : 'n/a'}
              </span>
            </div>
          )}
        </div>

        {!selectedProject ? (
          <div className="text-sm text-gray-500 bg-[#0c111e] border border-gray-800 rounded-lg px-4 py-6">
            Sélectionnez un projet pour afficher ses threads et messages récents.
          </div>
        ) : (
          <>
            {detailsError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>{detailsError}</span>
              </div>
            )}

            {detailsLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-400 gap-3">
                <Loader2 className="animate-spin text-blue-400" size={24} />
                <span>Chargement des détails du projet…</span>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Threads récents
                  </h4>
                  <div className="space-y-3">
                    {projectThreads.slice(0, 6).map((thread) => (
                      <div key={thread.thread_id} className="bg-[#0c111e] border border-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between gap-3">
                          <h5 className="text-sm font-semibold text-white truncate">
                            {thread.title || `Thread #${thread.thread_id}`}
                          </h5>
                          <span className="text-xs text-gray-500">
                            {formatRelative(thread.last_activity)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          ID : {thread.thread_id}
                        </div>
                      </div>
                    ))}
                    {projectThreads.length === 0 && (
                      <div className="bg-[#0c111e] border border-gray-800 rounded-lg p-4 text-sm text-gray-500">
                        Aucun thread pour ce projet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Messages récents (META)
                  </h4>
                  <div className="space-y-3">
                    {projectMeta.slice(0, 6).map((item) => (
                      <div key={item.id} className="bg-[#0c111e] border border-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-300">{item.title || `Thread #${item.thread_id}`}</div>
                          <span className="text-xs text-gray-500">{formatRelative(item.created_at)}</span>
                        </div>
                        {item.text && (
                          <p className="text-xs text-gray-400 mt-2 line-clamp-3">{item.text}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                          <span>{item.author || item.author_kind || 'Auteur inconnu'}</span>
                          <span className="flex items-center gap-1 text-blue-300">
                            Voir
                            <ChevronRight size={12} />
                          </span>
                        </div>
                      </div>
                    ))}
                    {projectMeta.length === 0 && (
                      <div className="bg-[#0c111e] border border-gray-800 rounded-lg p-4 text-sm text-gray-500">
                        Aucun message indexé pour ce projet dans META.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Derniers messages META (tous projets)
        </h3>
        {projectMeta.length === 0 && journal.length === 0 ? (
          <p className="text-sm text-gray-500">Consultez un projet pour voir les échanges associés.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {projectMeta.slice(0, 4).map((item) => (
              <div key={`meta-${item.id}`} className="bg-[#0c111e] border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-mono">{item.project_key}</span>
                  <span className="text-xs text-gray-500">{formatDateTime(item.created_at)}</span>
                </div>
                <div className="text-sm text-white mt-2 truncate">{item.title || item.thread_id}</div>
                {item.text && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{item.text}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
