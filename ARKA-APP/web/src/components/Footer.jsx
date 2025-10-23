import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/10">
      <div className="container mx-auto px-6 lg:px-20 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-1">
            <div className="w-32 h-10 mb-6">
              <svg viewBox="0 0 699 222" className="w-full h-full">
                <path fill="#FFFFFF" d="M216.51,100.12c4.58-8.55,10.88-15.19,18.89-19.9c8.01-4.71,16.94-7.07,26.77-7.07c9.7,0,18.11,2.09,25.25,6.26c7.14,4.18,12.46,9.43,15.96,15.76v-20.2h18.59v110.71h-18.59v-20.61c-3.64,6.47-9.06,11.82-16.26,16.06c-7.21,4.24-15.59,6.36-25.15,6.36c-9.83,0-18.72-2.42-26.67-7.27c-7.95-4.85-14.21-11.65-18.79-20.41c-4.58-8.75-6.87-18.72-6.87-29.9C209.64,118.61,211.93,108.68,216.51,100.12z M298.33,108.31c-3.37-6.2-7.91-10.94-13.64-14.25c-5.73-3.3-12.02-4.95-18.89-4.95c-6.87,0-13.13,1.62-18.79,4.85c-5.66,3.24-10.17,7.95-13.54,14.14c-3.37,6.2-5.05,13.47-5.05,21.82c0,8.49,1.68,15.86,5.05,22.13c3.37,6.26,7.88,11.04,13.54,14.34c5.66,3.3,11.92,4.95,18.79,4.95c6.87,0,13.16-1.65,18.89-4.95c5.72-3.3,10.27-8.08,13.64-14.34c3.37-6.27,5.05-13.57,5.05-21.92S301.7,114.5,298.33,108.31z"/>
                <path fill="#FFFFFF" d="M389.14,77.3c5.59-3.16,12.22-4.75,19.9-4.75v23.84h-5.86c-9.03,0-15.86,2.29-20.51,6.87c-4.65,4.58-6.97,12.53-6.97,23.84v58.59h-23.03V74.36h23.03v16.16C379.07,84.87,383.55,80.46,389.14,77.3z"/>
                <path fill="#FFFFFF" d="M496.52,185.68l-34.35-47.27v47.27h-34.55V36.18h34.55v82.63l34.15-45.86h42.63l-46.87,56.57l47.27,56.16H496.52z"/>
                <path fill="#FFFFFF" d="M551.17,98.2c4.24-8.75,10.03-15.49,17.37-20.2c7.34-4.71,15.52-7.07,24.55-7.07c7.81,0,14.54,1.55,20.2,4.65c5.65,3.1,10.03,7.27,13.13,12.53V72.34h39.6v113.34h-39.6v-15.76c-3.1,5.25-7.51,9.43-13.23,12.53c-5.73,3.1-12.42,4.65-20.1,4.65c-9.03,0-17.21-2.35-24.55-7.07c-7.34-4.71-13.13-11.48-17.37-20.3c-4.24-8.82-6.36-19.09-6.36-30.81S546.93,106.96,551.17,98.2z M620.47,111.74c-3.97-4.17-8.86-6.26-14.65-6.26c-5.93,0-10.84,2.06-14.75,6.16c-3.91,4.11-5.86,9.86-5.86,17.27c0,7.27,1.95,13.03,5.86,17.28c3.91,4.24,8.82,6.36,14.75,6.36c5.79,0,10.67-2.09,14.65-6.27c3.97-4.17,5.96-9.96,5.96-17.37C626.43,121.64,624.44,115.92,620.47,111.74z"/>
                <path fill="#cb0f44" d="M111.03,144.12l-35.72,41.56L111.03,144.12z"/>
                <path fill="#FFFFFF" d="M33.58,185.68H71.3c2.55,0,4.98-1.11,6.64-3.05l33.1-38.52l-0.13,32.78c-0.02,4.85,3.91,8.79,8.75,8.79h26.12c4.83,0,8.75-3.92,8.75-8.75V36.5L28.72,174.7C24.89,178.92,27.88,185.68,33.58,185.68z"/>
                <path fill="#FFFFFF" d="M100.29,65.57L75.32,36.5H33.58c-5.7,0-8.69,6.77-4.85,10.98l43.05,47.29L100.29,65.57z"/>
              </svg>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Transformer des LLMs en équipes coordonnées, auditables et pilotables
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-[#cb0f44] transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#cb0f44] transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#cb0f44] transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-[#cb0f44] transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">Produit</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/features" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link to="/experts" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Experts
                </Link>
              </li>
              <li>
                <Link to="/beta" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Programme Bêta
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Entreprise</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/histoire" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Notre Histoire
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Carrières
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Légal</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Confidentialité
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                  CGU
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Mentions légales
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Licence MIT
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-gray-500 text-sm text-center">
            © 2025 ARKA. Tous droits réservés. Propulsé par OpenAI, Anthropic, Google Gemini.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
