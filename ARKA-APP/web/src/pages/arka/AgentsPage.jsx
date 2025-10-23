import React, { useEffect, useMemo, useState } from 'react';
import { Loader, Power, Users, FileText, AlertTriangle } from 'lucide-react';
import { apiCall } from '../../config/api';
import { buildAgentSummary, formatAgentTitle, inferAgentCategory } from '../../lib/agents';

const AgentsPage = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stateFilter, setStateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiCall('/api/agents/directory?client=ACME');
        if (!active) {
          return;
        }
        setAgents(data.agents || []);
      } catch (err) {
        if (active) {
          setError(err.message || 'Impossible de charger l’annuaire des agents');
          setAgents([]);
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

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const category = inferAgentCategory(agent);
      const matchesCategory = categoryFilter === 'all' || category.id === categoryFilter;
      // Les états n'étant pas encore synchronisés, on considère tout éveillé
      const matchesState = stateFilter === 'all' || stateFilter === 'awake';
      return matchesCategory && matchesState;
    });
  }, [agents, categoryFilter, stateFilter]);

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

      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Ensemble :</span>
          {[
            { id: 'all', label: 'Tous' },
            { id: 'awake', label: 'Éveillés' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setStateFilter(option.id)}
              className={`px-4 py-2 rounded-lg bg-[#0c111e] text-gray-400 hover:text-white hover:bg-blue-500/10 transition-all text-sm ${
                stateFilter === option.id ? 'border border-blue-400 text-blue-300' : ''
              }`}
            >
              {option.label}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAgents.map((agent) => {
          const category = inferAgentCategory(agent);
          return (
            <div key={agent.agent_id} className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-500/10">
                    <Power className="text-green-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{formatAgentTitle(agent)}</h3>
                    <p className="text-sm text-gray-500">{agent.agent_id}</p>
                    <p className="text-xs text-gray-500 mt-1">{category.label}</p>
                  </div>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-400">Éveillé</span>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all text-sm"
                  onClick={() => alert('TODO: activer/désactiver agent via participants API')}
                >
                  Basculer état
                </button>
                <button
                  className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
                  title="Voir onboarding"
                  onClick={() => alert(agent.onboarding_path || 'Onboarding non référencé')}
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
    </div>
  );
};

export default AgentsPage;
