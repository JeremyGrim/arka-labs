import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const BetaPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    role: '',
    useCase: '',
    teamSize: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock submission
    console.log('Beta request:', formData);
    setSubmitted(true);
  };

  const benefits = [
    "Accès anticipé à ARKA avant le lancement public",
    "Support dédié de l'équipe ARKA",
    "Influence directe sur le développement du produit",
    "Formation et onboarding personnalisés",
    "Tarification préférentielle pour les early adopters",
    "Accès exclusif à la communauté bêta"
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <section className="min-h-screen flex items-center justify-center pt-20">
          <div className="container mx-auto px-6 lg:px-20">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 bg-[#cb0f44]/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle className="text-[#cb0f44]" size={48} />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Demande reçue !
              </h1>
              <p className="text-xl text-gray-400 mb-8">
                Merci pour votre intérêt. Notre équipe va étudier votre demande et vous contactera sous 48h.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-8 py-4 bg-white/5 border border-white/20 text-white font-medium hover:bg-white/10 transition-all"
              >
                Envoyer une autre demande
              </button>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-[#0a0a0a] to-black">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block mb-6 px-4 py-2 bg-[#cb0f44]/10 border border-[#cb0f44]/30">
              <span className="text-[#cb0f44] text-sm font-medium">Programme Bêta</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Rejoignez la <span className="text-[#cb0f44]">Révolution</span> ARKA
            </h1>
            <p className="text-xl text-gray-400">
              Soyez parmi les premiers à découvrir ARKA et à transformer votre façon de travailler avec l'IA.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-[#0a0a0a]">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Avantages du Programme Bêta</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-4 p-6 bg-black border border-white/10">
                  <div className="w-6 h-6 bg-[#cb0f44]/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="text-[#cb0f44]" size={16} />
                  </div>
                  <p className="text-gray-300">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-24">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Demander un Accès Bêta</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Prénom *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#cb0f44]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nom *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#cb0f44]/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email professionnel *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#cb0f44]/50 transition-colors"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Entreprise *</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#cb0f44]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Rôle *</label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    placeholder="CTO, Product Manager, etc."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#cb0f44]/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cas d'usage principal *</label>
                <select
                  name="useCase"
                  value={formData.useCase}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#cb0f44]/50 transition-colors"
                >
                  <option value="">Sélectionner...</option>
                  <option value="audit">Audit & Compliance</option>
                  <option value="delivery">Delivery & Développement</option>
                  <option value="marketing">Marketing & Communication</option>
                  <option value="rh">Ressources Humaines</option>
                  <option value="ops">Opérations & Support</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Taille de l'équipe *</label>
                <select
                  name="teamSize"
                  value={formData.teamSize}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#cb0f44]/50 transition-colors"
                >
                  <option value="">Sélectionner...</option>
                  <option value="1-10">1-10 personnes</option>
                  <option value="11-50">11-50 personnes</option>
                  <option value="51-200">51-200 personnes</option>
                  <option value="201+">201+ personnes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Parlez-nous de votre projet (optionnel)</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Quels sont vos objectifs avec ARKA ? Quels défis cherchez-vous à résoudre ?"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#cb0f44]/50 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full px-8 py-4 bg-[#cb0f44] text-white font-medium hover:bg-[#cb0f44]/90 hover:scale-105 transition-all"
              >
                Envoyer ma demande
              </button>

              <p className="text-sm text-gray-500 text-center">
                En soumettant ce formulaire, vous acceptez d'être contacté par l'équipe ARKA.
              </p>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BetaPage;
