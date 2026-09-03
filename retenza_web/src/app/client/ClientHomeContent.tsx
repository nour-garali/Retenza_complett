'use client';

import React from 'react';
import Link from 'next/link';
import { User } from '@/types/user';
import { ArrowRight, Star, Gift, CreditCard, Zap, History, ShoppingBag } from 'lucide-react';

interface ClientHomeContentProps {
  user: User | null;
  data: any;
}

/* ── Sparkline up ── */
function SparkUp({ color }: { color: string }) {
  return (
    <svg width="72" height="28" viewBox="0 0 72 28" fill="none">
      <path d="M2,22 C12,20 18,16 28,12 C38,8 48,6 70,4"
        stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ── Sparkline flat/down ── */
function SparkFlat({ color }: { color: string }) {
  return (
    <svg width="72" height="28" viewBox="0 0 72 28" fill="none">
      <path d="M2,14 C15,13 30,15 45,13 C55,12 62,14 70,13"
        stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ── Points evolution area chart (pure SVG) ── */
function PointsChart() {
  return (
    <svg viewBox="0 0 600 200" className="w-full" height="200" preserveAspectRatio="none">
      <defs>
        <linearGradient id="clientGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D73E26" stopOpacity="0.20" />
          <stop offset="100%" stopColor="#D73E26" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path
        d="M0,170 C50,160 80,150 130,130 C180,110 200,140 250,120 C300,100 340,75 390,55 C440,35 490,25 540,12 C560,7 580,5 600,4 L600,200 L0,200 Z"
        fill="url(#clientGrad)"
      />
      <path
        d="M0,170 C50,160 80,150 130,130 C180,110 200,140 250,120 C300,100 340,75 390,55 C440,35 490,25 540,12 C560,7 580,5 600,4"
        stroke="#D73E26" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Donut — répartition par commerce (pure SVG) ── */
function CommerceDonut({ accounts, total }: { accounts: any[]; total: number }) {
  const r = 54;
  const cx = 66;
  const cy = 66;
  const circ = 2 * Math.PI * r;

  const colors = ['#D73E26', '#7D9B4E', '#F59E0B', '#6366F1', '#9CA3AF'];
  const top4   = accounts.slice(0, 4);
  const others = accounts.slice(4);

  const segments = top4.map((acc: any, i: number) => ({
    label: acc.commerce?.name || 'Commerce',
    pct:   total > 0 ? Math.round(((acc.points || 0) / (total || 1)) * 100) : Math.round(100 / accounts.length),
    color: colors[i],
  }));

  if (others.length > 0) {
    const otherPct = 100 - segments.reduce((s, seg) => s + seg.pct, 0);
    if (otherPct > 0) segments.push({ label: 'Autres', pct: otherPct, color: colors[4] });
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
    <div className="flex items-center gap-5 justify-center">
      <div className="relative shrink-0" style={{ width: 132, height: 132 }}>
        <svg width="132" height="132" viewBox="0 0 132 132">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth="18" />
          {arcs}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-bricolage font-bold text-[20px] text-[#1B100C] leading-none">{accounts.length}</span>
          <span className="text-[11px] text-[#9C8B82] font-medium mt-0.5">cartes</span>
        </div>
      </div>
      <div className="space-y-3 flex-1">
        {display.map((seg) => (
          <div key={seg.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-[12px] text-[#5D534F] truncate max-w-[90px]">{seg.label}</span>
            </div>
            <span className="text-[12px] font-bold text-[#1B100C]">{seg.pct} %</span>
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

  const firstName = user?.firstName || 'vous';
  const currentHour = new Date().getHours();
  const greeting    = currentHour < 12 ? 'Bonjour' : currentHour < 18 ? 'Bon après-midi' : 'Bonsoir';

  /* Stat cards */
  const cards = [
    {
      label: 'Points cumulés',
      value: `${totalPoints}`,
      unit: 'pts',
      trend: `+${Math.round(totalPoints * 0.14)} ce mois`,
      trendClass: 'text-[#7D9B4E]',
      arrow: '↑',
      spark: <SparkUp color="#7D9B4E" />,
    },
    {
      label: 'Cartes actives',
      value: `${totalCards}`,
      unit: '',
      trend: `${totalCards} commerce${totalCards !== 1 ? 's' : ''}`,
      trendClass: 'text-teal-600',
      arrow: '↑',
      spark: <SparkUp color="#0D9488" />,
    },
    {
      label: 'Récompenses',
      value: `${totalRewards}`,
      unit: '',
      trend: 'obtenues',
      trendClass: 'text-amber-500',
      arrow: '●',
      spark: <SparkFlat color="#F59E0B" />,
    },
    {
      label: 'Tampons collectés',
      value: `${totalStamps}`,
      unit: '',
      trend: `${newTx} transactions`,
      trendClass: 'text-violet-500',
      arrow: '↑',
      spark: <SparkUp color="#6366F1" />,
    },
  ];

  return (
    <div className="space-y-6 py-2">

      {/* ── WELCOME + CTA ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-bricolage font-bold text-[24px] text-[#1B100C] leading-snug">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-[13px] text-[#9C8B82] mt-0.5">
            Vos <span className="text-[#D73E26] font-semibold underline underline-offset-2">points & récompenses</span> en un coup d'œil.
          </p>
        </div>
        <Link href="/client/explorer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D73E26] hover:bg-[#C0321C] text-white text-[13px] font-semibold transition-all shadow-sm shrink-0">
          <ShoppingBag className="w-3.5 h-3.5" /> Explorer les commerces
        </Link>
      </div>

      {/* ── 4 STAT CARDS ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-[12px] font-semibold text-[#9C8B82] mb-3 leading-snug">{c.label}</p>
            <p className="font-bricolage font-bold text-[32px] text-[#1B100C] leading-none mb-4">
              {c.value}
              {c.unit && <span className="text-[16px] font-medium text-[#9C8B82] ml-1">{c.unit}</span>}
            </p>
            <div className="flex items-center justify-between">
              <span className={`text-[12px] font-semibold flex items-center gap-1 ${c.trendClass}`}>
                {c.arrow === '●'
                  ? <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  : <span>{c.arrow}</span>
                }
                {c.trend}
              </span>
              {c.spark}
            </div>
          </div>
        ))}
      </div>

      {/* ── BOTTOM: chart + donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Points evolution chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="font-bricolage font-bold text-[16px] text-[#1B100C]">Évolution de vos points</h2>
              <p className="text-[12px] text-[#9C8B82] mt-0.5">Historique des points cumulés sur les 4 dernières semaines.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#EEF3E8] text-[#7D9B4E] text-[11px] font-bold border border-[#c9dbb2] shrink-0 ml-2">
              +{Math.round(totalPoints * 0.14)} pts
            </span>
          </div>
          <div className="mt-4 -mx-2">
            <PointsChart />
          </div>
          <div className="flex items-center gap-2 mt-3 ml-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#D73E26] shrink-0" />
            <span className="text-[11px] text-[#9C8B82]">Points cumulés hebdo&nbsp;&nbsp;S1 · S2 · S3 · S4</span>
          </div>
        </div>

        {/* Donut — répartition commerces */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <h2 className="font-bricolage font-bold text-[16px] text-[#1B100C] mb-0.5">Mes commerces</h2>
          <p className="text-[12px] text-[#9C8B82] mb-6">Répartition de vos points par enseigne.</p>
          <div className="flex-1 flex items-center justify-center">
            <CommerceDonut accounts={accounts} total={totalPoints} />
          </div>
        </div>

      </div>

      {/* ── RECENT TRANSACTIONS ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#D73E26]" />
            <h2 className="font-bricolage font-bold text-[15px] text-[#1B100C]">Dernières transactions</h2>
          </div>
          <Link href="/client/cartes"
            className="text-[12px] font-semibold text-[#D73E26] flex items-center gap-1 hover:underline">
            Voir tout <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {transactions.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {transactions.slice(0, 5).map((tx: any, i: number) => {
              const isEarn = tx.type === 'earn';
              return (
                <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isEarn ? 'bg-[#EEF3E8]' : 'bg-[#FCE7DD]'
                  }`}>
                    {isEarn
                      ? <Star className="w-5 h-5 text-[#7D9B4E]" />
                      : <Gift className="w-5 h-5 text-[#D73E26]" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#1B100C] truncate">
                      {tx.commerce?.name || 'Commerce'}
                    </p>
                    <p className="text-[11px] text-[#9C8B82]">
                      {isEarn ? 'Points gagnés' : 'Récompense utilisée'} · {new Date(tx.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span className={`text-[14px] font-bold shrink-0 ${isEarn ? 'text-[#7D9B4E]' : 'text-[#D73E26]'}`}>
                    {isEarn ? '+' : '-'}{tx.amount} {tx.programType === 'points' ? 'pts' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <CreditCard className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-[13px] text-[#9C8B82]">Aucune transaction récente</p>
            <p className="text-[12px] text-[#9C8B82] mt-1">Visitez un commerce pour commencer.</p>
          </div>
        )}
      </div>

    </div>
  );
}
