'use client';

import Link from 'next/link';


export default function MerchantNotFound() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-6 text-center">
      {/* Retenza Logo */}
      <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#D73E26] to-[#A82C18] shadow-[0_8px_24px_rgba(215,62,38,0.3)] flex items-center justify-center mb-6">
        <span className="font-bricolage font-bold text-2xl text-white">R</span>
      </div>

      {/* Illustration */}
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
        <svg
          width="44"
          height="44"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h.01M14 17h.01M17 14h.01M20 14h.01M20 17h.01M17 20h.01M20 20h.01" />
        </svg>
      </div>

      <h1 className="font-bricolage font-bold text-2xl text-gray-900 mb-3">
        Commerce introuvable
      </h1>
      <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-2">
        Ce QR Code ne correspond à aucun commerce partenaire Retenza actif.
      </p>
      <p className="text-gray-400 text-xs mb-8">
        Vérifiez que le QR Code est bien lisible, ou contactez le commerçant.
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="https://retenza.app"
          className="w-full h-12 rounded-2xl bg-gradient-to-b from-[#DD442C] to-[#BC2C16] shadow-[0_6px_16px_rgba(215,62,38,0.3)] flex items-center justify-center text-white font-semibold text-sm"
        >
          Découvrir Retenza
        </Link>
        <button
          onClick={() => window.history.back()}
          className="w-full h-12 rounded-2xl border-2 border-gray-200 bg-white text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
        >
          Retour
        </button>
      </div>

      {/* Powered by */}
      <p className="mt-10 text-[11px] text-gray-300 font-medium tracking-wide">
        © {new Date().getFullYear()} Retenza Connect
      </p>
    </div>
  );
}
