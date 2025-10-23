import React, { useEffect, useMemo, useState } from 'react';
import { Search, Loader2, AlertTriangle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { apiCall } from '../config/api';
import { buildAgentSummary, formatAgentTitle, inferAgentCategory } from '../lib/agents';

const formatCategoryLabel = (category) => `${category.label} (${category.count})`;

const ExpertsPage = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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
          setError(err.message || "Impossible de charger l'annuaire agents");
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
    const list = Array.from(map.values()).sort((a, b) => b.count - a.count);
    return [{ id: 'all', label: 'Tous', count: agents.length }, ...list];
  }, [agents]);

  const filteredExperts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return agents.filter((agent) => {
      const category = inferAgentCategory(agent);
      const matchesCategory = selectedCategory === 'all' || category.id === selectedCategory;
      const baseText = `${formatAgentTitle(agent)} ${agent.role || ''} ${agent.agent_id || ''} ${agent.ref || ''}`.toLowerCase();
      const matchesSearch = query.length === 0 || baseText.includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [agents, selectedCategory, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-[#cb0f44]" size={36} />
          <p className="text-sm text-gray-400">Chargement de l'annuaire agents…</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <AlertTriangle className="text-[#cb0f44]" size={32} />
          <p className="text-lg font-semibold">Annuaire indisponible</p>
          <p className="text-sm text-gray-400 max-w-md">{error}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <section className="pt-32 pb-16 bg-gradient-to-b from-[#0a0a0a] to-black">
        <div className="container mx-auto px-6 lg:px-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Experts <span className="text-[#cb0f44]">opérationnels</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl">
            Annuaire directement alimenté par les onboarding ARKA — agents disponibles pour orchestrer vos flows.
          </p>
        </div>
      </section>

      <section className="py-8 border-b border-white/10">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher un expert…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#cb0f44]/50 transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-[#cb0f44] text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {formatCategoryLabel(category)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="mb-8">
            <p className="text-gray-400">
              {filteredExperts.length} agent{filteredExperts.length > 1 ? 's' : ''} trouvé{filteredExperts.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredExperts.map((agent) => {
              const category = inferAgentCategory(agent);
              return (
                <div key={agent.agent_id} className="group p-8 bg-[#0a0a0a] border border-white/10 hover:border-[#cb0f44]/50 transition-all">
                  <div className="mb-4">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">
                      {category.label}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold mb-3 group-hover:text-[#cb0f44] transition-colors">
                    {formatAgentTitle(agent)}
                  </h3>

                  <p className="text-sm text-[#cb0f44] mb-4 font-medium break-words">{agent.ref}</p>

                  <p className="text-gray-400 mb-6 leading-relaxed break-words">
                    {buildAgentSummary(agent) || 'Onboarding disponible dans ARKA OS'}
                  </p>

                  <div className="text-xs text-gray-500">
                    <span className="inline-block bg-white/5 px-3 py-1 rounded">ID : {agent.agent_id}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredExperts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Aucun agent ne correspond aux critères sélectionnés.
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ExpertsPage;
