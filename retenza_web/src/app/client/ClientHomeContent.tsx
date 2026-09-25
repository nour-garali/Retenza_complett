'use client';

import React from 'react';
import Link from 'next/link';
import { User } from '@/types/user';
import { ArrowRight, Star, Gift, CreditCard, Zap, History, Users, TrendingUp, Target, MoreHorizontal } from 'lucide-react';

interface ClientHomeContentProps {
  user: User | null;
  data: any;
}

/* ── Points evolution area chart (pure SVG) ── */
function PointsChart() {
  return (
    <div className="h-[260px]">
      <svg viewBox="0 0 600 200" className="w-full" height="100%" preserveAspectRatio="none">
        <defs>
          <linearGradient id="clientGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D73E26" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#D73E26" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {/* Grid */}
        <defs>
          <pattern id="grid" width="60" height="40" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 40" fill="none" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="2,2"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5" />
        
        <path
          d="M0,170 C50,160 80,150 130,130 C180,110 200,140 250,120 C300,100 340,75 390,55 C440,35 490,25 540,12 C560,7 580,5 600,4 L600,200 L0,200 Z"
          fill="url(#clientGrad)"
        />
        <path
          d="M0,170 C50,160 80,150 130,130 C180,110 200,140 250,120 C300,100 340,75 390,55 C440,35 490,25 540,12 C560,7 580,5 600,4"
          stroke="#D73E26" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* ── Donut — répartition par commerce (pure SVG) ── */
function CommerceDonut({ accounts, total }: { accounts: any[]; total: number }) {
  const r = 54;
  const cx = 66;
  const cy = 66;
  const circ = 2 * Math.PI * r;

  const colors = ['#1E2B4A', '#D73E26', '#94A3B8', '#CBD5E1'];
  const top4   = accounts.slice(0, 4);
  const others = accounts.slice(4);

  const segments = top4.map((acc: any, i: number) => ({
    label: acc.commerce?.name || 'Commerce',
    pct:   total > 0 ? Math.round(((acc.points || 0) / (total || 1)) * 100) : Math.round(100 / accounts.length),
    color: colors[i],
  }));

  if (others.length > 0) {
    const otherPct = 100 - segments.reduce((s, seg) => s + seg.pct, 0);
    if (otherPct > 0) segments.push({ label: 'Autres', pct: otherPct, color: colors[3] });
  }

  // fallback demo if no accounts
  const display = segments.length > 0 ? segments : [
    { label: 'Aucune carte', pct: 100, color: '#E5E7EB' },
  ];

  let cumulative = 0;
  const arcs = display.map((seg, i) => {
    const dash = (seg.pct / 100) * circ;
    const gap  = circ - dash;
    const rotation = (cumulative / 100) * 360 - 90;
    cumulative += seg.pct;
    return (
      <circle key={i} cx={cx} cy={cy} r={r} fill="none"
        stroke={seg.color} strokeWidth="18"
        strokeDasharray={`${dash} ${gap}`}
        style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${cx}px ${cy}px` }}
      />
    );
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative shrink-0 mb-4" style={{ width: 132, height: 132 }}>
        <svg width="132" height="132" viewBox="0 0 132 132">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth="18" />
          {arcs}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-[10px] text-slate-400 font-medium">Total</p>
          <span className="font-bricolage font-bold text-[20px] text-[#1E2B4A] leading-none">{accounts.length}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 w-full">
        {display.map((seg, i) => (
          <div key={seg.label} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-[10px] font-medium text-slate-500 truncate">{seg.label}</span>
            </div>
            <span className="text-[11px] font-bold text-[#1E2B4A]">{seg.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN
════════════════════════════════════════ */
export default function ClientHomeContent({ user, data }: ClientHomeContentProps) {
  // Demo data for design preview when DB is empty
  const demoAccounts = [
    { commerce: { name: 'Café Lumière' }, points: 450, stamps: 3 },
    { commerce: { name: 'Boutique Zénith' }, points: 200, stamps: 1 },
    { commerce: { name: 'Le Fournil' }, points: 80, stamps: 0 },
    { commerce: { name: 'Burger Maison' }, points: 15, stamps: 0 },
  ];

  const demoTransactions = [
    { type: 'earn', commerce: { name: 'Café Lumière' }, amount: 50, programType: 'points', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { type: 'reward', commerce: { name: 'Boutique Zénith' }, amount: 100, programType: 'points', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    { type: 'earn', commerce: { name: 'Le Fournil' }, amount: 20, programType: 'points', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) },
    { type: 'earn', commerce: { name: 'Café Lumière' }, amount: 15, programType: 'points', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72) },
  ];

  const hasRealData = (data?.loyaltyAccounts?.length > 0) || (data?.lastTransactions?.length > 0);
  const accounts = hasRealData ? data.loyaltyAccounts : demoAccounts;
  const transactions = hasRealData ? data.lastTransactions : demoTransactions;

  const totalPoints  = accounts.reduce((s: number, a: any) => s + (a.points || 0), 0);
  const totalStamps  = accounts.reduce((s: number, a: any) => s + (a.stamps || 0), 0);
  const totalCards   = accounts.length;
  const totalRewards = transactions.filter((t: any) => t.type === 'reward').length;
  const newTx        = transactions.length;

  /* Stat cards */
  const cards = [
    {
      label: 'Points cumulés',
      value: `${totalPoints}`,
      unit: 'pts',
      trend: `+${Math.round(totalPoints * 0.14)} ce mois`,
      trendClass: 'text-[#DD2C1F]',
      icon: Target,
      c1: '#F7F4EF',
      c2: '#DD2C1F'
    },
    {
      label: 'Cartes actives',
      value: `${totalCards}`,
      unit: '',
      trend: `${totalCards} commerce${totalCards !== 1 ? 's' : ''}`,
      trendClass: 'text-[#DD2C1F]',
      icon: CreditCard,
      c1: '#F7F4EF',
      c2: '#DD2C1F'
    },
    {
      label: 'Récompenses',
      value: `${totalRewards}`,
      unit: '',
      trend: 'obtenues',
      trendClass: 'text-[#DD2C1F]',
      icon: Gift,
      c1: '#F7F4EF',
      c2: '#DD2C1F'
    },
    {
      label: 'Tampons collectés',
      value: `${totalStamps}`,
      unit: '',
      trend: `${newTx} transactions`,
      trendClass: 'text-[#DD2C1F]',
      icon: Star,
      c1: '#F7F4EF',
      c2: '#DD2C1F'
    },
  ];

  return (
    <div className="space-y-6 py-2">

      {/* ── 4 STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200 group cursor-default">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: c.c1 }}>
                  <c.icon className="w-4 h-4" style={{ color: c.c2 }} />
                </div>
                <p className="text-[12px] font-semibold text-slate-500">{c.label}</p>
              </div>
              <span className="text-[10px] font-bold text-[#DD2C1F] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                +{c.trend.includes('%') ? c.trend : Math.round(parseInt(c.value) * 0.14)}%
              </span>
            </div>
            <p className="font-bricolage font-bold text-[30px] text-[#1E2B4A] leading-none tracking-tight mb-2">
              {c.value}
              {c.unit && <span className="text-[16px] font-medium text-slate-400 ml-1">{c.unit}</span>}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">{c.trend}</p>
          </div>
        ))}
      </div>

      {/* ── BOTTOM: chart + donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Points evolution chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-bricolage text-[17px] font-bold text-[#1E2B4A] tracking-tight">Évolution de vos points</h2>
              <p className="text-[12px] text-slate-400 mt-1">Historique des points cumulés sur les 4 dernières semaines.</p>
            </div>
            <span className="text-[10px] font-bold text-[#DD2C1F] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full shrink-0 ml-2">
              +{Math.round(totalPoints * 0.14)} pts
            </span>
          </div>
          <PointsChart />
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D73E26]" />
              <span className="text-[11px] font-medium text-slate-500">Points cumulés</span>
            </div>
          </div>
        </div>

        {/* Donut — répartition commerces */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bricolage text-[14px] font-bold text-[#1E2B4A]">Mes commerces</h2>
              <p className="text-[12px] text-slate-400 mt-1">Répartition de vos points par enseigne.</p>
            </div>
            <MoreHorizontal className="w-4 h-4 text-slate-400 cursor-pointer" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <CommerceDonut accounts={accounts} total={totalPoints} />
          </div>
        </div>

      </div>

      {/* ── RECENT TRANSACTIONS ── */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <History className="w-4 h-4 text-[#DD2C1F]" />
            </div>
            <h2 className="font-bricolage text-[15px] font-bold text-[#1E2B4A]">Dernières transactions</h2>
          </div>
          <Link href="/client/cartes"
            className="text-[11px] font-semibold text-[#D73E26] flex items-center gap-0.5 hover:underline">
            Voir <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {transactions.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {transactions.slice(0, 5).map((tx: any, i: number) => {
              const isEarn = tx.type === 'earn';
              return (
                <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isEarn ? 'bg-red-50' : 'bg-red-50'
                  }`}>
                    {isEarn
                      ? <Star className="w-5 h-5 text-[#DD2C1F]" />
                      : <Gift className="w-5 h-5 text-[#DD2C1F]" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#1E2B4A] truncate">
                      {tx.commerce?.name || 'Commerce'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {isEarn ? 'Points gagnés' : 'Récompense utilisée'} · {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span className={`text-[14px] font-bold shrink-0 ${isEarn ? 'text-[#DD2C1F]' : 'text-[#DD2C1F]'}`}>
                    {isEarn ? '+' : '-'}{tx.amount} {tx.programType === 'points' ? 'pts' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <CreditCard className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-[13px] text-slate-400">Aucune transaction récente</p>
            <p className="text-[12px] text-slate-400 mt-1">Visitez un commerce pour commencer.</p>
          </div>
        )}
      </div>

    </div>
  );
}
