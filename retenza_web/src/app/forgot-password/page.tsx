'use client';

import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, Send } from 'lucide-react';
import { forgotPasswordAction } from '@/services/authActions';
import Link from 'next/link';
import PublicNavbar from '@/components/landing/PublicNavbar';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setErrorMsg('');
    setIsLoading(true);
    const res = await forgotPasswordAction(email);
    setIsLoading(false);
    if (res.success) {
      setSent(true);
    } else {
      setErrorMsg(res.message);
    }
  };

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

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col items-center justify-center p-6 z-10 relative">
        
        {/* ── DECORATIVE 3D ELEMENTS ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden hidden lg:block">
          
          {/* TOP LEFT - Paper Plane */}
          <div className="absolute top-[15%] left-[2%] xl:left-[8%] w-48 h-48 animate-float-slow opacity-90">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="plane-body" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF"/>
                  <stop offset="100%" stopColor="#F9E2DB"/>
                </linearGradient>
                <linearGradient id="plane-wing" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFF2EE"/>
                  <stop offset="100%" stopColor="#F4CDBF"/>
                </linearGradient>
                <filter id="shadow-plane" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="4" dy="12" stdDeviation="8" floodColor="#BF2112" floodOpacity="0.08"/>
                </filter>
              </defs>
              <path d="M 180 180 Q 120 160 140 80 Q 150 40 100 40" stroke="#F4CDBF" strokeWidth="3" strokeDasharray="6 6" fill="none" strokeLinecap="round" />
              <g filter="url(#shadow-plane)" transform="rotate(-15 100 40) translate(20, -10)">
                <path d="M40 80 L90 30 L110 80 Z" fill="url(#plane-wing)"/>
                <path d="M40 80 L110 80 L70 120 Z" fill="url(#plane-body)"/>
                <path d="M40 80 L70 120 L50 85 Z" fill="#FCE7DD"/>
              </g>
            </svg>
          </div>

          {/* BOTTOM LEFT - Envelope */}
          <div className="absolute bottom-[10%] left-[4%] xl:left-[12%] w-40 h-40 animate-float-slower opacity-90">
            <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="env-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F9E2DB"/>
                  <stop offset="100%" stopColor="#F4CDBF"/>
                </linearGradient>
                <linearGradient id="env-flap" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF"/>
                  <stop offset="100%" stopColor="#FFF2EE"/>
                </linearGradient>
                <filter id="shadow-env" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="15" stdDeviation="10" floodColor="#BF2112" floodOpacity="0.06"/>
                </filter>
              </defs>
              <g filter="url(#shadow-env)" transform="rotate(-10 80 80)">
                <rect x="20" y="40" width="120" height="80" rx="6" fill="url(#env-bg)"/>
                <path d="M20 40 L80 85 L140 40 Z" fill="url(#env-flap)" />
                <path d="M20 120 L80 75 L140 120 Z" fill="#FDF3F0" />
              </g>
            </svg>
          </div>

          {/* TOP RIGHT - Cloud */}
          <div className="absolute top-[10%] right-[5%] xl:right-[15%] w-48 h-48 animate-float-slower opacity-90">
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="cloud-grad" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#FFFFFF"/>
                  <stop offset="100%" stopColor="#FDF3F0"/>
                </radialGradient>
                <filter id="shadow-cloud" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="5" dy="15" stdDeviation="15" floodColor="#BF2112" floodOpacity="0.05"/>
                </filter>
              </defs>
              <circle cx="160" cy="50" r="15" stroke="#F4CDBF" strokeWidth="6" fill="none" className="animate-float-fast" />
              <g filter="url(#shadow-cloud)">
                <circle cx="70" cy="110" r="30" fill="url(#cloud-grad)"/>
                <circle cx="110" cy="90" r="40" fill="url(#cloud-grad)"/>
                <circle cx="150" cy="110" r="25" fill="url(#cloud-grad)"/>
                <rect x="70" y="90" width="80" height="50" rx="25" fill="url(#cloud-grad)"/>
              </g>
            </svg>
          </div>

          {/* BOTTOM RIGHT - Padlock */}
          <div className="absolute bottom-[15%] right-[8%] xl:right-[18%] w-40 h-40 animate-float-slow opacity-90">
            <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="lock-body" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF"/>
                  <stop offset="100%" stopColor="#F9E2DB"/>
                </linearGradient>
                <linearGradient id="lock-shackle" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FCE7DD"/>
                  <stop offset="50%" stopColor="#FFFFFF"/>
                  <stop offset="100%" stopColor="#F4CDBF"/>
                </linearGradient>
                <filter id="shadow-lock" x="-20%" y="-20%" width="140%" height="140%">
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
              
              <g filter="url(#shadow-lock)" transform="rotate(15 80 80)">
                <path d="M50 70 V 45 C 50 25 110 25 110 45 V 70" stroke="url(#lock-shackle)" strokeWidth="16" strokeLinecap="round" fill="none"/>
                <rect x="35" y="70" width="90" height="70" rx="12" fill="url(#lock-body)"/>
                <circle cx="80" cy="100" r="8" fill="#F4CDBF"/>
                <path d="M76 105 L74 120 L86 120 L84 105 Z" fill="#F4CDBF"/>
              </g>
            </svg>
          </div>
        </div>

        <div className="w-full max-w-[540px] relative z-20">


          {/* Card */}
          <div className="w-full bg-[#FFFBFA] rounded-[32px] p-6 lg:p-8 shadow-2xl shadow-[#BF2112]/15 border-l-[4px] border-l-[#BF2112] border-t border-r border-b border-white relative">

          {!sent ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="w-12 h-12 bg-[#FCE7DD] rounded-2xl flex items-center justify-center mb-5">
                  <Mail className="w-6 h-6 text-[#BF2112]" />
                </div>
                <h1 className="font-bricolage text-[24px] font-extrabold text-[#0D1117] mb-2">
                  Mot de passe oublié ?
                </h1>
                <p className="text-[#9C8B82] text-[14px] leading-relaxed">
                  Entrez votre adresse email. Si un compte existe, vous recevrez un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              {/* Error */}
              {errorMsg && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-[13px] text-red-700 font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-[#1B100C] uppercase tracking-wide opacity-80">
                    Adresse email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-[#BF2112]/50" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="w-full bg-[#FDF3F0] border border-[#FCE7DD]/60 focus:border-[#BF2112] focus:ring-[3px] focus:ring-[#BF2112]/10 outline-none rounded-xl py-3 pl-11 pr-4 text-[14px] font-medium text-gray-900 transition-all placeholder-gray-400 shadow-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full h-[54px] lg:h-[48px] rounded-xl bg-gradient-to-r from-[#BF2112] to-[#9E1A0A] hover:to-[#BF2112] text-white font-semibold text-[14px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-[#BF2112]/25 border border-[#BF2112]/50 disabled:opacity-70"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Send className="w-4 h-4" /> Envoyer le lien</>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* État envoyé */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[#FCE7DD] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-[#BF2112]" />
              </div>
              <h2 className="font-bricolage text-[22px] font-extrabold text-[#0D1117] mb-3">
                Email envoyé !
              </h2>
              <p className="text-[#9C8B82] text-[14px] leading-relaxed mb-6">
                Si un compte existe pour <span className="font-bold text-[#0D1117]">{email}</span>, vous recevrez un lien de réinitialisation valable <strong>1 heure</strong>.
              </p>
              <p className="text-[12px] text-[#B0A29A]">
                Vérifiez aussi vos spams.
              </p>
              <Link href="/login"
                className="inline-flex items-center gap-2 mt-8 text-[13px] font-bold text-[#D73E26] hover:underline">
                <ArrowLeft className="w-4 h-4" /> Retour à la connexion
              </Link>
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}
