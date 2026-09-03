'use client';

import React, { useState, useEffect } from 'react';
import type { WalletProvider, WalletPassResult } from '@/types/guest';
import { generateWalletPass } from '@/services/publicMerchantActions';

interface WalletButtonsProps {
  cardPublicId: string;
  primaryColor: string;
}

type Platform = 'apple' | 'google' | 'both';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'both';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !(ua as string).includes('Android')) return 'apple';
  if (/Android/.test(ua)) return 'google';
  return 'both';
}

interface WalletButtonProps {
  provider: WalletProvider;
  cardPublicId: string;
  primaryColor: string;
}

function GoogleWalletButton({ cardPublicId, primaryColor }: Omit<WalletButtonProps, 'provider'>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateWalletPass({ cardPublicId, provider: 'google' });
      if ('error' in result) {
        setError(result.error);
      } else {
        window.open((result as WalletPassResult).addUrl, '_blank');
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl border-2 border-gray-900 bg-gray-900 text-white font-semibold text-[14px] transition-all duration-200 active:scale-[0.98] disabled:opacity-60 hover:bg-gray-800"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            {/* Google Wallet icon — SVG inline */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Ajouter à Google Wallet
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}

function AppleWalletButton({ cardPublicId }: { cardPublicId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateWalletPass({ cardPublicId, provider: 'apple' });
      if ('error' in result) {
        setError(result.error);
      } else {
        // Safari auto-detects .pkpass and opens Add to Wallet sheet
        window.location.href = (result as WalletPassResult).addUrl;
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-black text-white font-semibold text-[14px] transition-all duration-200 active:scale-[0.98] disabled:opacity-60 hover:bg-gray-900"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            {/* Apple icon */}
            <svg width="18" height="22" viewBox="0 0 18 22" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.94 11.48c-.02-2.07 1.69-3.07 1.77-3.12-0.97-1.41-2.47-1.6-3-1.63-1.28-.13-2.51.75-3.16.75-.65 0-1.64-.74-2.7-.72-1.39.02-2.68.81-3.4 2.05-1.46 2.52-.37 6.27 1.05 8.32.7 1 1.52 2.13 2.61 2.09 1.05-.04 1.44-.67 2.71-.67 1.26 0 1.62.67 2.72.65 1.13-.02 1.84-1.02 2.53-2.03.8-1.16 1.13-2.29 1.15-2.34-.02-.01-2.21-.84-2.28-3.35zM12.83 5.26c.58-.7.97-1.67.86-2.64-.83.03-1.84.55-2.44 1.24-.53.62-1 1.6-.87 2.55.93.07 1.87-.47 2.45-1.15z"/>
            </svg>
            Ajouter à Apple Wallet
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}

export default function WalletButtons({ cardPublicId, primaryColor }: WalletButtonsProps) {
  const [platform, setPlatform] = useState<Platform>('both');

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  return (
    <div className="mx-5 mt-5 flex flex-col gap-3">
      {/* Section label */}
      <div className="flex items-center gap-3 mb-1">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Ajouter à votre Wallet</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {(platform === 'google' || platform === 'both') && (
        <GoogleWalletButton cardPublicId={cardPublicId} primaryColor={primaryColor} />
      )}
      {(platform === 'apple' || platform === 'both') && (
        <AppleWalletButton cardPublicId={cardPublicId} />
      )}

      {/* Desktop hint */}
      {platform === 'both' && (
        <p className="text-center text-[11px] text-gray-400 mt-1">
          📱 Scannez cette page depuis votre téléphone pour une meilleure expérience Wallet.
        </p>
      )}
    </div>
  );
}
