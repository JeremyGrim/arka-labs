import React, { useState } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
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
    console.log('Contact form:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-[#0a0a0a] to-black">
        <div className="container mx-auto px-6 lg:px-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Contactez <span className="text-[#cb0f44]">l'Équipe ARKA</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl">
            Une question ? Un projet ? Notre équipe est là pour vous accompagner.
          </p>
        </div>
      </section>

      {/* Contact Info & Form */}
      <section className="py-24">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-6">Informations</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#cb0f44]/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="text-[#cb0f44]" size={20} />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Email</div>
                      <a href="mailto:contact@arka.ai" className="text-white hover:text-[#cb0f44] transition-colors">
                        contact@arka.ai
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#cb0f44]/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="text-[#cb0f44]" size={20} />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Téléphone</div>
                      <a href="tel:+33123456789" className="text-white hover:text-[#cb0f44] transition-colors">
                        +33 1 23 45 67 89
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#cb0f44]/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="text-[#cb0f44]" size={20} />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Adresse</div>
                      <p className="text-white">
                        123 Avenue des Champs-Élysées<br />
                        75008 Paris, France
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-[#0a0a0a] border border-white/10">
                <h3 className="font-bold mb-4">Horaires</h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex justify-between">
                    <span>Lundi - Vendredi</span>
                    <span className="text-white">9h - 18h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Samedi - Dimanche</span>
                    <span className="text-gray-500">Fermé</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="p-8 bg-[#0a0a0a] border border-white/10">
                <h2 className="text-2xl font-bold mb-6">Envoyez-nous un message</h2>
                
                {submitted ? (
                  <div className="p-6 bg-[#cb0f44]/10 border border-[#cb0f44]/30 text-center">
                    <Send className="text-[#cb0f44] mx-auto mb-4" size={32} />
                    <p className="text-[#cb0f44] font-medium">Message envoyé avec succès !</p>
                    <p className="text-gray-400 text-sm mt-2">Nous vous répondrons dans les plus brefs délais.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Nom complet *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-black border border-white/10 text-white focus:outline-none focus:border-[#cb0f44]/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-black border border-white/10 text-white focus:outline-none focus:border-[#cb0f44]/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Sujet *</label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-black border border-white/10 text-white focus:outline-none focus:border-[#cb0f44]/50 transition-colors"
                      >
                        <option value="">Sélectionner un sujet...</option>
                        <option value="demo">Demande de démo</option>
                        <option value="beta">Programme bêta</option>
                        <option value="partnership">Partenariat</option>
                        <option value="support">Support technique</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Message *</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        placeholder="Décrivez votre demande..."
                        className="w-full px-4 py-3 bg-black border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#cb0f44]/50 transition-colors resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full px-8 py-4 bg-[#cb0f44] text-white font-medium flex items-center justify-center gap-2 hover:bg-[#cb0f44]/90 hover:scale-105 transition-all"
                    >
                      <Send size={20} />
                      Envoyer le message
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactPage;
