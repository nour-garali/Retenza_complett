'use client';

import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, Send } from 'lucide-react';
import { forgotPasswordAction } from '@/services/authActions';
import Link from 'next/link';

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

          {!sent ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="w-12 h-12 bg-[#FCE7DD] rounded-2xl flex items-center justify-center mb-5">
                  <Mail className="w-6 h-6 text-[#D73E26]" />
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
                      <Mail className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="w-full bg-[#FCFAFA] border border-gray-200 focus:bg-white focus:border-[#D73E26] focus:ring-4 focus:ring-[#D73E26]/10 outline-none rounded-xl py-3 pl-11 pr-4 text-[14px] font-medium text-gray-900 transition-all placeholder-gray-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full h-[52px] rounded-xl bg-[#111111] hover:bg-black text-white font-semibold text-[15px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-black/10 disabled:opacity-60"
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
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-500" />
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
    </div>
  );
}
