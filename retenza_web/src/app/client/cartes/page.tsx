import React from 'react';
import { getClientBalances } from '@/services/clientDashboardActions';
import { CreditCard, Star, Gift, Zap } from 'lucide-react';

/* ── Mock cards for design preview ── */
const mockCards = [
  {
    commerce: { name: 'Boulangerie Paul', category: 'Boulangerie & Pâtisserie' },
    points: 340,
    stamps: 7,
    maxStamps: 10,
    initials: 'BP',
  },
  {
    commerce: { name: 'Café de la Gare', category: 'Restauration' },
    points: 1280,
    stamps: 0,
    maxStamps: 0,
    initials: 'CG',
  },
  {
    commerce: { name: 'Librairie Antoine', category: 'Culture & Livres' },
    points: 95,
    stamps: 3,
    maxStamps: 8,
    initials: 'LA',
  },
  {
    commerce: { name: 'Supermarché Monoprix', category: 'Alimentation Générale' },
    points: 2750,
    stamps: 0,
    maxStamps: 0,
    initials: 'SM',
  },
  {
    commerce: { name: 'Pharmacie Centrale', category: 'Santé & Bien-être' },
    points: 560,
    stamps: 5,
    maxStamps: 6,
    initials: 'PC',
  },
  {
    commerce: { name: 'Boutique Mode & Co', category: 'Mode & Vêtements' },
    points: 4100,
    stamps: 0,
    maxStamps: 0,
    initials: 'MC',
  },
];

function StampGrid({ stamps, maxStamps }: { stamps: number; maxStamps: number }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {Array.from({ length: maxStamps }).map((_, i) => (
        <div
          key={i}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            i < stamps
              ? 'border-[#D73E26] bg-[#D73E26]'
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          {i < stamps && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      ))}
    </div>
  );
}

function LoyaltyCard({ card, isDemo = false }: { card: any; isDemo?: boolean }) {
  const commerce = card.commerce || {};
  const points = card.points || 0;
  const stamps = card.stamps || 0;
  const maxStamps = card.maxStamps || 0;
  const initials = card.initials || (commerce.name?.slice(0, 2).toUpperCase() || 'RC');

  return (
    <div className="group relative cursor-pointer">
      {/* Card itself */}
      <div className="relative bg-white border border-[#EDE5DF] rounded-3xl p-6 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 min-h-[200px] flex flex-col justify-between">
        
        {/* Top row: logo + brand name */}
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-[#FCE7DD] flex items-center justify-center font-bricolage font-bold text-[#D73E26] text-[13px]">
                {initials}
              </div>
              <div>
                <p className="font-bold text-[#1B100C] text-[15px] leading-tight">{commerce.name || 'Commerce'}</p>
                <p className="text-[#9C8B82] text-[11px]">{commerce.category || 'Fidélité'}</p>
              </div>
            </div>
          </div>
          {/* Retenza branding watermark */}
          <div className="flex items-center gap-1 opacity-40">
            <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
              <span className="text-gray-500 font-bold text-[9px]">R</span>
            </div>
            <span className="text-gray-400 text-[10px] font-semibold">retenza</span>
          </div>
        </div>

        {/* Bottom: stats */}
        <div className="relative z-10 mt-6">
          {maxStamps > 0 ? (
            /* Stamp-based card */
            <div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="font-bricolage font-bold text-[#D73E26] text-[34px] leading-none">{stamps}</span>
                <span className="text-[#9C8B82] text-[14px] font-medium">/ {maxStamps} tampons</span>
              </div>
              <StampGrid stamps={stamps} maxStamps={maxStamps} />
            </div>
          ) : (
            /* Points-based card */
            <div>
              <p className="text-[#9C8B82] text-[11px] uppercase tracking-wider mb-0.5">Points cumulés</p>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bricolage font-bold text-[#D73E26] text-[38px] leading-none">{points.toLocaleString('fr-FR')}</span>
                <span className="text-[#D73E26]/70 text-[16px] font-semibold">pts</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info strip below the card */}
      <div className="mt-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {maxStamps > 0 ? (
            <div className="flex items-center gap-1.5 text-[12px] text-[#9C8B82]">
              <Star className="w-3.5 h-3.5 text-[#D73E26]" />
              <span>{points} pts · {stamps}/{maxStamps} tampons</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[12px] text-[#9C8B82]">
              <Zap className="w-3.5 h-3.5 text-[#D73E26]" />
              <span>Programme à points</span>
            </div>
          )}
        </div>
        <div className="text-[11px] font-semibold px-2.5 py-1 rounded-full text-[#D73E26] bg-[#FCE7DD]">
          Active
        </div>
      </div>
    </div>
  );
}

export default async function ClientCartesPage() {
  const fetchedBalances = await getClientBalances() || [];
  
  // Combine real cards with mock cards so the user can see the design preview
  const cards = [...fetchedBalances, ...mockCards];
  const isDemo = true; // Always show the demo badge for the preview

  return (
    <div className="py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-[#D73E26]" />
          </div>
          <div>
            <h1 className="text-[22px] font-bricolage font-bold text-[#1B100C] leading-tight">Mes Cartes</h1>
            <p className="text-[12px] text-gray-400">{cards.length} carte{cards.length > 1 ? 's' : ''} active{cards.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        {isDemo && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-amber-600">Aperçu design</span>
          </div>
        )}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cards.map((card: any, idx: number) => (
          <LoyaltyCard key={idx} card={card} isDemo={isDemo} />
        ))}
      </div>

      {/* Empty state CTA (only if real data and empty) */}
      {!isDemo && cards.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center justify-center mb-5">
            <Gift className="w-9 h-9 text-gray-300" />
          </div>
          <h3 className="text-[18px] font-bricolage font-bold text-[#1B100C] mb-2">Aucune carte active</h3>
          <p className="text-[14px] text-gray-500 max-w-xs leading-relaxed">
            Visitez un commerçant partenaire pour obtenir votre première carte de fidélité.
          </p>
        </div>
      )}
    </div>
  );
}
