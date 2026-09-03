'use client';

import React, { useState } from 'react';
import type { MerchantPublicProfile } from '@/types/guest';
import { sendOtpForCard, verifyOtpCode, finalizeGuestCard, checkEmailRegistration } from '@/services/publicMerchantActions';
import MerchantLandingHero from '@/components/guest/MerchantLandingHero';
import LoyaltyProgramCard from '@/components/guest/LoyaltyProgramCard';
import OtpEmailStep from '@/components/guest/OtpEmailStep';
import OtpVerifyStep from '@/components/guest/OtpVerifyStep';
import WalletButtons from '@/components/guest/WalletButtons';
import RetenzaBranding from '@/components/guest/RetenzaBranding';

interface MerchantLandingClientProps {
  merchant: MerchantPublicProfile;
  merchantCode: string;
}

type Step = 'email' | 'verify' | 'success' | 'already_registered';

interface OtpState {
  email: string;
  verifiedToken: string;
  expiresInMinutes: number;
}

export default function MerchantLandingClient({ merchant, merchantCode }: MerchantLandingClientProps) {
  const [step, setStep] = useState<Step>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [otpState, setOtpState] = useState<OtpState>({ email: '', verifiedToken: '', expiresInMinutes: 10 });
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [walletUrl, setWalletUrl] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | undefined>();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const primaryColor = merchant.primaryColor || '#D73E26';

  // ── Étape 1 : Envoi de l'OTP ────────────────────────────────────────────
  const handleSendOtp = async (email: string) => {
    setIsLoading(true);
    setGlobalError(null);

    const check = await checkEmailRegistration(email, merchantCode);
    if (check.registered) {
      setOtpState((prev) => ({ ...prev, email }));
      setIsLoading(false);
      setStep('already_registered');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const result = await sendOtpForCard(email, merchantCode);
    setIsLoading(false);
    if (!result.success) {
      setGlobalError(result.message);
      return;
    }
    setOtpState((prev) => ({ ...prev, email, expiresInMinutes: result.expiresInMinutes || 10 }));
    setStep('verify');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Étape 2 : Vérification du code OTP & Finalisation ─────────────────
  const handleVerifyOtp = async (code: string) => {
    setIsLoading(true);
    setOtpError(undefined);
    
    const verifyResult = await verifyOtpCode(otpState.email, code, 'guest_card');
    if (!verifyResult.success || !verifyResult.verifiedToken) {
      setOtpError(verifyResult.message);
      setIsLoading(false);
      return;
    }
    setOtpState((prev) => ({ ...prev, verifiedToken: verifyResult.verifiedToken! }));

    const finalizeResult = await finalizeGuestCard(verifyResult.verifiedToken);
    setIsLoading(false);
    
    if (!finalizeResult.success) {
      setGlobalError(finalizeResult.message || 'Erreur lors de la création.');
      return;
    }

    setWalletUrl(finalizeResult.walletUrl || null);

    if (finalizeResult.isNewCard === false) {
      setStep('already_registered');
    } else {
      setStep('success');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans selection:bg-gray-200 pb-20">
      
      {/* ── PHOTO DE COUVERTURE ── */}
      <div className="relative w-full h-[35vh] min-h-[300px] max-h-[400px] overflow-hidden">
        <img 
          src="/assets/images/loyalty_lifestyle_1.png" 
          alt="Couverture" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F4F5F7] via-transparent to-black/30" />
        <div className="absolute inset-0 opacity-[0.15] mix-blend-color" style={{ backgroundColor: primaryColor }} />
        
        {/* Header Global */}
        <div className="absolute top-6 left-6 md:top-8 md:left-10 flex items-center gap-3 z-20">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-lg tracking-tighter">R</span>
          </div>
          <span className="font-bricolage font-bold text-xl text-white tracking-tight drop-shadow-md">Retenza</span>
        </div>
      </div>

      {/* ── CONTENEUR PRINCIPAL (Style "Profil / App") ── */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 -mt-24 md:-mt-32 relative z-10">
        
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100 p-6 sm:p-10 md:p-12 relative">
          
          {/* En-tête du Commerçant (Logo façon Photo de Profil) */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-end border-b border-gray-100 pb-8 mb-10">
            
            {/* Logo qui chevauche la photo de couverture */}
            <div className="relative -mt-24 md:-mt-32 shrink-0">
              <div className="w-28 h-28 md:w-36 md:h-36 bg-white rounded-[2rem] p-2 shadow-xl border border-gray-50">
                <div className="w-full h-full rounded-[1.5rem] flex items-center justify-center shadow-inner" style={{ backgroundColor: primaryColor }}>
                  <span className="text-white font-black text-4xl md:text-5xl tracking-tighter">
                    {merchant.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold uppercase tracking-wider">
                  {merchant.category}
                </span>
                <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Programme Actif
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bricolage font-black text-gray-900 mt-2">
                {merchant.name}
              </h1>
              <p className="text-gray-500 mt-2 text-lg">
                Rejoignez notre programme de fidélité et profitez de récompenses exclusives.
              </p>
            </div>
          </div>

          {/* Contenu Principal (Grille 2 colonnes) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            
            {/* Colonne Gauche : La Carte */}
            <div className="flex flex-col">
              <h2 className="text-xl font-bricolage font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                Votre Carte Virtuelle
              </h2>
              
              <div className="bg-gray-50/50 rounded-[2rem] p-4 sm:p-6 border border-gray-100 flex-1 flex items-center justify-center">
                <div className="w-full max-w-[360px] transform transition-transform hover:scale-[1.02] duration-300">
                  <LoyaltyProgramCard program={merchant.loyaltyProgram} primaryColor={primaryColor} />
                </div>
              </div>
            </div>

            {/* Colonne Droite : L'Action (Formulaire) */}
            <div className="flex flex-col">
              <h2 className="text-xl font-bricolage font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Obtenir ma carte
              </h2>
              
              <div className="bg-white rounded-[2rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-gray-100 p-6 sm:p-8 flex-1 flex flex-col justify-center relative overflow-hidden">
                {/* Effet décoratif discret */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full -mr-16 -mt-16 pointer-events-none" />

                {globalError && (
                  <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-2xl flex gap-3 items-start relative z-10">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p className="text-[14px] text-red-600 font-semibold leading-snug">{globalError}</p>
                  </div>
                )}

                <div className="relative z-10 w-full max-w-md mx-auto">
                  {step === 'email' && (
                    <div className="animate-in fade-in duration-500">
                      <OtpEmailStep merchantName={merchant.name} primaryColor={primaryColor} onSubmit={handleSendOtp} isLoading={isLoading} />
                    </div>
                  )}

                  {step === 'verify' && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                      <OtpVerifyStep email={otpState.email} primaryColor={primaryColor} expiresInMinutes={otpState.expiresInMinutes} onVerify={handleVerifyOtp} onResend={() => handleSendOtp(otpState.email)} isLoading={isLoading} error={otpError} />
                      <div className="mt-6 text-center">
                        <button onClick={() => { setStep('email'); setOtpError(undefined); }} className="text-[14px] font-medium text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1.5 mx-auto">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                          Utiliser une autre adresse
                        </button>
                      </div>
                    </div>
                  )}

                  {(step === 'success' || step === 'already_registered') && (
                    <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center text-center py-4">
                      <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-md bg-white border border-gray-100 mb-6" style={{ color: primaryColor }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          {step === 'success' ? (
                            <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>
                          ) : (
                            <><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>
                          )}
                        </svg>
                      </div>
                      
                      <h2 className="text-[22px] font-bricolage font-bold text-gray-900 mb-3">
                        {step === 'success' ? 'Carte prête ! 🎉' : 'Vous êtes déjà inscrit !'}
                      </h2>
                      <p className="text-[15px] text-gray-500 mb-8 leading-relaxed">
                        {step === 'success' 
                          ? 'Votre carte de fidélité a été créée avec succès. Ajoutez-la à votre portefeuille.' 
                          : `Vous possédez déjà une carte chez ${merchant.name}. Connectez-vous pour voir votre solde.`}
                      </p>

                      <div className="w-full space-y-3">
                        {walletUrl && (
                          <a href={walletUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl font-bold text-[15px] text-white transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-md" style={{ backgroundColor: primaryColor }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                            Ajouter à Google Wallet
                          </a>
                        )}

                        <a href={step === 'success' ? '/api/logout-redirect?to=/register/client' : '/api/logout-redirect?to=/login'} className="flex items-center justify-center w-full py-3.5 rounded-xl border-2 border-gray-200 text-[15px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors active:scale-[0.98]">
                          Accéder à mon espace client
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
