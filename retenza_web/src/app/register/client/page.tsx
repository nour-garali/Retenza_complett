'use client';

import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, User, CheckCircle2, Sparkles, Phone } from 'lucide-react';
import { registerClientAction } from '@/services/authActions';
import Link from 'next/link';

export default function RegisterClientScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    const res = await registerClientAction({ firstName, lastName, email, phone, password });

    if (res.success) {
      setSuccessMsg('Compte créé avec succès ! Redirection...');
      window.location.href = '/client';
    } else {
      setErrorMsg(res.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-inter relative overflow-hidden flex flex-col">

      {/* ── BACKGROUND — same as login ── */}
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
          <Link href="/login"
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-[#1B100C] font-semibold text-[13px] hover:bg-gray-50 transition-colors shadow-sm bg-white hidden sm:block">
            Se connecter
          </Link>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center justify-between px-8 md:px-12 lg:px-20 py-8 lg:py-10 z-10 gap-16 lg:gap-8">

        {/* ── LEFT — Branding (same style as login) ── */}
        <div className="w-full lg:w-[45%] flex flex-col pt-4">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FCE7DD] text-[#D73E26] rounded-full text-[11px] font-bold tracking-wider w-fit mb-8">
            <Sparkles className="w-3.5 h-3.5" /> ESPACE CLIENT
          </div>

          <h1 className="font-bricolage text-[42px] md:text-[52px] lg:text-[58px] font-bold leading-[1.05] text-[#1B100C] tracking-tight mb-6">
            Rejoignez<br />la communauté<br />
            <span className="text-[#D73E26]">Retenza.</span>
          </h1>

          <p className="text-[#5D534F] text-[15px] leading-relaxed mb-12 max-w-sm">
            Accumulez des points, profitez d'offres exclusives et restez connecté à vos commerçants favoris.
          </p>

          <div className="space-y-6">
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-2xl bg-[#FCE7DD] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#D73E26]" />
              </div>
              <div>
                <h3 className="text-[#1B100C] font-semibold text-[14px]">Carte de fidélité dans votre poche</h3>
                <p className="text-[#9C8B82] text-[12px]">Partout, tout le temps, sans papier.</p>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-2xl bg-[#FCE7DD] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#D73E26]" />
              </div>
              <div>
                <h3 className="text-[#1B100C] font-semibold text-[14px]">Offres & récompenses exclusives</h3>
                <p className="text-[#9C8B82] text-[12px]">Des avantages réservés aux membres Retenza.</p>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-2xl bg-[#FCE7DD] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#D73E26]" />
              </div>
              <div>
                <h3 className="text-[#1B100C] font-semibold text-[14px]">Inscription gratuite & instantanée</h3>
                <p className="text-[#9C8B82] text-[12px]">Prêt en moins de 2 minutes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT — Form Card (same style as login) ── */}
        <div className="w-full lg:w-[55%] flex justify-end">
          <div className="w-full max-w-[520px] bg-white rounded-[32px] p-8 md:p-10 shadow-[0_20px_80px_-15px_rgba(0,0,0,0.08)] border border-gray-100 relative">

            {/* Card header */}
            <div className="flex flex-col items-center mb-8 text-center">
              <div className="w-13 h-13 bg-[#FCE7DD] rounded-2xl flex items-center justify-center mb-4 p-3">
                <User className="w-6 h-6 text-[#D73E26]" />
              </div>
              <h2 className="font-bricolage text-[26px] font-bold text-[#1B100C] mb-1.5">Créer mon compte</h2>
              <p className="text-[#9C8B82] text-[14px]">Gratuit, rapide et sans engagement.</p>
            </div>

            {/* Alerts */}
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-[13px] rounded-xl flex items-start gap-3">
                <span className="mt-0.5">⚠️</span>
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 text-[13px] rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="font-medium">{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleRegister} className="space-y-4">

              {/* Prénom & Nom */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-[#1B100C] ml-1 uppercase tracking-wide opacity-80">Prénom *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text" required value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Votre prénom"
                      className="w-full bg-[#FCFAFA] border border-gray-200 focus:bg-white focus:border-[#D73E26] focus:ring-4 focus:ring-[#D73E26]/10 outline-none rounded-xl py-3 pl-11 pr-4 text-[14px] font-medium text-gray-900 transition-all placeholder-gray-400"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-[#1B100C] ml-1 uppercase tracking-wide opacity-80">Nom *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text" required value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Votre nom"
                      className="w-full bg-[#FCFAFA] border border-gray-200 focus:bg-white focus:border-[#D73E26] focus:ring-4 focus:ring-[#D73E26]/10 outline-none rounded-xl py-3 pl-11 pr-4 text-[14px] font-medium text-gray-900 transition-all placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#1B100C] ml-1 uppercase tracking-wide opacity-80">Adresse e-mail *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="w-full bg-[#FCFAFA] border border-gray-200 focus:bg-white focus:border-[#D73E26] focus:ring-4 focus:ring-[#D73E26]/10 outline-none rounded-xl py-3 pl-11 pr-4 text-[14px] font-medium text-gray-900 transition-all placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div className="space-y-2">
                <label className="text-[12px] font-bold text-[#1B100C] ml-1 uppercase tracking-wide opacity-80">Téléphone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="tel" value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+216 12 345 678"
                    className="w-full bg-[#FCFAFA] border border-gray-200 focus:bg-white focus:border-[#D73E26] focus:ring-4 focus:ring-[#D73E26]/10 outline-none rounded-xl py-3 pl-11 pr-4 text-[14px] font-medium text-gray-900 transition-all placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Mots de passe */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-[#1B100C] ml-1 uppercase tracking-wide opacity-80">Mot de passe *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'} required value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ letterSpacing: showPassword || !password ? 'normal' : '2px' }}
                      className="w-full bg-[#FCFAFA] border border-gray-200 focus:bg-white focus:border-[#D73E26] focus:ring-4 focus:ring-[#D73E26]/10 outline-none rounded-xl py-3 pl-11 pr-11 text-[14px] font-medium text-gray-900 transition-all placeholder-gray-400"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center outline-none text-gray-400 hover:text-[#D73E26] transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-[#1B100C] ml-1 uppercase tracking-wide opacity-80">Confirmer *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'} required value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ letterSpacing: showPassword || !confirmPassword ? 'normal' : '2px' }}
                      className="w-full bg-[#FCFAFA] border border-gray-200 focus:bg-white focus:border-[#D73E26] focus:ring-4 focus:ring-[#D73E26]/10 outline-none rounded-xl py-3 pl-11 pr-11 text-[14px] font-medium text-gray-900 transition-all placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Terms */}
              <p className="text-[12px] text-[#9C8B82] leading-relaxed px-1">
                En créant votre compte, vous acceptez nos{' '}
                <a href="#" className="text-[#D73E26] font-semibold hover:underline">Conditions d'utilisation</a>{' '}
                et notre{' '}
                <a href="#" className="text-[#D73E26] font-semibold hover:underline">Politique de confidentialité</a>.
              </p>

              {/* CTA */}
              <div className="pt-2">
                <button type="submit" disabled={isLoading}
                  className="w-full h-[54px] rounded-xl bg-[#111111] hover:bg-black text-white font-semibold text-[15px] transition-all active:scale-[0.98] flex items-center justify-center shadow-xl shadow-black/10 disabled:opacity-70 gap-2">
                  {isLoading ? (
                    <div className="w-[20px] h-[20px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Créer mon compte <ArrowRight className="w-4 h-4 ml-1" /></>
                  )}
                </button>
              </div>

              {/* Login link */}
              <div className="text-center pt-1">
                <p className="text-[13px] font-medium text-gray-500">
                  Vous avez déjà un compte ?{' '}
                  <Link href="/login" className="text-[#D73E26] font-bold hover:underline">Se connecter</Link>
                </p>
              </div>

              {/* Merchant link */}
              <div className="text-center border-t border-gray-100 pt-4 mt-2">
                <p className="text-[12px] text-[#9C8B82]">
                  Vous êtes commerçant ?{' '}
                  <Link href="/register/merchant" className="text-[#1B100C] font-bold hover:underline">
                    Créer un espace pro →
                  </Link>
                </p>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
