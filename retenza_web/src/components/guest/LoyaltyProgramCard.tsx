'use client';

import React from 'react';
import type { LoyaltyProgramPublic } from '@/types/guest';

interface Props { program: LoyaltyProgramPublic; primaryColor: string; }

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-[13px] text-gray-500">{label}</span>
      <span className="text-[13px] font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function StampsBar({ program, primaryColor }: { program: LoyaltyProgramPublic; primaryColor: string }) {
  const total = program.totalStamps ?? 10;
  const current = program.currentStamps ?? 0;

  return (
    <div>
      <div className="flex gap-1.5 flex-wrap mb-3">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={
              i < current
                ? { backgroundColor: primaryColor }
                : { backgroundColor: '#F3F4F6' }
            }
          >
            {i < current && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        ))}
      </div>
      <p className="text-[12px] text-gray-400">{current} / {total} tampons collectés</p>
    </div>
  );
}

export default function LoyaltyProgramCard({ program, primaryColor }: Props) {
  const titles = {
    stamps: 'Carte de tampons',
    points: 'Programme de points',
    cashback: 'Cashback',
  };

  return (
    <div 
      className="w-full rounded-[1.5rem] overflow-hidden shadow-2xl relative text-white transform transition-all hover:scale-[1.02] duration-300"
      style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #111827 100%)` }}
    >
      {/* ── Textures et reflets (Glassmorphism / Premium) ── */}
      <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 px-6 py-7 flex flex-col h-full min-h-[220px]">
        
        {/* Header de la carte */}
        <div className="flex justify-between items-start mb-auto">
          <span className="text-[14px] font-medium tracking-wide opacity-90 uppercase flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            {titles[program.type]}
          </span>
          <div className="px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/20 text-white flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Actif
          </div>
        </div>

        {/* Contenu spécifique au type de programme */}
        <div className="mt-8">
          
          {/* STAMPS (Tampons) */}
          {program.type === 'stamps' && (
            <div>
              <div className="flex gap-2 flex-wrap mb-4">
                {Array.from({ length: program.totalStamps ?? 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-inner"
                    style={{ backgroundColor: (i < (program.currentStamps ?? 0)) ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.2)' }}
                  >
                    {i < (program.currentStamps ?? 0) && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="3.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-end justify-between mt-2 border-t border-white/10 pt-4">
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider opacity-60 font-semibold mb-0.5">Progression</span>
                  <span className="text-[14px] font-medium">{(program.currentStamps ?? 0)} / {(program.totalStamps ?? 10)} collectés</span>
                </div>
                {program.reward && (
                  <div className="flex flex-col text-right">
                     <span className="text-[11px] uppercase tracking-wider opacity-60 font-semibold mb-0.5">Cadeau</span>
                     <span className="text-[14px] font-bold drop-shadow-md">{program.reward}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* POINTS */}
          {program.type === 'points' && (
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-5xl md:text-6xl font-bricolage font-black tracking-tighter drop-shadow-lg">0</span>
                <span className="text-[16px] font-medium opacity-80">pts</span>
              </div>
              <div className="flex items-end justify-between mt-6 border-t border-white/10 pt-4">
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider opacity-60 font-semibold mb-0.5">Taux d'accumulation</span>
                  <span className="text-[14px] font-medium">{program.pointsPerEuro ?? 1} pt / € dépensé</span>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
            </div>
          )}

          {/* CASHBACK */}
          {program.type === 'cashback' && (
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-5xl md:text-6xl font-bricolage font-black tracking-tighter drop-shadow-lg">{program.cashbackRate ?? 5}%</span>
              </div>
              <div className="flex items-end justify-between mt-6 border-t border-white/10 pt-4">
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider opacity-60 font-semibold mb-0.5">Avantage client</span>
                  <span className="text-[14px] font-medium">de cashback sur chaque achat</span>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
