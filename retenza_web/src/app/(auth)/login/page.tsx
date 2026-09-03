'use client';

import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { loginAction } from '@/services/authActions';
import Link from 'next/link';
import PublicNavbar from '@/components/landing/PublicNavbar';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!email || !password) { 
      setErrorMsg('Veuillez remplir tous les champs'); 
      return; 
    }
    
    setIsLoading(true);
    const res = await loginAction(email, password);
    
    if (res.success) {
      setSuccessMsg('Connexion réussie. Redirection...');
      // Redirection automatique selon le rôle retourné par le backend
      if (res.role === 'admin') {
        window.location.href = '/admin';
      } else if (res.role === 'client') {
        window.location.href = '/client';
      } else if (res.role === 'merchant' && res.isOnboardingComplete === false) {
        window.location.href = '/merchant/onboarding'; // Premier login → configuration initiale
      } else {
        window.location.href = '/merchant';
      }
    } else {
      setErrorMsg(res.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF0EC] to-[#F9E2DB] font-inter relative overflow-hidden flex flex-col">
      
      {/* ── BACKGROUND GRAPHICS ── */}
      <div className="absolute top-0 right-0 h-full w-[45%] bg-[#F4CDBF] rounded-l-full translate-x-[65%] -z-0 opacity-100 flex items-center justify-center">
        <div className="absolute w-[800px] h-[800px] border-[40px] border-white/30 rounded-full pointer-events-none"></div>
        <div className="absolute w-[600px] h-[600px] border-[40px] border-white/30 rounded-full pointer-events-none"></div>
      </div>
      
      <PublicNavbar />

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center justify-between px-8 md:px-12 lg:px-20 py-6 lg:py-2 z-10 gap-16 lg:gap-8">
         
         {/* ── LEFT SIDE (Branding) ── */}
         <div className="w-full lg:w-[45%] flex flex-col pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#BF2112]/[0.08] border border-[#BF2112]/[0.16] rounded-full w-fit mb-5 lg:mb-6">
               <ShieldCheck className="w-3.5 h-3.5 text-[#BF2112]" /> 
               <span className="text-[#BF2112] text-[12px] font-bold tracking-[0.04em]">ACCÈS SÉCURISÉ</span>
            </div>
            
            <h1 className="font-bricolage text-[42px] md:text-[52px] lg:text-[50px] font-bold leading-[1.05] text-[#1B100C] tracking-tight mb-3 lg:mb-4">
              Bienvenue dans<br/>votre espace<br/>
              <span className="text-[#BF2112]">Retenza.</span>
            </h1>
            
            <p className="text-[#5D534F] text-[15px] md:text-base leading-relaxed mb-6 lg:mb-8 max-w-sm">
              Connectez-vous pour retrouver vos avantages, consulter vos performances et développer votre relation client en toute simplicité.
            </p>
            
            <div className="space-y-6">
               <div className="flex gap-4 items-center">
                 <div className="w-10 h-10 rounded-2xl bg-[#FCE7DD] flex items-center justify-center shrink-0">
                   <CheckCircle2 className="w-5 h-5 text-[#BF2112]" />
                 </div>
                 <h3 className="text-[#1B100C] font-semibold text-[14px]">Connexion rapide et protégée</h3>
               </div>
               
               <div className="flex gap-4 items-center">
                 <div className="w-10 h-10 rounded-2xl bg-[#FCE7DD] flex items-center justify-center shrink-0">
                   <CheckCircle2 className="w-5 h-5 text-[#BF2112]" />
                 </div>
                 <h3 className="text-[#1B100C] font-semibold text-[14px]">Accès unifié (Pro & Client)</h3>
               </div>
            </div>
         </div>

         {/* ── RIGHT SIDE (Form Card) ── */}
         <div className="w-full lg:w-[55%] flex justify-end">
            <div className="w-full max-w-[540px] bg-[#FFFBFA] rounded-[32px] p-6 lg:p-8 mt-4 lg:mt-8 shadow-2xl shadow-[#BF2112]/15 border-l-[4px] border-l-[#BF2112] border-t border-r border-b border-white relative">
               
               <div className="flex flex-col items-center mb-6">
                 <h2 className="font-bricolage text-[22px] font-bold text-[#1B100C] mb-1">Se connecter</h2>
               </div>

               {/* ── ALERTS ── */}
               {errorMsg && (
                 <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-[13px] rounded-xl flex items-start gap-3">
                   <div className="mt-0.5">⚠️</div>
                   <div className="font-medium">{errorMsg}</div>
                 </div>
               )}
               {successMsg && (
                 <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 text-[13px] rounded-xl flex items-start gap-3">
                   <CheckCircle2 className="w-4 h-4 mt-0.5" />
                   <div className="font-medium">{successMsg}</div>
                 </div>
               )}

               {/* ── SINGLE UNIFIED FORM ── */}
               <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="space-y-2">
                   <label className="text-[12px] font-bold text-[#1B100C] ml-1 uppercase tracking-wide opacity-80">Adresse e-mail</label>
                   <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <Mail className="w-4 h-4 text-[#BF2112]/50" />
                     </div>
                     <input
                       type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                       placeholder="votre@email.com"
                       className="w-full bg-[#FDF3F0] border border-[#FCE7DD]/60 focus:border-[#BF2112] focus:ring-[3px] focus:ring-[#BF2112]/10 outline-none rounded-xl py-3.5 lg:py-3 pl-11 pr-4 text-[14px] font-medium text-gray-900 transition-all placeholder-gray-400 shadow-sm"
                     />
                   </div>
                 </div>
                 
                 <div className="space-y-2">
                   <div className="flex justify-between items-center ml-1">
                      <label className="text-[12px] font-bold text-[#1B100C] uppercase tracking-wide opacity-80">Mot de passe</label>
                   </div>
                   <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <Lock className="w-4 h-4 text-[#BF2112]/50" />
                     </div>
                     <input
                       type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                       placeholder="••••••••"
                       style={{ letterSpacing: showPassword || !password ? 'normal' : '2px' }}
                       className="w-full bg-[#FDF3F0] border border-[#FCE7DD]/60 focus:border-[#BF2112] focus:ring-[3px] focus:ring-[#BF2112]/10 outline-none rounded-xl py-3.5 lg:py-3 pl-11 pr-11 text-[14px] font-medium text-gray-900 transition-all placeholder-gray-400 shadow-sm"
                     />
                     <button 
                       type="button" onClick={() => setShowPassword(!showPassword)}
                       className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center outline-none text-gray-400 hover:text-[#D73E26] transition-colors"
                     >
                       {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                     </button>
                   </div>
                 </div>

                 <div className="pt-4 flex flex-col gap-4">
                   <button 
                     type="submit" disabled={isLoading}
                     className="w-full h-[54px] lg:h-[48px] rounded-xl bg-gradient-to-r from-[#BF2112] to-[#9E1A0A] hover:to-[#BF2112] text-white font-semibold text-[14px] transition-all active:scale-[0.98] flex items-center justify-center shadow-lg shadow-[#BF2112]/25 border border-[#BF2112]/50 disabled:opacity-70 gap-2"
                   >
                     {isLoading ? (
                       <div className="w-[20px] h-[20px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                       <>Se connecter <ArrowRight className="w-4 h-4 ml-1" /></>
                     )}
                   </button>
                   
                   <div className="text-center">
                     <a href="/forgot-password" className="text-[13px] font-semibold text-[#BF2112] hover:underline">Mot de passe oublié ?</a>
                   </div>
                 </div>
               </form>

            </div>
            
            {/* Note en bas de carte */}
            <div className="absolute -bottom-16 left-0 w-full text-center">
               <p className="text-[13px] text-gray-500 font-medium">
                 En vous connectant, vous acceptez nos <a href="#" className="underline">Conditions d'utilisation</a>.
               </p>
            </div>
         </div>
      </main>
    </div>
  );
}
