import React, { useEffect, useMemo, useState } from 'react';
import { Loader, Play, Pause, CheckCircle, XCircle, Clock, ChevronRight, AlertTriangle } from 'lucide-react';
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

const SessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') {
          params.set('status', statusFilter);
        }
        params.set('limit', '20');
        const endpoint = `/api/orch/sessions${params.toString() ? `?${params.toString()}` : ''}`;
        const data = await apiCall(endpoint);
        if (!active) {
          return;
        }
        setSessions(data.items || []);
      } catch (err) {
        if (active) {
          setError(err.message || 'Impossible de récupérer les sessions');
          setSessions([]);
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
  }, [statusFilter]);

  const stats = useMemo(() => {
    const running = sessions.filter((s) => s.status === 'running').length;
    const paused = sessions.filter((s) => s.status === 'paused' || s.status === 'gated').length;
    return { running, paused, total: sessions.length };
  }, [sessions]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <Play className="text-green-400" size={20} />;
      case 'paused':
      case 'gated':
        return <Pause className="text-orange-400" size={20} />;
      case 'completed':
        return <CheckCircle className="text-blue-400" size={20} />;
      case 'failed':
        return <XCircle className="text-red-400" size={20} />;
      default:
        return <Clock className="text-gray-400" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'paused':
      case 'gated':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'completed':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'failed':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
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
        <h1 className="text-3xl font-bold text-white mb-2">Sessions</h1>
        <p className="text-gray-400">Missions actives et historique — {stats.total} session(s)</p>
      </div>

      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4">
        <div className="flex gap-2">
          {['all', 'running', 'paused', 'completed', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg transition-all ${
                statusFilter === status ? 'bg-blue-500/20 text-blue-400' : 'bg-[#0c111e] text-gray-400 hover:text-white'
              }`}
            >
              {status === 'all' ? 'Toutes' : status}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div>{getStatusIcon(session.status)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {session.flow_name || session.flow_ref || session.id}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{session.client} • {session.id}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-500">
                      Étape {session.current_index}/{session.total_steps || '?'}
                    </span>
                    <span className="text-xs text-gray-500">{formatRelative(session.updated_at)}</span>
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all">
                Ouvrir
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-12 text-gray-400">Aucune session correspondent aux critères.</div>
      )}
    </div>
  );
};

export default SessionsPage;
