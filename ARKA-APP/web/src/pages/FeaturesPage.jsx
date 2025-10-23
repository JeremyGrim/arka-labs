import React from 'react';
import { Network, Shield, FileText, TrendingUp, Zap, Database, CheckCircle, Clock, Users, Lock } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const FeaturesPage = () => {
  const workflows = [
    {
      category: "AUDIT (6 workflows)",
      items: [
        { name: "AUDIT:FILES", desc: "Scan fichiers → constats → gate" },
        { name: "AUDIT:RGPD", desc: "Évaluation RGPD/DPA complète" },
        { name: "AUDIT:COMPLIANCE", desc: "Conformité normes (SOC2, ISO)" },
        { name: "AUDIT:SECURITY", desc: "Audit sécurité applicatif" },
        { name: "AUDIT:FEATURE", desc: "Analyse impacts/dépendances" },
        { name: "AUDIT:ACCOUNTING", desc: "Contrôles comptables" }
      ]
    },
    {
      category: "DELIVERY (3 workflows)",
      items: [
        { name: "DELIVERY:FEATURE", desc: "Feature → Epics → US → gate" },
        { name: "DELIVERY:EPIC", desc: "Cadrage Epic → décomposition US" },
        { name: "DELIVERY:US", desc: "Spécifier → Réaliser → Review → Gate → Publish" }
      ]
    },
    {
      category: "OPS (3 workflows)",
      items: [
        { name: "OPS:BUGFIX", desc: "Qualif → fix → test → gate → release notes" },
        { name: "OPS:SECURITY", desc: "Incident sécu → remédiation → gate" },
        { name: "OPS:DATA_REPORT", desc: "Extract data → analyse → reporting" }
      ]
    },
    {
      category: "DOC & MKT & PEOPLE (4 workflows)",
      items: [
        { name: "DOC:ADR", desc: "Architecture Decision Record → review → gate" },
        { name: "DOC:CONTENT", desc: "Brief → rédaction → gate → publish" },
        { name: "MKT:CAMPAIGN", desc: "Research → plan → création → analytics" },
        { name: "PEOPLE:HR_CHANGE", desc: "Diagnostic → roadmap → déploiement" }
      ]
    }
  ];

  const coreFeatures = [
    {
      icon: Network,
      title: "Orchestration Multi-Niveaux",
      description: "Inspiré de SAFe (Scaled Agile Framework), ARKA structure l'organisation en Programme/Plateaux. Le PMO peut gérer jusqu'à 8 agents par équipe avec 2 tâches simultanées en pilotage actif.",
      benefits: [
        "Pool de 8 agents max par équipe",
        "Enchaînement dynamique des workflows",
        "Adaptation au rythme des agents",
        "Coordination inter-plateaux si nécessaire"
      ]
    },
    {
      icon: Shield,
      title: "Core Guardian",
      description: "Système autonome qui passe chaque nuit pour compacter, optimiser et archiver les messages obsolètes. Met à jour les mémoires de contexte pour un onboarding agent rapide et efficace.",
      benefits: [
        "Nettoyage automatique nocturne",
        "Optimisation des mémoires de contexte",
        "Détection de déviances architecturales",
        "Compte rendu d'optimisation quotidien"
      ]
    },
    {
      icon: FileText,
      title: "Constitution as Code",
      description: "Au lieu de répéter les règles dans chaque prompt, ARKA utilise une constitution versionnée. Une modification de règle se propage automatiquement à tous les agents.",
      benefits: [
        "Source de vérité unique",
        "Zéro dérive des agents",
        "Auditable via git history",
        "22 briques • 96 action keys"
      ]
    },
    {
      icon: TrendingUp,
      title: "Evidence-Based AI",
      description: "Chaque action génère un evidence pack complet : messages, mémoires, tokens, latences, gates, et artifacts. Traçabilité complète pour audit SOC2/ISO27001/RGPD.",
      benefits: [
        "Evidence pack pour chaque action",
        "Export JSON/CSV/PDF",
        "Chain of custody juridique",
        "Rejouabilité complète"
      ]
    },
    {
      icon: Zap,
      title: "Multi-Provider Agnostique",
      description: "Bascule entre GPT-4, Claude, Gemini en 1 ligne. Lock-in zéro, résilience garantie avec fallback automatique, optimisation coûts avec routing intelligent.",
      benefits: [
        "Support GPT, Claude, Gemini",
        "Fallback automatique",
        "Optimisation coûts dynamique",
        "Support OSS (Llama, Mistral)"
      ]
    },
    {
      icon: Database,
      title: "Local-First & Souveraineté",
      description: "Les données de travail restent chez vous (machine, réseau interne). Fonctionnement hors-ligne possible. Aucune fuite de données par défaut.",
      benefits: [
        "Données locales par défaut",
        "Mode hors-ligne disponible",
        "Souveraineté garantie",
        "Sauvegarde simple (fichiers)"
      ]
    }
  ];

  const useCases = [
    {
      icon: CheckCircle,
      title: "Audit RGPD en 2h",
      before: "160h manuelles, 5% d'erreurs",
      after: "2h avec ARKA, 0.5% d'erreurs",
      roi: "98% de gain de temps, 40$ vs 8000$ de coûts"
    },
    {
      icon: Clock,
      title: "Livraison Features",
      before: "3 semaines de specs à release",
      after: "1 semaine avec orchestration",
      roi: "66% plus rapide, qualité constante"
    },
    {
      icon: Users,
      title: "Campagne Marketing",
      before: "10 jours de brief à publication",
      after: "3 jours avec workflow MKT",
      roi: "70% de gain, cohérence garantie"
    },
    {
      icon: Lock,
      title: "Sécurité & Compliance",
      before: "Audit manuel, traces partielles",
      after: "Traçabilité 100%, evidence packs",
      roi: "Conformité SOC2/ISO automatique"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-[#0a0a0a] to-black">
        <div className="container mx-auto px-6 lg:px-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Fonctionnalités <span className="text-[#cb0f44]">ARKA</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl">
            Découvrez toute la puissance d'ARKA : orchestration intelligente, traçabilité complète, et workflows métier prêts à l'emploi.
          </p>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-24">
        <div className="container mx-auto px-6 lg:px-20">
          <h2 className="text-3xl font-bold mb-12">Innovations Majeures</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {coreFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="p-8 bg-[#0a0a0a] border border-white/10">
                  <div className="w-12 h-12 bg-[#cb0f44]/10 flex items-center justify-center mb-6">
                    <Icon className="text-[#cb0f44]" size={24} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                        <div className="w-1.5 h-1.5 bg-[#cb0f44] rounded-full flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflows */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl font-bold mb-4">16 Workflows Métier Prêts à l'Emploi</h2>
            <p className="text-gray-400">
              Des chaînes complètes pour audit, delivery, ops, documentation, marketing et RH.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {workflows.map((workflow, idx) => (
              <div key={idx} className="p-8 bg-black border border-white/10">
                <h3 className="text-xl font-bold mb-6 text-[#cb0f44]">{workflow.category}</h3>
                <ul className="space-y-4">
                  {workflow.items.map((item, i) => (
                    <li key={i} className="border-l-2 border-white/10 pl-4">
                      <div className="font-mono text-sm text-white mb-1">{item.name}</div>
                      <div className="text-sm text-gray-400">{item.desc}</div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24">
        <div className="container mx-auto px-6 lg:px-20">
          <h2 className="text-3xl font-bold mb-12">Cas d'Usage & ROI</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {useCases.map((useCase, idx) => {
              const Icon = useCase.icon;
              return (
                <div key={idx} className="p-6 bg-[#0a0a0a] border border-white/10">
                  <Icon className="text-[#cb0f44] mb-4" size={32} />
                  <h3 className="text-lg font-bold mb-4">{useCase.title}</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-gray-500 mb-1">Avant</div>
                      <div className="text-gray-300">{useCase.before}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Avec ARKA</div>
                      <div className="text-[#cb0f44]">{useCase.after}</div>
                    </div>
                    <div className="pt-3 border-t border-white/10">
                      <div className="text-white font-medium">{useCase.roi}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FeaturesPage;
