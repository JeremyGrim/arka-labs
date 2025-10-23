import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Database,
  FileText,
  Loader2,
  Network,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { apiCall } from '../config/api';
import { buildAgentSummary, formatAgentTitle, humanize, inferAgentCategory } from '../lib/agents';

const iconMap = {
  Network,
  Shield,
  FileText,
  TrendingUp,
  Zap,
  Database,
};

const TAG_ICON_MAP = {
  audit: 'Shield',
  compliance: 'Shield',
  security: 'Shield',
  delivery: 'TrendingUp',
  spec: 'FileText',
  architecture: 'FileText',
  ops: 'Zap',
  observability: 'Database',
};

const pickIconForFlow = (flow) => {
  const tags = flow?.tags || [];
  for (const tag of tags) {
    const match = TAG_ICON_MAP[tag.toLowerCase()];
    if (match) {
      return match;
    }
  }
  return 'Network';
};

const formatNumber = (value) => new Intl.NumberFormat('fr-FR').format(value ?? 0);

const formatRelativeTime = (value) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) {
    return "à l'instant";
  }
  if (diffMinutes < 60) {
    return `il y a ${diffMinutes} min`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `il y a ${diffHours} h`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `il y a ${diffDays} j`;
};

const LandingPage = () => {
  const [summary, setSummary] = useState(null);
  const [flows, setFlows] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summaryData, flowsData, agentsData] = await Promise.all([
          apiCall('/api/hp/summary'),
          apiCall('/api/catalog?facet=flow'),
          apiCall('/api/agents/directory?client=ACME'),
        ]);
        if (!active) {
          return;
        }
        setSummary(summaryData);
        setFlows(flowsData.items || []);
        setAgents(agentsData.agents || []);
      } catch (err) {
        if (active) {
          setError(err.message || 'Erreur de chargement des données ARKA');
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

  const sessionAction = summary?.actions?.find((action) =>
    (action.label || '').toLowerCase().includes('session')
  );
  const flowsAction = summary?.actions?.find((action) =>
    (action.label || '').toLowerCase().includes('flow')
  );

  const stats = useMemo(
    () => [
      {
        id: 'agents',
        label: 'Agents référencés',
        value: agents.length,
      },
      {
        id: 'flows',
        label: 'Parcours opérationnels',
        value: flowsAction?.value ?? flows.length,
      },
      {
        id: 'gates',
        label: 'Validations gates',
        value: (summary?.validations?.delivery || 0) + (summary?.validations?.architecture || 0),
      },
    ],
    [agents.length, flows.length, flowsAction?.value, summary?.validations]
  );

  const featureCards = useMemo(
    () =>
      flows.slice(0, 6).map((flow) => {
        const iconKey = pickIconForFlow(flow);
        return {
          id: flow.flow_ref,
          title: flow.name || humanize(flow.flow_ref.split(':').pop() || flow.flow_ref),
          description: flow.intent || 'Parcours orchestré',
          icon: iconKey,
          tags: flow.tags || [],
        };
      }),
    [flows]
  );

  const benefitCards = useMemo(() => {
    const activeSessions = sessionAction?.value ?? 0;
    const totalSessions = sessionAction?.total ?? undefined;
    return [
      {
        id: 'sessions',
        stat: totalSessions
          ? `${formatNumber(activeSessions)}/${formatNumber(totalSessions)}`
          : formatNumber(activeSessions),
        label: 'Sessions actives',
        description: 'Pilotées par l’orchestrateur ARKA pour vos clients.',
      },
      {
        id: 'agents',
        stat: formatNumber(agents.length),
        label: 'Agents catalogués',
        description: 'Référencés et prêts à être orchestrés pour ACME.',
      },
      {
        id: 'flows',
        stat: formatNumber(flows.length),
        label: 'Parcours disponibles',
        description: 'Extract des briques ARKA_FLOW synchronisées en base.',
      },
      {
        id: 'validations',
        stat: formatNumber((summary?.validations?.delivery || 0) + (summary?.validations?.architecture || 0)),
        label: 'Validations gates',
        description: 'Décisions AGP & Archiviste historisées dans la DB.',
      },
    ];
  }, [agents.length, flows.length, sessionAction, summary?.validations]);

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

  const featuredExperts = useMemo(
    () =>
      agents.slice(0, 8).map((agent) => {
        const category = inferAgentCategory(agent);
        return {
          id: agent.agent_id,
          name: formatAgentTitle(agent),
          categoryLabel: category.label,
          summary: buildAgentSummary(agent),
          ref: agent.ref,
        };
      }),
    [agents]
  );

  const lastActivity = summary?.last_activity ? new Date(summary.last_activity) : null;
  const lastActivityRelative = formatRelativeTime(summary?.last_activity);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-[#cb0f44]" size={36} />
          <p className="text-sm text-gray-400">Chargement des données ARKA…</p>
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
          <p className="text-lg font-semibold">Impossible de charger l’aperçu ARKA</p>
          <p className="text-sm text-gray-400 max-w-md">{error}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20 bg-gradient-to-br from-gray-900 via-[#1a1a1a] to-black">
        <div className="absolute inset-0 z-0">
          <img
            src="https://customer-assets.emergentagent.com/job_05361509-02f2-4a4e-9f01-a81e730fa397/artifacts/2z5gyy3v_futuristic-3d-5120x3413-13107.jpg"
            alt="Tech Background"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/75 to-black/80" />
        </div>

        <div className="container mx-auto px-6 lg:px-20 relative z-10">
          <div className="max-w-4xl animate-fadeIn">
            <div className="inline-block mb-6 px-4 py-2 bg-[#cb0f44]/20 border border-[#cb0f44]/40 rounded backdrop-blur-sm">
              <span className="text-[#cb0f44] text-sm font-medium">Orchestrateur d'Équipes IA</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-white">
              Transformer des LLMs en
              <span className="block text-[#cb0f44]"> équipes coordonnées</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl leading-relaxed">
              ARKA orchestre vos agents spécialisés pour transformer les projets en succès auditables. Local-first, gouverné et traçable.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/beta"
                className="group px-8 py-4 bg-[#cb0f44] text-white font-medium flex items-center justify-center gap-2 rounded transition-all hover:bg-[#a00c37] hover:scale-105 hover:shadow-xl hover:shadow-[#cb0f44]/30"
              >
                Rejoindre la bêta
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/experts"
                className="px-8 py-4 bg-white/10 text-white font-medium border border-white/30 rounded backdrop-blur-sm flex items-center justify-center gap-2 transition-all hover:bg-white/20 hover:border-white/50 hover:scale-105"
              >
                Découvrir les experts
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
              {stats.map((stat, idx) => (
                <div key={stat.id} className="animate-slideIn" style={{ animationDelay: `${(idx + 1) * 0.2}s` }}>
                  <div className="text-4xl font-bold text-[#cb0f44] mb-2">{formatNumber(stat.value)}</div>
                  <div className="text-gray-300 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>

            {lastActivity && (
              <p className="mt-6 text-sm text-gray-500">
                Dernière activité synchronisée : {lastActivity.toLocaleString('fr-FR')} ({lastActivityRelative})
              </p>
            )}
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-10 animate-float">
          <div
            className="flex flex-col items-center gap-2 cursor-pointer"
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          >
            <span className="text-gray-400 text-sm tracking-wider">Découvrir</span>
            <svg className="w-6 h-6 text-[#cb0f44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="animate-fadeIn p-10 bg-gray-100 rounded-sm">
              <div className="inline-block mb-6 px-3 py-1 bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded">
                LE PROBLÈME
              </div>
              <h2 className="text-4xl font-bold mb-6 text-gray-900">
                Les LLMs sans gouvernance deviennent vite ingérables
              </h2>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#cb0f44] rounded-full mt-2" />
                  Courses aux prompts, absence de capitalisation, doublons de décisions.
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#cb0f44] rounded-full mt-2" />
                  Risques RGPD/Sécurité incontrôlés, pas d’evidence pack pour auditer.
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#cb0f44] rounded-full mt-2" />
                  Les équipes perdent du temps à rejouer les mêmes tâches.
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-[#cb0f44] rounded-full mt-2" />
                  Aucun alignement entre les acteurs humains et les agents IA.
                </li>
              </ul>
            </div>

            <div className="animate-fadeIn p-10 bg-white border border-gray-200 rounded-sm">
              <div className="inline-block mb-6 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-medium rounded">
                LA SOLUTION
              </div>
              <h2 className="text-4xl font-bold mb-6 text-gray-900">
                ARKA impose une discipline collective aux LLMs
              </h2>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3 group hover:translate-x-2 transition-transform">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-150 transition-transform" />
                  <p>Règles versionnées, onboarding centralisé, gates humains obligatoires.</p>
                </li>
                <li className="flex items-start gap-3 group hover:translate-x-2 transition-transform">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-150 transition-transform" />
                  <p>Une équipe d’agents orchestrée selon vos flows, avec evidence packs.</p>
                </li>
                <li className="flex items-start gap-3 group hover:translate-x-2 transition-transform">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-150 transition-transform" />
                  <p>Traçabilité complète : journal unifié, décisions, validations, mémoire.</p>
                </li>
                <li className="flex items-start gap-3 group hover:translate-x-2 transition-transform">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0 group-hover:scale-150 transition-transform" />
                  <p>Local-first : les données restent sous votre contrôle, gouvernance incluse.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-24 bg-[#1a1a1a]">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="text-center max-w-3xl mx-auto mb-16 animate-fadeIn">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Fonctionnalités clés</h2>
            <p className="text-xl text-gray-300">
              Basé sur les flows réellement disponibles dans votre catalogue ARKA
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureCards.map((feature, idx) => {
              const Icon = iconMap[feature.icon] || iconMap.Network;
              return (
                <div
                  key={feature.id}
                  className="group p-8 bg-white border-2 border-gray-200 rounded hover:border-[#cb0f44]/70 transition-all hover:scale-105 hover:shadow-xl animate-fadeIn"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="w-12 h-12 bg-[#cb0f44]/10 flex items-center justify-center mb-6 rounded group-hover:bg-[#cb0f44]/20 group-hover:scale-110 transition-all">
                    <Icon className="text-[#cb0f44]" size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900 group-hover:text-[#cb0f44] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  {feature.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {feature.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/features"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 border-2 border-white font-medium rounded hover:bg-gray-100 hover:scale-105 transition-all"
            >
              Voir toutes les fonctionnalités
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Concept presentation */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 animate-fadeIn">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                Comment fonctionne ARKA ?
              </h2>
              <p className="text-xl text-gray-700">
                Une approche unique qui transforme le chaos IA en équipe structurée
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="text-center animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                <div className="w-20 h-20 bg-[#cb0f44]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl font-bold text-[#cb0f44]">1</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Constitution as Code</h3>
                <p className="text-gray-600">
                  Des règles versionnées qui gouvernent chaque agent. Une seule source de vérité, zéro dérive.
                </p>
              </div>

              <div className="text-center animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                <div className="w-20 h-20 bg-[#cb0f44]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl font-bold text-[#cb0f44]">2</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Orchestration PMO</h3>
                <p className="text-gray-600">
                  Le PMO coordonne plusieurs agents selon vos flows métier, avec validations AGP/Archiviste.
                </p>
              </div>

              <div className="text-center animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                <div className="w-20 h-20 bg-[#cb0f44]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl font-bold text-[#cb0f44]">3</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">Evidence-Based</h3>
                <p className="text-gray-600">
                  Chaque décision génère un evidence pack : traçabilité 100%, audits simplifiés.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#cb0f44]/5 to-emerald-500/5 p-10 rounded-sm border-l-4 border-[#cb0f44] animate-fadeIn" style={{ animationDelay: '0.4s' }}>
              <p className="text-2xl font-semibold text-gray-900 mb-4">
                « Pas d'improvisation. Pas d'IA hors de contrôle. »
              </p>
              <p className="text-gray-700 text-lg">
                ARKA impose une discipline collective aux LLMs via des gates de validation, des rôles explicites et une architecture qui maintient l'ordre – même quand vous dormez grâce au Core Guardian.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Experts Preview */}
      <section className="py-24 bg-[#1a1a1a]">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="text-center max-w-3xl mx-auto mb-16 animate-fadeIn">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Experts catalogués</h2>
            <p className="text-xl text-gray-300">Annuaire ACME importé depuis ARKA_META (flows 5.x / 7.x)</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <span
                key={category.id}
                className="px-4 py-2 text-xs font-medium bg-white/5 text-gray-300 border border-white/10 rounded"
              >
                {category.label} ({category.count})
              </span>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {featuredExperts.map((expert, idx) => (
              <div
                key={expert.id}
                className="p-6 bg-white border-2 border-gray-200 rounded hover:border-[#cb0f44]/70 transition-all group hover:scale-105 hover:shadow-xl animate-fadeIn"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="mb-3">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">{expert.categoryLabel}</span>
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900 group-hover:text-[#cb0f44] transition-colors">
                  {expert.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4 break-words">{expert.summary}</p>
                <p className="text-xs text-gray-400 break-all">{expert.ref}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/experts"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#cb0f44] text-white font-medium rounded hover:bg-[#a00c37] hover:scale-105 transition-all hover:shadow-xl hover:shadow-[#cb0f44]/30"
            >
              Découvrir tous les experts
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="text-center max-w-3xl mx-auto mb-16 animate-fadeIn">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Des résultats mesurables</h2>
            <p className="text-xl text-gray-700">
              Données extraites en temps réel de vos services ARKA
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefitCards.map((benefit, idx) => (
              <div
                key={benefit.id}
                className="text-center p-8 bg-gray-50 rounded border-2 border-gray-200 hover:border-[#cb0f44]/70 transition-all hover:scale-105 animate-fadeIn"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="text-6xl font-bold text-[#cb0f44] mb-4">{benefit.stat}</div>
                <div className="text-xl font-semibold mb-2 text-gray-900">{benefit.label}</div>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 bg-gradient-to-br from-gray-900 via-[#1a1a1a] to-black overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://customer-assets.emergentagent.com/job_05361509-02f2-4a4e-9f01-a81e730fa397/artifacts/2z5gyy3v_futuristic-3d-5120x3413-13107.jpg"
            alt="Tech Background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/90" />
        </div>

        <div className="container mx-auto px-6 lg:px-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fadeIn">
            <div className="inline-block mb-6 px-4 py-2 bg-[#cb0f44]/20 border border-[#cb0f44]/40 rounded backdrop-blur-sm">
              <span className="text-[#cb0f44] text-sm font-medium">Programme Bêta Ouvert</span>
            </div>

            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-white leading-tight">
              Prêt à transformer votre
              <br />façon de travailler ?
            </h2>

            <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed">
              Rejoignez le programme bêta et découvrez ARKA en avant-première.
              Accès anticipé, support dédié, tarification préférentielle.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/beta"
                className="group px-10 py-5 bg-[#cb0f44] text-white text-lg font-medium rounded flex items-center justify-center gap-2 hover:bg-[#a00c37] hover:scale-105 transition-all hover:shadow-xl hover:shadow-[#cb0f44]/30"
              >
                Demander un accès bêta
                <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/contact"
                className="px-10 py-5 bg-white/10 text-white text-lg font-medium border border-white/30 rounded backdrop-blur-sm flex items-center justify-center gap-2 hover:bg-white/20 hover:border-white/50 hover:scale-105 transition-all"
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
