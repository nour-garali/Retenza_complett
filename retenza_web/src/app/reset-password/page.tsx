'use client';

import { useState, useEffect, Suspense } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { resetPasswordAction } from '@/services/authActions';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMsg('Lien invalide ou expiré. Veuillez refaire une demande.');
    }
  }, [token]);

  // Validation force du mot de passe
  const strength = (() => {
    if (!newPassword) return 0;
    let s = 0;
    if (newPassword.length >= 8) s++;
    if (/[A-Z]/.test(newPassword)) s++;
    if (/[0-9]/.test(newPassword)) s++;
    if (/[^A-Za-z0-9]/.test(newPassword)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Faible', 'Moyen', 'Fort', 'Très fort'][strength];
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-blue-500', 'bg-green-500'][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    const res = await resetPasswordAction(token, newPassword);
    setIsLoading(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } else {
      setErrorMsg(res.message || 'Lien invalide ou expiré. Veuillez refaire une demande.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF8F6] font-inter flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Background décor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D73E26]/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#D73E26]/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">

        {/* Logo + back */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/login"
            className="flex items-center gap-2 text-[13px] font-semibold text-[#5D534F] hover:text-[#D73E26] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </Link>
          <Link href="/">
            <img src="/retenza-icon.png" alt="Retenza" className="h-8 w-8 object-contain" />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-black/5 border border-[#F0E9E4] p-8">

          {!success ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="w-12 h-12 bg-[#FCE7DD] rounded-2xl flex items-center justify-center mb-5">
                  <Lock className="w-6 h-6 text-[#D73E26]" />
                </div>
                <h1 className="font-bricolage text-[24px] font-extrabold text-[#0D1117] mb-2">
                  Nouveau mot de passe
                </h1>
                <p className="text-[#9C8B82] text-[14px] leading-relaxed">
                  Choisissez un mot de passe sécurisé d'au moins 8 caractères.
                </p>
              </div>

              {/* Error */}
              {errorMsg && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-red-700 font-semibold">{errorMsg}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Nouveau mot de passe */}
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-[#1B100C] uppercase tracking-wide opacity-80">
                    Nouveau mot de passe *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={8}
                      style={{ letterSpacing: showPassword || !newPassword ? 'normal' : '2px' }}
                      className="w-full bg-[#FCFAFA] border border-gray-200 focus:bg-white focus:border-[#D73E26] focus:ring-4 focus:ring-[#D73E26]/10 outline-none rounded-xl py-3 pl-11 pr-11 text-[14px] font-medium text-gray-900 transition-all placeholder-gray-400"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center outline-none text-gray-400 hover:text-[#D73E26] transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Indicateur de force */}
                  {newPassword && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-gray-200'}`} />
                        ))}
                      </div>
                      <p className={`text-[11px] font-semibold ${
                        strength <= 1 ? 'text-red-500' : strength === 2 ? 'text-orange-500' : strength === 3 ? 'text-blue-500' : 'text-green-500'
                      }`}>{strengthLabel}</p>
                    </div>
                  )}
                </div>

                {/* Confirmer */}
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-[#1B100C] uppercase tracking-wide opacity-80">
                    Confirmer le mot de passe *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ letterSpacing: showPassword || !confirmPassword ? 'normal' : '2px' }}
                      className={`w-full bg-[#FCFAFA] border focus:bg-white outline-none rounded-xl py-3 pl-11 pr-4 text-[14px] font-medium text-gray-900 transition-all placeholder-gray-400 focus:ring-4 ${
                        confirmPassword && confirmPassword !== newPassword
                          ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                          : confirmPassword && confirmPassword === newPassword
                          ? 'border-green-400 focus:border-green-400 focus:ring-green-100'
                          : 'border-gray-200 focus:border-[#D73E26] focus:ring-[#D73E26]/10'
                      }`}
                    />
                    {confirmPassword && confirmPassword === newPassword && (
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !token}
                  className="w-full h-[52px] rounded-xl bg-[#111111] hover:bg-black text-white font-semibold text-[15px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-black/10 disabled:opacity-60 mt-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Enregistrer le nouveau mot de passe'
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Succès */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="font-bricolage text-[22px] font-extrabold text-[#0D1117] mb-3">
                Mot de passe mis à jour !
              </h2>
              <p className="text-[#9C8B82] text-[14px] leading-relaxed mb-2">
                Votre mot de passe a été réinitialisé avec succès.
              </p>
              <p className="text-[12px] text-[#B0A29A]">
                Redirection vers la connexion dans quelques secondes...
              </p>
              <Link href="/login"
                className="inline-flex items-center gap-2 mt-8 text-[13px] font-bold text-[#D73E26] hover:underline">
                <ArrowLeft className="w-4 h-4" /> Se connecter maintenant
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FBF8F6] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D73E26]/30 border-t-[#D73E26] rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
