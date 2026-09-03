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
    <div className="min-h-screen bg-gradient-to-br from-[#FDF0EC] to-[#F9E2DB] font-inter flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Decorative floating icons */}
      <div className="absolute top-1/4 left-[15%] w-16 h-16 bg-[#F4CDBF]/20 rounded-2xl flex items-center justify-center animate-[float_4s_ease-in-out_infinite] rotate-12">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D73E26" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
      </div>
      <div className="absolute bottom-1/4 right-[15%] w-14 h-14 bg-[#FCE7DD]/20 rounded-full flex items-center justify-center animate-[float_5s_ease-in-out_infinite_reverse] -rotate-12">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D73E26" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
      </div>
      <div className="absolute top-[20%] right-[20%] w-20 h-20 bg-[#F9E2DB]/30 rounded-3xl flex items-center justify-center animate-[float_6s_ease-in-out_infinite] rotate-45">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D73E26" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-30"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
      </div>
      <div className="absolute bottom-[15%] left-[20%] w-12 h-12 bg-[#F4CDBF]/30 rounded-xl flex items-center justify-center animate-[float_4.5s_ease-in-out_infinite_reverse] -rotate-6">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D73E26" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
      </div>
      {/* Concentric rings in corners */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] border-[1px] border-[#D73E26]/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute top-[-50px] right-[-50px] w-[500px] h-[500px] border-[1px] border-[#D73E26]/5 rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] border-[1px] border-[#D73E26]/10 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">

        {/* Logo */}
        <div className="flex items-center justify-center mb-10">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: '#D94030',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(217, 64, 48, 0.25)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
              </svg>
            </div>
            <span style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 800, fontSize: 20, color: '#1C1C2E',
            }}>Retenza</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-black/5 border border-[#F0E9E4] border-l-[4px] border-l-[#BF2112] p-8">

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
                  className="w-full h-[52px] rounded-xl bg-[#BF2112] hover:bg-[#D73E26] text-white font-semibold text-[15px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-[#BF2112]/20 disabled:opacity-60 mt-2"
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
      <div className="min-h-screen bg-gradient-to-br from-[#FDF0EC] to-[#F9E2DB] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D73E26]/30 border-t-[#D73E26] rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
