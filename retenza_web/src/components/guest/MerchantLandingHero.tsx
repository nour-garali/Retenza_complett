'use client';

import React from 'react';
import type { MerchantPublicProfile } from '@/types/guest';

export default function MerchantLandingHero({ merchant }: { merchant: MerchantPublicProfile }) {
  const { primaryColor, name, category, logoUrl, loyaltyProgram } = merchant;

  const label = { stamps: 'Tampons', points: 'Points', cashback: 'Cashback' }[loyaltyProgram.type];

  return (
    <div className="pt-14 pb-10 px-6 text-center">
      {/* Logo */}
      <div
        className="w-20 h-20 rounded-[22px] flex items-center justify-center mx-auto mb-5 shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt={name} className="w-12 h-12 object-contain rounded-xl" />
        ) : (
          <span className="text-white font-bricolage font-black text-3xl">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Name */}
      <h1 className="font-bricolage font-bold text-[24px] text-gray-900 leading-tight mb-1">
        {name}
      </h1>

      {/* Category + Program tag */}
      <div className="flex items-center justify-center gap-2 mt-2">
        {category && (
          <span className="text-[12px] text-gray-400 font-medium">{category}</span>
        )}
        {category && <span className="text-gray-200">·</span>}
        <span
          className="text-[12px] font-semibold"
          style={{ color: primaryColor }}
        >
          Programme {label}
        </span>
      </div>
    </div>
  );
}
