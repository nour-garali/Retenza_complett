'use client';

import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { loginAction } from '@/services/authActions';
import Link from 'next/link';

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
    <div className="min-h-screen bg-[#FDFDFD] font-inter relative overflow-hidden flex flex-col">
      
      {/* ── BACKGROUND GRAPHICS ── */}
      <div className="absolute top-0 right-0 h-full w-[45%] bg-[#D73E26] rounded-l-full translate-x-[65%] -z-0 opacity-100 flex items-center justify-center">
        <div className="absolute w-[800px] h-[800px] border-[40px] border-white/5 rounded-full pointer-events-none"></div>
        <div className="absolute w-[600px] h-[600px] border-[40px] border-white/5 rounded-full pointer-events-none"></div>
      </div>
      
      {/* ── HEADER ── */}
      <header className="w-full flex items-center justify-between py-6 px-8 md:px-12 lg:px-20 z-10 relative">
        <Link href="/" className="flex items-center gap-3">
           <div className="w-10 h-10 bg-[#D73E26] rounded-xl flex items-center justify-center shadow-sm">
             <span className="text-white font-bricolage font-bold text-xl">R</span>
           </div>
           <span className="font-bricolage font-bold text-xl text-[#1B100C]">Retenza Connect</span>
        </Link>
        <div className="flex items-center gap-6">
           <Link href="/register/client" className="px-5 py-2.5 rounded-xl border border-gray-200 text-[#1B100C] font-semibold text-[13px] hover:bg-gray-50 transition-colors shadow-sm bg-white hidden sm:block">
             Créer un compte
           </Link>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center justify-between px-8 md:px-12 lg:px-20 py-8 lg:py-12 z-10 gap-16 lg:gap-8">
         
         {/* ── LEFT SIDE (Branding) ── */}
         <div className="w-full lg:w-[45%] flex flex-col pt-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FCE7DD] text-[#D73E26] rounded-full text-[11px] font-bold tracking-wider w-fit mb-8">
               <ShieldCheck className="w-3.5 h-3.5" /> ACCÈS SÉCURISÉ
            </div>
            
            <h1 className="font-bricolage text-[42px] md:text-[52px] lg:text-[60px] font-bold leading-[1.05] text-[#1B100C] tracking-tight mb-6">
              Bienvenue dans<br/>votre espace<br/>
              <span className="text-[#D73E26]">Retenza.</span>
            </h1>
            
            <p className="text-[#5D534F] text-[15px] md:text-base leading-relaxed mb-12 max-w-sm">
              Connectez-vous pour retrouver vos avantages, consulter vos performances et développer votre relation client en toute simplicité.
            </p>
            
            <div className="space-y-6">
               <div className="flex gap-4 items-center">
                 <div className="w-10 h-10 rounded-2xl bg-[#FCE7DD] flex items-center justify-center shrink-0">
                   <CheckCircle2 className="w-5 h-5 text-[#D73E26]" />
                 </div>
                 <h3 className="text-[#1B100C] font-semibold text-[14px]">Connexion rapide et protégée</h3>
               </div>
               
               <div className="flex gap-4 items-center">
                 <div className="w-10 h-10 rounded-2xl bg-[#FCE7DD] flex items-center justify-center shrink-0">
                   <CheckCircle2 className="w-5 h-5 text-[#D73E26]" />
                 </div>
                 <h3 className="text-[#1B100C] font-semibold text-[14px]">Accès unifié (Pro & Client)</h3>
               </div>
            </div>
         </div>

         {/* ── RIGHT SIDE (Form Card) ── */}
         <div className="w-full lg:w-[55%] flex justify-end">
            <div className="w-full max-w-[520px] bg-white rounded-[32px] p-8 md:p-12 shadow-[0_20px_80px_-15px_rgba(0,0,0,0.08)] border border-gray-100 relative">
               
               <div className="flex flex-col items-center mb-8">
                 <h2 className="font-bricolage text-3xl font-bold text-[#1B100C] mb-2">Se connecter</h2>
                 <p className="text-[#9C8B82] text-[14px]">Accédez à votre compte sécurisé.</p>
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
                       <Mail className="w-4 h-4 text-gray-400" />
                     </div>
                     <input
                       type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                       placeholder="votre@email.com"
                       className="w-full bg-[#FCFAFA] border border-gray-200 focus:bg-white focus:border-[#D73E26] focus:ring-4 focus:ring-[#D73E26]/10 outline-none rounded-xl py-3.5 pl-11 pr-4 text-[14px] font-medium text-gray-900 transition-all placeholder-gray-400"
                     />
                   </div>
                 </div>
                 
                 <div className="space-y-2">
                   <div className="flex justify-between items-center ml-1">
                      <label className="text-[12px] font-bold text-[#1B100C] uppercase tracking-wide opacity-80">Mot de passe</label>
                      <a href="/forgot-password" className="text-[12px] font-semibold text-[#D73E26] hover:underline">Oublié ?</a>
                   </div>
                   <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <Lock className="w-4 h-4 text-gray-400" />
                     </div>
                     <input
                       type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                       placeholder="••••••••"
                       style={{ letterSpacing: showPassword || !password ? 'normal' : '2px' }}
                       className="w-full bg-[#FCFAFA] border border-gray-200 focus:bg-white focus:border-[#D73E26] focus:ring-4 focus:ring-[#D73E26]/10 outline-none rounded-xl py-3.5 pl-11 pr-11 text-[14px] font-medium text-gray-900 transition-all placeholder-gray-400"
                     />
                     <button 
                       type="button" onClick={() => setShowPassword(!showPassword)}
                       className="absolute inset-y-0 right-0 pr-4 flex items-center justify-center outline-none text-gray-400 hover:text-[#D73E26] transition-colors"
                     >
                       {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                     </button>
                   </div>
                 </div>

                 <div className="pt-4">
                   <button 
                     type="submit" disabled={isLoading}
                     className="w-full h-[54px] rounded-xl bg-[#111111] hover:bg-[#000000] text-white font-semibold text-[15px] transition-all active:scale-[0.98] flex items-center justify-center shadow-xl shadow-black/10 disabled:opacity-70 gap-2"
                   >
                     {isLoading ? (
                       <div className="w-[20px] h-[20px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                       <>Se connecter <ArrowRight className="w-4 h-4 ml-1" /></>
                     )}
                   </button>
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
