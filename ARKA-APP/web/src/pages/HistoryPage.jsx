import React from 'react';
import { Lightbulb, Cpu, Rocket, Target } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const HistoryPage = () => {
  const timeline = [
    {
      phase: "La Découverte",
      icon: Lightbulb,
      title: "L'Automation de ma Maison",
      description: "Je ne voulais pas créer un outil. Je voulais automatiser ma maison. ChatGPT m'a aidé. J'ai tout automatisé — lumière, chauffage, modes de vie. J'ai découvert la puissance des prompts cadrés : rôles, profils, menus, méthodes.",
      highlight: "Un seul LLM ne suffit pas"
    },
    {
      phase: "L'Expérimentation",
      icon: Cpu,
      title: "La Mini-Équipe de 3 Agents",
      description: "Par accident, je découvre que faire évaluer un livrable par un autre LLM améliore drastiquement la qualité. J'expérimente une mini-équipe de 3 agents IA spécialisés. Une révélation : et si je pouvais reproduire la dynamique d'une vraie équipe projet ?",
      highlight: "Je deviens l'API humaine"
    },
    {
      phase: "La Naissance",
      icon: Rocket,
      title: "ARKA : Un Cadre de Gouvernance",
      description: "Pas comme un assistant. Pas comme une surcouche. Mais comme un cadre de gouvernance local, où plusieurs LLMs peuvent enfin produire comme une équipe projet réelle. Une constitution exécutable qui impose règles, rôles, gates et responsabilités.",
      highlight: "Le produit, c'était la méthode"
    },
    {
      phase: "L'Évolution",
      icon: Target,
      title: "24 Experts & Constitution as Code",
      description: "ARKA n'utilise pas des 'agents à choisir'. Elle embarque 24 experts IA, prêts à l'emploi. Le PMO affecte dynamiquement les experts selon les besoins. L'AGP contrôle la conformité. Tu ne prompts pas... tu ouvres une mission.",
      highlight: "Pas d'impro. Pas d'IA hors de contrôle."
    }
  ];

  const principles = [
    "Une application locale qui orchestre plusieurs LLMs via des terminaux spécialisés",
    "Une constitution exécutable qui impose règles, rôles, slices, gates, responsabilités",
    "Un journal unifié qui trace chaque input, décision, livrable, preuve",
    "Une source unique de vérité dans le projet : ARKA_META",
    "Une anti-improvisation radicale : pas de livrable sans gate validé"
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] to-black" />
        <div className="container mx-auto px-6 lg:px-20 relative z-10">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              L'Histoire <span className="text-[#cb0f44]">d'ARKA</span>
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed">
              Ce n'est pas un produit né d'un business plan. C'est une découverte, issue d'un usage extrême, réel, autodidacte — celui de faire collaborer plusieurs IA spécialisées dans un projet complexe, sans perdre le contrôle.
            </p>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-16 bg-[#0a0a0a]">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="max-w-4xl mx-auto text-center">
            <blockquote className="text-3xl md:text-4xl font-bold leading-relaxed">
              « ARKA est née quand j'ai compris que le vrai produit... ce n'était pas le bot.
              <span className="block text-[#cb0f44] mt-4">C'était la méthode pour les faire travailler ensemble. »</span>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24">
        <div className="container mx-auto px-6 lg:px-20">
          <h2 className="text-3xl font-bold mb-16 text-center">Le Parcours</h2>
          <div className="max-w-5xl mx-auto space-y-16">
            {timeline.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="relative">
                  {idx < timeline.length - 1 && (
                    <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-white/10 hidden md:block" />
                  )}
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-[#cb0f44]/10 border-2 border-[#cb0f44] flex items-center justify-center">
                        <Icon className="text-[#cb0f44]" size={28} />
                      </div>
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="inline-block px-3 py-1 bg-white/5 text-[#cb0f44] text-xs font-medium mb-4">
                        {item.phase}
                      </div>
                      <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                      <p className="text-gray-400 leading-relaxed mb-4">{item.description}</p>
                      <div className="inline-block px-4 py-2 bg-[#cb0f44]/10 border-l-4 border-[#cb0f44]">
                        <p className="text-white font-medium">{item.highlight}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What is ARKA */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Ce que Fait ARKA</h2>
            <p className="text-xl text-gray-400 mb-12">
              ARKA transforme les LLMs en véritable organisation projet, automatisée mais entièrement gouvernée.
            </p>
            <div className="space-y-6">
              {principles.map((principle, idx) => (
                <div key={idx} className="flex items-start gap-4 p-6 bg-black border border-white/10">
                  <div className="w-8 h-8 bg-[#cb0f44]/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-[#cb0f44] rounded-full" />
                  </div>
                  <p className="text-gray-300 text-lg">{principle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-24">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Pourquoi C'est une Rupture</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-xl text-gray-400 mb-6">
                ARKA ne cherche pas à « améliorer ChatGPT ». Elle transforme les LLMs en véritable organisation projet, automatisée mais entièrement gouvernée.
              </p>
              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <div className="p-6 bg-[#0a0a0a] border border-white/10 text-center">
                  <div className="text-4xl font-bold text-[#cb0f44] mb-2">100%</div>
                  <div className="text-gray-400">Local</div>
                </div>
                <div className="p-6 bg-[#0a0a0a] border border-white/10 text-center">
                  <div className="text-4xl font-bold text-[#cb0f44] mb-2">100%</div>
                  <div className="text-gray-400">Vérifiable</div>
                </div>
                <div className="p-6 bg-[#0a0a0a] border border-white/10 text-center">
                  <div className="text-4xl font-bold text-[#cb0f44] mb-2">100%</div>
                  <div className="text-gray-400">Structuré</div>
                </div>
              </div>
              <div className="mt-12 p-8 bg-black border-l-4 border-[#cb0f44]">
                <p className="text-2xl font-bold text-white">
                  Pas d'impro. Pas d'IA hors de contrôle. Pas de black box.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HistoryPage;
