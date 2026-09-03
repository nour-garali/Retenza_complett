'use client';

import Link from 'next/link';
import { CheckCircle, Clock, Key, LayoutDashboard } from 'lucide-react';
import PublicNavbar from '@/components/landing/PublicNavbar';

export default function DemandeEnvoyeePage() {
  const timeline = [
    { icon: <CheckCircle className="w-5 h-5" />, title: 'Demande envoyée', active: true, done: true },
    { icon: <Clock className="w-5 h-5" />, title: 'Vérification Retenza', active: true, done: false },
    { icon: <Key className="w-5 h-5" />, title: 'Activation du compte', active: false, done: false },
    { icon: <LayoutDashboard className="w-5 h-5" />, title: 'Accès au Dashboard', active: false, done: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF0EC] to-[#F9E2DB] font-inter relative overflow-hidden flex flex-col">
      
      {/* ── BACKGROUND GRAPHICS ── */}
      <div className="absolute top-0 right-0 h-full w-[35%] bg-[#F4CDBF] rounded-l-full translate-x-[80%] -z-0 opacity-100 flex items-center justify-center">
        <div className="absolute w-[700px] h-[700px] border-[40px] border-white/30 rounded-full pointer-events-none"></div>
        <div className="absolute w-[500px] h-[500px] border-[40px] border-white/30 rounded-full pointer-events-none"></div>
      </div>
      <div className="absolute top-[10%] left-0 h-[110%] w-[25%] bg-[#F4CDBF] rounded-r-full -translate-x-[80%] -z-0 opacity-100 flex items-center justify-center">
        <div className="absolute w-[500px] h-[500px] border-[40px] border-white/30 rounded-full pointer-events-none"></div>
        <div className="absolute w-[300px] h-[300px] border-[40px] border-white/30 rounded-full pointer-events-none"></div>
      </div>
      
      <PublicNavbar />

      {/* ── CSS ANIMATIONS ── */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(-2deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-slower { animation: float-slower 8s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 4s ease-in-out infinite; }
      `}</style>

      <main className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col items-center justify-center p-6 z-10 relative">
        
        {/* ── DECORATIVE 3D ELEMENTS ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden hidden lg:block">
          
          {/* TOP LEFT - Hourglass */}
          <div className="absolute top-[15%] left-[2%] xl:left-[8%] w-48 h-48 animate-float-slow opacity-90">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="glass-body" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF"/>
                  <stop offset="100%" stopColor="#F9E2DB"/>
                </linearGradient>
                <linearGradient id="sand" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FCE7DD"/>
                  <stop offset="100%" stopColor="#F4CDBF"/>
                </linearGradient>
                <filter id="shadow-glass" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="4" dy="12" stdDeviation="8" floodColor="#BF2112" floodOpacity="0.08"/>
                </filter>
              </defs>
              <path d="M 180 160 Q 130 140 130 90 Q 150 40 100 20" stroke="#F4CDBF" strokeWidth="3" strokeDasharray="6 6" fill="none" strokeLinecap="round" />
              <g filter="url(#shadow-glass)" transform="rotate(-15 100 80)">
                <path d="M50 30 L110 30 L90 80 L110 130 L50 130 L70 80 Z" fill="url(#glass-body)"/>
                <path d="M50 30 L110 30 L110 20 L50 20 Z" fill="#F4CDBF"/>
                <path d="M50 130 L110 130 L110 140 L50 140 Z" fill="#F4CDBF"/>
                {/* Sand top */}
                <path d="M60 40 L100 40 L85 70 L75 70 Z" fill="url(#sand)"/>
                {/* Sand bottom */}
                <path d="M75 90 L85 90 L100 120 L60 120 Z" fill="url(#sand)"/>
                <line x1="80" y1="70" x2="80" y2="90" stroke="url(#sand)" strokeWidth="2"/>
              </g>
            </svg>
          </div>

          {/* BOTTOM LEFT - Document */}
          <div className="absolute bottom-[10%] left-[4%] xl:left-[12%] w-40 h-40 animate-float-slower opacity-90">
            <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="doc-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF"/>
                  <stop offset="100%" stopColor="#F9E2DB"/>
                </linearGradient>
                <filter id="shadow-doc" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="15" stdDeviation="10" floodColor="#BF2112" floodOpacity="0.06"/>
                </filter>
              </defs>
              <g filter="url(#shadow-doc)" transform="rotate(-10 80 80)">
                <rect x="30" y="20" width="80" height="110" rx="8" fill="url(#doc-bg)"/>
                <rect x="45" y="40" width="50" height="8" rx="4" fill="#FCE7DD"/>
                <rect x="45" y="60" width="40" height="8" rx="4" fill="#FCE7DD"/>
                <rect x="45" y="80" width="30" height="8" rx="4" fill="#FCE7DD"/>
                {/* Stamp / Check */}
                <circle cx="85" cy="95" r="18" fill="#F4CDBF"/>
                <path d="M78 95 L83 100 L93 88" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
            </svg>
          </div>

          {/* TOP RIGHT - Badge */}
          <div className="absolute top-[10%] right-[5%] xl:right-[15%] w-48 h-48 animate-float-slower opacity-90">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="badge-grad" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#FFFFFF"/>
                  <stop offset="100%" stopColor="#FCE7DD"/>
                </radialGradient>
                <filter id="shadow-badge" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="5" dy="15" stdDeviation="15" floodColor="#BF2112" floodOpacity="0.05"/>
                </filter>
              </defs>
              <circle cx="160" cy="50" r="15" stroke="#F4CDBF" strokeWidth="6" fill="none" className="animate-float-fast" />
              <g filter="url(#shadow-badge)" transform="translate(60, 50)">
                <path d="M40 0 L52 12 L70 12 L70 30 L82 42 L70 54 L70 72 L52 72 L40 84 L28 72 L10 72 L10 54 L-2 42 L10 30 L10 12 L28 12 Z" fill="url(#badge-grad)"/>
                <path d="M25 42 L35 52 L55 30" stroke="#F4CDBF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
            </svg>
          </div>

          {/* BOTTOM RIGHT - Shop */}
          <div className="absolute bottom-[15%] right-[8%] xl:right-[18%] w-40 h-40 animate-float-slow opacity-90">
            <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="shop-body" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF"/>
                  <stop offset="100%" stopColor="#F9E2DB"/>
                </linearGradient>
                <linearGradient id="awning" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F4CDBF"/>
                  <stop offset="50%" stopColor="#FFFFFF"/>
                  <stop offset="100%" stopColor="#FCE7DD"/>
                </linearGradient>
                <filter id="shadow-shop" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="-4" dy="12" stdDeviation="10" floodColor="#BF2112" floodOpacity="0.08"/>
                </filter>
                <radialGradient id="sphere-grad" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#FFFFFF"/>
                  <stop offset="100%" stopColor="#F4CDBF"/>
                </radialGradient>
              </defs>
              
              <circle cx="20" cy="110" r="12" fill="url(#sphere-grad)" className="animate-float-fast"/>
              
              <g transform="translate(120, 30) scale(0.6)" className="animate-float-slower">
                <path d="M20 0 L40 10 L20 20 L0 10 Z" fill="#FFFFFF"/>
                <path d="M0 10 L20 20 L20 40 L0 30 Z" fill="#F4CDBF"/>
                <path d="M40 10 L20 20 L20 40 L40 30 Z" fill="#F9E2DB"/>
              </g>
              
              <g filter="url(#shadow-shop)" transform="rotate(10 80 80) translate(10, 10)">
                {/* Shop body */}
                <rect x="30" y="50" width="80" height="70" rx="8" fill="url(#shop-body)"/>
                {/* Door */}
                <rect x="55" y="80" width="30" height="40" rx="4" fill="#FCE7DD"/>
                <circle cx="80" cy="100" r="2" fill="#F4CDBF"/>
                {/* Awning */}
                <path d="M20 50 L40 20 L100 20 L120 50 Z" fill="url(#awning)"/>
                <path d="M20 50 Q 30 60 40 50 Q 50 60 60 50 Q 70 60 80 50 Q 90 60 100 50 Q 110 60 120 50" fill="url(#awning)"/>
              </g>
            </svg>
          </div>
        </div>

        <div className="w-full max-w-[540px] relative z-20">
          <div className="w-full bg-white rounded-[32px] p-6 lg:p-10 shadow-2xl shadow-[#BF2112]/15 border-l-[4px] border-l-[#BF2112] border-t border-r border-b border-white relative text-center">
          <div className="w-20 h-20 bg-[#FCE7DD] text-[#BF2112] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          
          <h1 className="font-bricolage text-[28px] font-extrabold text-[#0D1117] mb-4 leading-tight">
            Votre demande est en cours de vérification
          </h1>
          
          <p className="text-[#5D534F] text-[15px] mb-8 leading-relaxed">
            Merci ! Nous avons bien reçu votre demande de partenariat. 
            Notre équipe va examiner les informations de votre commerce sous 48 heures ouvrées.
          </p>

          <div className="bg-[#FDF3F0] rounded-2xl p-6 text-left mb-8 border border-[#FCE7DD]/50">
            <div className="space-y-6">
              {timeline.map((item, i) => (
                <div key={i} className="flex items-center gap-4 relative">
                  {i < timeline.length - 1 && (
                    <div className={`absolute top-8 left-4 w-[2px] h-10 ${item.done ? 'bg-[#BF2112]' : 'bg-[#FCE7DD]'}`} />
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                    item.done ? 'bg-[#BF2112] text-white' : 
                    item.active ? 'bg-white border-2 border-[#BF2112] text-[#BF2112]' : 
                    'bg-white border-2 border-[#E8D8D4] text-[#C0A099]'
                  }`}>
                    {item.icon}
                  </div>
                  <p className={`font-semibold text-[14px] ${item.active ? 'text-[#1B100C]' : 'text-[#C0A099]'}`}>
                    {item.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[#9C8B82] text-[13px] mb-6">
            Vous recevrez un email dès que votre demande sera approuvée pour créer votre mot de passe.
          </p>
          
          <Link href="/" className="inline-block px-8 py-3.5 rounded-2xl bg-[#0D1117] hover:bg-black text-white font-bold text-[14px] transition-all shadow-xl shadow-black/10">
            Retourner à l'accueil
          </Link>
        </div>
        </div>
      </main>
    </div>
  );
}
