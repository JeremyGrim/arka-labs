import React, { useEffect, useMemo, useState } from 'react';
import { Loader, Folder, MessageSquare, ChevronRight, Play, AlertTriangle } from 'lucide-react';
import { apiCall } from '../../config/api';

const formatRelative = (dateStr) => {
  if (!dateStr) return 'n/a';
  const date = new Date(dateStr);
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return `il y a ${diffSeconds}s`;
  if (diffSeconds < 3600) return `il y a ${Math.floor(diffSeconds / 60)} min`;
  if (diffSeconds < 86400) return `il y a ${Math.floor(diffSeconds / 3600)} h`;
  return `il y a ${Math.floor(diffSeconds / 86400)} j`;
};

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiCall('/api/projects/counters');
        if (!active) {
          return;
        }
        setProjects(data.items || []);
      } catch (err) {
        if (active) {
          setError(err.message || 'Impossible de charger la liste des projets');
          setProjects([]);
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

  const filteredProjects = useMemo(() => {
    if (statusFilter === 'all') {
      return projects;
    }
    return projects.filter((project) => (project.status || 'active').toLowerCase() === statusFilter);
  }, [projects, statusFilter]);

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'active':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'paused':
      case 'en veille':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
      case 'attention':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
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
        <h1 className="text-3xl font-bold text-white mb-2">Projets</h1>
        <p className="text-gray-400">Vue d'ensemble des projets référencés</p>
      </div>

      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Statut :</span>
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Tous' },
              { id: 'active', label: 'Actif' },
              { id: 'paused', label: 'En veille' },
              { id: 'attention', label: 'Attention' },
            ].map((status) => (
              <button
                key={status.id}
                onClick={() => setStatusFilter(status.id)}
                className={`px-4 py-2 rounded-lg bg-[#0c111e] text-gray-400 hover:text-white hover:bg-blue-500/10 transition-all text-sm ${
                  statusFilter === status.id ? 'border border-blue-400 text-blue-300' : ''
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => (
          <div key={project.project_id || project.project_key} className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-mono text-gray-500">{project.project_key}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(project.status)}`}>
                    {project.status || 'active'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {project.title || project.project_key}
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Folder size={14} className="text-gray-500" />
                  <span className="text-gray-400">{project.threads_count ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-gray-500" />
                  <span className="text-gray-400">{project.messages_count ?? 0}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500">{formatRelative(project.last_activity)}</p>

              <div className="flex gap-2 pt-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all text-sm">
                  Ouvrir
                  <ChevronRight size={14} />
                </button>
                <button className="px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-all" title="Démarrer mission">
                  <Play size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12 text-gray-400">Aucun projet ne correspond au filtre.</div>
      )}
    </div>
  );
};

export default ProjectsPage;
