import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Clock, Loader2, MessageSquare, Search } from 'lucide-react';
import { apiCall } from '../../config/api';

const Meta = () => {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searching, setSearching] = useState(false);

  const loadRecent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall('/api/meta/recent?limit=20');
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || "Impossible de récupérer les éléments META");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const handleSearch = async () => {
    const term = query.trim();
    if (!term) {
      loadRecent();
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const data = await apiCall(`/api/meta/search?q=${encodeURIComponent(term)}&limit=20`);
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || "Recherche META impossible");
      setItems([]);
    } finally {
      setSearching(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return 'n/a';
    const date = new Date(value);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelative = (value) => {
    if (!value) return 'n/a';
    const date = new Date(value);
    const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSeconds < 60) return "À l'instant";
    if (diffSeconds < 3600) return `Il y a ${Math.floor(diffSeconds / 60)} min`;
    if (diffSeconds < 86400) return `Il y a ${Math.floor(diffSeconds / 3600)} h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const handleReset = () => {
    setQuery('');
    loadRecent();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <Loader2 className="animate-spin text-blue-400" size={26} />
          <span>Chargement des entrées META…</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-12 text-center space-y-3">
          <AlertTriangle className="text-red-400 mx-auto" size={24} />
          <p className="text-sm text-gray-400">{error}</p>
          <button
            onClick={loadRecent}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-300 rounded-lg hover:bg-blue-500/20 transition-all text-sm"
          >
            Recharger
          </button>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-400">Aucun élément trouvé</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-5 hover:border-gray-700 hover:bg-[#1e2330] transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 text-blue-300">
                <MessageSquare size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 text-xs text-gray-500 uppercase tracking-wide">
                      <span>{item.project_key || 'Projet inconnu'}</span>
                      <span className="text-gray-700">•</span>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                    <h3 className="text-base font-semibold text-white truncate">
                      {item.title || item.relpath || item.thread_id}
                    </h3>
                    {item.text && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-3">{item.text}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} />
                    {formatRelative(item.created_at)}
                  </div>
                  <div className="px-2 py-0.5 bg-[#0c111e] rounded text-xs">
                    {item.kind || 'message'}
                  </div>
                  {item.author && (
                    <div className="text-xs text-gray-400">
                      Auteur : <span className="text-gray-300">{item.author}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0c111e] p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">ARKA_META</h1>
        <p className="text-gray-400">Entrées & livrables — {items.length} éléments</p>
      </div>

      {/* Recherche */}
      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Rechercher par nom ou chemin..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0c111e] border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-5 py-2.5 bg-[#cb0f44] text-white text-sm font-medium rounded-lg hover:bg-[#a00c37] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading || searching}
          >
            {searching ? 'Recherche…' : 'Chercher'}
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2.5 bg-[#1a1f2e] text-gray-300 text-sm font-medium rounded-lg hover:bg-[#242a3a] transition-colors"
            disabled={loading && !error}
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Liste */}
      {renderContent()}
    </div>
  );
};

export default Meta;
