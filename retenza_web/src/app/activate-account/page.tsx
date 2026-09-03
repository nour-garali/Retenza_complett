'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { activateAccountAction } from '@/services/authActions';

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
      setErrorMsg('Lien d\'activation invalide ou manquant.');
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
      // Redirection directe vers l'onboarding — première configuration obligatoire
      setTimeout(() => {
        router.push('/merchant/onboarding');
      }, 1500);
    } else {
      setErrorMsg(res.message);
    }
  };

  if (success) {
    return (
      <div className="text-center animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="font-bricolage text-[28px] font-extrabold text-[#0D1117] mb-4">
          Compte activé !
        </h1>
        <p className="text-[#5D534F] text-[15px] mb-2">
          Votre compte est actif. Redirection vers la configuration de votre espace commerçant...
        </p>
        <p className="text-[12px] text-[#9C8B82] mb-8">
          Quelques étapes rapides pour configurer votre commerce.
        </p>
        <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-[#FCE7DD] text-[#D73E26] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <KeyRound className="w-8 h-8" />
        </div>
        <h1 className="font-bricolage text-[28px] font-extrabold text-[#0D1117] mb-3">
          Créer votre mot de passe
        </h1>
        <p className="text-[#5D534F] text-[15px]">
          Dernière étape avant d'accéder à votre espace partenaire.
        </p>
      </div>

      {!token ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-[13.5px] font-medium leading-relaxed">
            Lien d'activation introuvable.<br/>
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

          <div>
            <label className="block text-[12px] font-bold text-[#5D534F] mb-1.5 uppercase tracking-wide">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 pr-12 text-[14px] text-gray-900 outline-none focus:border-[#D73E26] focus:ring-2 focus:ring-[#D73E26]/10 transition-all"
                placeholder="8 caractères minimum"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#5D534F] mb-1.5 uppercase tracking-wide">
              Confirmer le mot de passe
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-[14px] text-gray-900 outline-none focus:border-[#D73E26] focus:ring-2 focus:ring-[#D73E26]/10 transition-all"
              placeholder="Répéter le mot de passe"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || password.length < 8}
            className="w-full flex items-center justify-center gap-2 py-4 mt-2 rounded-2xl bg-[#D73E26] hover:bg-[#C0321C] text-white font-bold text-[15px] transition-all shadow-xl shadow-red-900/20 disabled:opacity-60 disabled:cursor-not-allowed"
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
    <div className="min-h-screen bg-[#F5F0EB] flex flex-col font-inter">
      <div className="flex items-center justify-center py-4 bg-white border-b border-[#EDE5DF]">
        <Link href="/" className="flex items-center gap-2">
          <img src="/retenza-icon.png" alt="Retenza" className="h-8 w-8 object-contain" />
          <span className="font-bricolage font-bold text-base text-[#1B100C]">Retenza</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-[440px] w-full bg-white rounded-[32px] p-8 sm:p-10 shadow-xl shadow-red-900/5">
          <Suspense fallback={<div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-[#D73E26] border-t-transparent rounded-full animate-spin" /></div>}>
            <ActivateAccountContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
