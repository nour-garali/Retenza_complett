'use client';

import React, { useState } from 'react';

interface OtpEmailStepProps {
  merchantName: string;
  primaryColor: string;
  onSubmit: (email: string) => Promise<void>;
  isLoading: boolean;
}

export default function OtpEmailStep({ merchantName, primaryColor, onSubmit, isLoading }: OtpEmailStepProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Adresse email invalide.');
      return;
    }
    await onSubmit(email.trim().toLowerCase());
  };

  return (
    <div className="w-full">
      <p className="text-[14px] text-gray-500 mb-6 leading-relaxed">
        Saisissez votre email pour obtenir une carte de fidélité chez{' '}
        <span className="font-semibold text-gray-800">{merchantName}</span>.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="votre@email.com"
            autoComplete="email"
            inputMode="email"
            disabled={isLoading}
            className="w-full px-5 py-4 rounded-xl border border-gray-200 text-[15px] text-gray-900
                       placeholder-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all bg-gray-50/50"
          />
        </div>

        {error && (
          <p className="text-[13px] text-red-500 font-medium">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading || !email.trim()}
          className="w-full py-4 rounded-xl text-[15px] font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]
                     disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md mt-2"
          style={{ backgroundColor: primaryColor }}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Vérification...
            </>
          ) : 'Continuer'}
        </button>
      </form>

      <p className="text-[12px] text-gray-400 text-center mt-5 font-medium flex items-center justify-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Connexion sécurisée par email
      </p>
    </div>
  );
}
