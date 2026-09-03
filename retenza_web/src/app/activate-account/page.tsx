'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, LogIn } from 'lucide-react';
import { activateAccountAction } from '@/services/authActions';
import PublicNavbar from '@/components/landing/PublicNavbar';

function ActivateAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!token) {
      setErrorMsg("Lien d'activation invalide ou manquant.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    const res = await activateAccountAction({ token, password, confirmPassword });
    setIsLoading(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/merchant/onboarding');
      }, 2500);
    } else {
      setErrorMsg(res.message);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>

        <h1 className="font-bricolage text-[26px] font-extrabold text-[#0D1117] mb-3 leading-tight">
          Compte activé !
        </h1>
        <p className="text-[#5D534F] text-[15px] mb-2 leading-relaxed">
          Votre compte est actif. Redirection vers la configuration de votre espace commerçant...
        </p>
        <p className="text-[12px] text-[#9C8B82] mb-8">
          Quelques étapes rapides pour configurer votre commerce.
        </p>

        {/* Branded spinner */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-[#BF2112] border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] text-[#9C8B82] font-medium">Redirection en cours…</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="w-14 h-14 bg-[#FCE7DD] rounded-2xl flex items-center justify-center mb-5 shadow-sm">
          <KeyRound className="w-7 h-7 text-[#BF2112]" />
        </div>
        <h1 className="font-bricolage text-[26px] font-extrabold text-[#0D1117] mb-2 leading-tight">
          Créer votre mot de passe
        </h1>
        <p className="text-[#9C8B82] text-[14px] leading-relaxed">
          Dernière étape avant d'accéder à votre espace partenaire Retenza.
        </p>
      </div>

      {!token ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-[13.5px] font-medium leading-relaxed">
            Lien d'activation introuvable.<br />
            Veuillez utiliser le lien fourni dans l'email d'activation.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-[13.5px] font-medium rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[12px] font-bold text-[#1B100C] mb-1.5 uppercase tracking-wide opacity-80">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white border border-[#E8D8D4] rounded-xl py-3.5 px-4 pr-12 text-[14px] text-gray-900 outline-none focus:border-[#BF2112] focus:ring-[3px] focus:ring-[#BF2112]/10 transition-all placeholder-gray-400 shadow-sm"
                placeholder="8 caractères minimum"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#BF2112] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[12px] font-bold text-[#1B100C] mb-1.5 uppercase tracking-wide opacity-80">
              Confirmer le mot de passe
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-white border border-[#E8D8D4] rounded-xl py-3.5 px-4 text-[14px] text-gray-900 outline-none focus:border-[#BF2112] focus:ring-[3px] focus:ring-[#BF2112]/10 transition-all placeholder-gray-400 shadow-sm"
              placeholder="Répéter le mot de passe"
            />
          </div>

          {/* Password strength hint */}
          {password.length > 0 && (
            <div className="flex items-center gap-2">
              {[4, 6, 8, 12].map(len => (
                <div
                  key={len}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    password.length >= len ? 'bg-[#BF2112]' : 'bg-[#FCE7DD]'
                  }`}
                />
              ))}
              <span className="text-[11px] text-[#9C8B82] ml-1 whitespace-nowrap">
                {password.length < 6 ? 'Trop court' : password.length < 8 ? 'Moyen' : password.length < 12 ? 'Bon' : 'Excellent'}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || password.length < 8}
            className="w-full h-[52px] rounded-xl bg-gradient-to-r from-[#BF2112] to-[#9E1A0A] hover:to-[#BF2112] text-white font-semibold text-[14px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-[#BF2112]/25 border border-[#BF2112]/50 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Activer mon compte <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      )}
    </>
  );
}

export default function ActivateAccountPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF0EC] to-[#F9E2DB] font-inter relative overflow-hidden flex flex-col">

      {/* Background circles */}
      <div className="absolute top-0 right-0 h-full w-[35%] bg-[#F4CDBF] rounded-l-full translate-x-[80%] -z-0 opacity-100 flex items-center justify-center">
        <div className="absolute w-[700px] h-[700px] border-[40px] border-white/30 rounded-full pointer-events-none"></div>
        <div className="absolute w-[500px] h-[500px] border-[40px] border-white/30 rounded-full pointer-events-none"></div>
      </div>
      <div className="absolute top-[10%] left-0 h-[110%] w-[25%] bg-[#F4CDBF] rounded-r-full -translate-x-[80%] -z-0 opacity-100 flex items-center justify-center">
        <div className="absolute w-[500px] h-[500px] border-[40px] border-white/30 rounded-full pointer-events-none"></div>
        <div className="absolute w-[300px] h-[300px] border-[40px] border-white/30 rounded-full pointer-events-none"></div>
      </div>

      <PublicNavbar />

      <main className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col items-center justify-center p-6 z-10 relative">
        <div className="w-full max-w-[480px]">

          {/* Brand anchor */}
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-2.5 opacity-70 hover:opacity-100 transition-opacity">
              <div className="w-7 h-7 bg-[#BF2112] rounded-lg flex items-center justify-center rotate-3">
                <svg className="w-4 h-4 text-white -rotate-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.8 1 6.4 2.6l-2.4 2.4" />
                </svg>
              </div>
              <span className="font-bricolage font-bold text-sm text-[#1B100C] tracking-tight">Retenza Connect</span>
            </Link>
          </div>

          {/* Card */}
          <div className="w-full bg-[#FFFBFA] rounded-[32px] p-6 lg:p-8 shadow-2xl shadow-[#BF2112]/15 border-l-[4px] border-l-[#BF2112] border-t border-r border-b border-white relative">
            <Suspense fallback={
              <div className="flex justify-center p-10">
                <div className="w-8 h-8 border-4 border-[#BF2112] border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              <ActivateAccountContent />
            </Suspense>
          </div>

          {/* Se connecter link */}
          <p className="text-center text-[13px] text-[#9C8B82] mt-5">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-[#BF2112] font-semibold hover:underline inline-flex items-center gap-1">
              Se connecter <LogIn className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
