import React, { useEffect, useMemo, useState } from 'react';
import { Loader, Send, User, Bot, Shield, AlertTriangle } from 'lucide-react';
import { apiCall } from '../../config/api';

const getAuthorIcon = (kind) => {
  switch (kind) {
    case 'agent':
      return <Bot size={16} />;
    case 'system':
      return <Shield size={16} />;
    default:
      return <User size={16} />;
  }
};

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

const MessagesPage = () => {
  const [threads, setThreads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState('all');
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const loadThreads = async () => {
      setLoadingThreads(true);
      setError(null);
      try {
        const params = new URLSearchParams({ limit: '50' });
        if (projectFilter !== 'all') {
          params.set('project_key', projectFilter);
        }
        const data = await apiCall(`/api/threads${params.toString() ? `?${params.toString()}` : ''}`);
        if (!active) {
          return;
        }
        const items = data.items || [];
        setThreads(items);
        if (projectFilter === 'all') {
          const uniqueProjects = Array.from(new Set(items.map((item) => item.project_key))).filter(Boolean);
          setProjects(uniqueProjects);
        }
        setSelectedThread(items[0] || null);
      } catch (err) {
        if (active) {
          setError(err.message || 'Impossible de charger les threads');
          setThreads([]);
          setSelectedThread(null);
        }
      } finally {
        if (active) {
          setLoadingThreads(false);
        }
      }
    };
    loadThreads();
    return () => {
      active = false;
    };
  }, [projectFilter]);

  useEffect(() => {
    if (!selectedThread) {
      setMessages([]);
      return;
    }
    let active = true;
    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const data = await apiCall(`/api/messages?thread_id=${selectedThread.thread_id}&limit=100`);
        if (!active) {
          return;
        }
        setMessages(data.items || []);
      } catch (err) {
        if (active) {
          setMessages([]);
        }
      } finally {
        if (active) {
          setLoadingMessages(false);
        }
      }
    };
    loadMessages();
    return () => {
      active = false;
    };
  }, [selectedThread]);

  const projectFilters = useMemo(() => ['all', ...projects], [projects]);

  const sendMessage = async () => {
    if (!selectedThread || !newMessage.trim()) {
      return;
    }
    try {
      await apiCall('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          thread_id: selectedThread.thread_id,
          author_kind: 'owner',
          author_ref: 'owner',
          content: { text: newMessage.trim() },
        }),
      });
      setNewMessage('');
      const refreshed = await apiCall(`/api/messages?thread_id=${selectedThread.thread_id}&limit=100`);
      setMessages(refreshed.items || []);
    } catch (err) {
      alert(`Erreur lors de l'envoi : ${err.message}`);
    }
  };

  if (loadingThreads) {
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
    <div className="min-h-screen bg-[#0c111e] p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Messages</h1>
        <p className="text-gray-400">Conversations et échanges (threads ARKA)</p>
      </div>

      <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Filtrer par projet :</span>
          <div className="flex gap-2 flex-wrap">
            {projectFilters.map((proj) => (
              <button
                key={proj}
                onClick={() => setProjectFilter(proj)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  projectFilter === proj
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-400/40'
                    : 'bg-[#0c111e] text-gray-400 hover:text-white hover:bg-blue-500/10'
                }`}
              >
                {proj === 'all' ? 'Tous' : proj}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 space-y-2">
          <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl p-4 h-full">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Threads</h2>
            <div className="space-y-2 overflow-y-auto max-h-[65vh] pr-1">
              {threads.map((thread) => (
                <button
                  key={thread.thread_id}
                  onClick={() => setSelectedThread(thread)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedThread?.thread_id === thread.thread_id
                      ? 'bg-blue-500/10 border border-blue-500/30'
                      : 'bg-[#0c111e] hover:bg-[#151922] border border-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-sm font-semibold text-white truncate">{thread.title || thread.thread_id}</h3>
                    <span className="text-xs text-gray-500">{thread.project_key}</span>
                  </div>
                  <p className="text-xs text-gray-500">{formatTime(thread.last_activity)}</p>
                </button>
              ))}
              {threads.length === 0 && (
                <p className="text-xs text-gray-500">Aucun thread disponible.</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-8">
          {selectedThread ? (
            <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl flex flex-col h-[calc(100vh-240px)]">
              <div className="p-4 border-b border-gray-800">
                <h2 className="text-lg font-semibold text-white">{selectedThread.title || selectedThread.thread_id}</h2>
                <p className="text-sm text-gray-500">Projet : {selectedThread.project_key}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-10">
                    <Loader className="animate-spin text-blue-400" size={20} />
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="flex gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.author_kind === 'agent'
                            ? 'bg-blue-500/10 text-blue-400'
                            : msg.author_kind === 'system'
                            ? 'bg-purple-500/10 text-purple-400'
                            : 'bg-green-500/10 text-green-400'
                        }`}
                      >
                        {getAuthorIcon(msg.author_kind)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-white">{msg.author || msg.author_ref}</span>
                          <span className="text-xs text-gray-500">{formatTime(msg.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed break-words">{msg.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrire un message…"
                    className="flex-1 bg-[#0c111e] border border-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all flex items-center gap-2"
                  >
                    Envoyer
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#1a1f2e] border border-gray-800 rounded-xl flex items-center justify-center h-[calc(100vh-240px)] text-gray-500">
              Sélectionnez un thread pour afficher les messages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
