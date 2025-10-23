import React, { useEffect, useMemo, useState } from 'react';
import { Search, Play, Loader, Filter, Tag, AlertTriangle } from 'lucide-react';
import { apiCall } from '../../config/api';
import { humanize } from '../../lib/agents';

const pickFamilyFromTags = (tags) => {
  const lowerTags = (tags || []).map((tag) => tag.toLowerCase());
  if (lowerTags.includes('audit')) return 'audit';
  if (lowerTags.includes('delivery')) return 'delivery';
  if (lowerTags.includes('ops')) return 'ops';
  if (lowerTags.includes('security') || lowerTags.includes('compliance')) return 'security';
  return 'autres';
};

const familyLabels = {
  all: 'Toutes les familles',
  audit: 'Audit',
  delivery: 'Delivery',
  ops: 'Ops',
  security: 'Sécurité',
  autres: 'Autres',
};

const FlowsPage = () => {
  const [flows, setFlows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiCall('/api/catalog?facet=flow');
        if (!active) {
          return;
        }
        const items = (data.items || []).map((flow) => ({
          ...flow,
          family: pickFamilyFromTags(flow.tags),
        }));
        setFlows(items);
      } catch (err) {
        if (active) {
          setError(err.message || 'Impossible de récupérer le catalogue de flows');
          setFlows([]);
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

  const filteredFlows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return flows.filter((flow) => {
      const matchesTerm = term.length === 0
        || (flow.name || '').toLowerCase().includes(term)
        || (flow.intent || '').toLowerCase().includes(term)
        || (flow.tags || []).some((tag) => tag.toLowerCase().includes(term));
      const matchesFamily = selectedFamily === 'all' || flow.family === selectedFamily;
      return matchesTerm && matchesFamily;
    });
  }, [flows, searchTerm, selectedFamily]);

  const families = useMemo(() => {
    const counts = flows.reduce(
      (acc, flow) => {
        acc[flow.family] = (acc[flow.family] || 0) + 1;
        return acc;
      },
      { all: flows.length },
    );
    return Object.entries(counts).map(([family, count]) => ({ family, count }));
  }, [flows]);

  const startFlow = async (flowRef) => {
    try {
      const payload = {
        client: 'ACME',
        flow_ref: flowRef,
        options: { assign_strategy: 'auto', start_at_step: 0 },
      };
      const data = await apiCall('/api/orch/flow', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      alert(`Session créée: ${data.id}`);
    } catch (err) {
      alert(`Erreur lors du démarrage: ${err.message}`);
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
        <h1 className="text-3xl font-bold text-white mb-2">Catalogue de Parcours</h1>
        <p className="text-gray-400">Flows disponibles dans ARKA_FLOW / DB</p>
      </div>

      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Rechercher un parcours..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0c111e] border border-gray-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select
              value={selectedFamily}
              onChange={(e) => setSelectedFamily(e.target.value)}
              className="bg-[#0c111e] border border-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500"
            >
              {families
                .map(({ family, count }) => (
                  <option key={family} value={family}>
                    {familyLabels[family] || humanize(family)} ({count})
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredFlows.map((flow) => (
          <div key={flow.flow_ref} className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 text-xs uppercase text-gray-500">
                  <Tag size={12} />
                  <span>{familyLabels[flow.family] || humanize(flow.family)}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{flow.name || humanize(flow.flow_ref)}</h3>
                <p className="text-sm text-gray-400 mb-3">{flow.intent || flow.flow_ref}</p>
                <div className="flex flex-wrap gap-2">
                  {(flow.tags || []).map((tag) => (
                    <span key={tag} className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => startFlow(flow.flow_ref)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
              >
                <Play size={16} />
                Démarrer
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredFlows.length === 0 && (
        <div className="text-center py-12 text-gray-400">Aucun parcours trouvé</div>
      )}
    </div>
  );
};

export default FlowsPage;
