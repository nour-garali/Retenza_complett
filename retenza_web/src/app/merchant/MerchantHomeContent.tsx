'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, getCommerceName } from '@/types/user';
import { Plus, Loader2 } from 'lucide-react';

interface MerchantHomeContentProps {
  user: User | null;
  stats: any;
}

type Period = '7j' | '30j' | '12m';

/* ──────────────────────────────────────
   Mini sparkline — pure SVG
────────────────────────────────────── */
function SparkUp({ color }: { color: string }) {
  return (
    <svg width="72" height="28" viewBox="0 0 72 28" fill="none">
      <path
        d="M2,22 C12,20 18,16 28,12 C38,8 48,6 70,4"
        stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"
      />
    </svg>
  );
}
function SparkDown({ color }: { color: string }) {
  return (
    <svg width="72" height="28" viewBox="0 0 72 28" fill="none">
      <path
        d="M2,6 C12,8 22,12 34,16 C46,20 56,22 70,24"
        stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"
      />
    </svg>
  );
}

/* ──────────────────────────────────────
   Area chart — pure SVG (matching image)
────────────────────────────────────── */
function AreaChart() {
  return (
    <svg viewBox="0 0 600 200" className="w-full" height="200" preserveAspectRatio="none">
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D73E26" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#D73E26" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path
        d="M0,155 C40,150 70,160 120,145 C170,130 190,155 240,138 C290,120 320,100 370,80 C420,60 470,42 520,22 C545,12 570,8 600,5 L600,200 L0,200 Z"
        fill="url(#grad)"
      />
      {/* Line */}
      <path
        d="M0,155 C40,150 70,160 120,145 C170,130 190,155 240,138 C290,120 320,100 370,80 C420,60 470,42 520,22 C545,12 570,8 600,5"
        stroke="#D73E26" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

/* ──────────────────────────────────────
   Donut chart — pure SVG
────────────────────────────────────── */
function DonutChart({ total }: { total: number }) {
  const r = 54;
  const cx = 66;
  const cy = 66;
  const circ = 2 * Math.PI * r; // ~339.3

  const segments = [
    { pct: 28, color: '#D73E26' }, // VIP
    { pct: 12, color: '#F59E0B' }, // À risque
    { pct: 42, color: '#7D9B4E' }, // Régulier
    { pct: 18, color: '#9CA3AF' }, // Perdu
  ];

  let cumulative = 0;
  const arcs = segments.map((seg, i) => {
    const dash = (seg.pct / 100) * circ;
    const gap = circ - dash;
    const rotation = (cumulative / 100) * 360 - 90;
    cumulative += seg.pct;
    return (
      <circle
        key={i}
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth="18"
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset="0"
        style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${cx}px ${cy}px` }}
      />
    );
  });

  const legend = [
    { label: 'VIP', pct: 28, color: '#D73E26' },
    { label: 'À risque', pct: 12, color: '#F59E0B' },
    { label: 'Régulier', pct: 42, color: '#7D9B4E' },
    { label: 'Perdu', pct: 18, color: '#9CA3AF' },
  ];

  return (
    <div className="flex items-center gap-5 justify-center">
      {/* Donut */}
      <div className="relative shrink-0" style={{ width: 132, height: 132 }}>
        <svg width="132" height="132" viewBox="0 0 132 132">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth="18" />
          {arcs}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bricolage font-bold text-[22px] text-[#1B100C] leading-none">{total}</span>
          <span className="text-[11px] text-[#9C8B82] font-medium mt-0.5">clients</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {legend.map((l) => (
          <div key={l.label} className="flex items-center gap-3 min-w-[110px]">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: l.color }} />
            <span className="text-[13px] text-[#5D534F] flex-1">{l.label}</span>
            <span className="text-[13px] font-bold text-[#1B100C]">{l.pct} %</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────
   PERIOD LABEL MAP
────────────────────────────────────── */
const PERIOD_LABELS: Record<Period, string> = {
  '7j': '7 derniers jours',
  '30j': '30 derniers jours',
  '12m': '12 derniers mois',
};

/* ──────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────── */
export default function MerchantHomeContent({ user, stats }: MerchantHomeContentProps) {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('30j');
  const [isChanging, setIsChanging] = useState(false);

  const commerceName = getCommerceName((user as any)?.commerce) || user?.firstName || 'Mon Commerce';

  // ─── Stats computed per period ────────────────────────────────────────────
  const hasStats = stats && Object.keys(stats).length > 0;

  // ─── Demo Data if API is empty ───
  const demoTotalClients = 1250;
  const demoAtRisk = 150;
  const demoLoyaltyRate = 42;
  const demoTotalRevenue = 3450;
  
  const rawClients   = stats?.clients ?? {};
  const totalClients = hasStats ? (rawClients.total ?? stats?.totalClients ?? 0) : demoTotalClients;
  const atRisk       = hasStats ? (stats?.atRiskClients ?? 0) : demoAtRisk;
  const loyaltyRate  = hasStats ? (stats?.loyaltyRate ?? 0) : demoLoyaltyRate;
  const totalRevenue = hasStats ? (stats?.totalRevenue ?? 0) : demoTotalRevenue;

  // Period-aware new clients
  const demoNewClientsForPeriod = period === '7j' ? 45 : period === '30j' ? 180 : demoTotalClients;

  const newClientsForPeriod = hasStats ? (
    period === '7j'  ? (rawClients.newLast7Days  ?? stats?.clientsThisWeek ?? 0) :
    period === '30j' ? (rawClients.newLast30Days ?? stats?.clientsThisWeek ?? 0) :
                       (rawClients.total         ?? 0) // 12m → total
  ) : demoNewClientsForPeriod;

  // Visual "trend" text that changes with period
  const periodClientTrend = `+${newClientsForPeriod} ce${period === '7j' ? 'tte sem.' : period === '30j' ? ' mois' : 't an'}`;

  // Simulate brief loading state when switching period (visual feedback)
  const handlePeriodChange = (p: Period) => {
    setIsChanging(true);
    setPeriod(p);
    setTimeout(() => setIsChanging(false), 400);
  };

  /* Stat cards */
  const cards = [
    {
      label: 'CA généré par Retenza',
      value: `${totalRevenue} €`,
      trend: '+14 %',
      trendClass: 'text-[#7D9B4E]',
      arrow: '↑',
      spark: <SparkUp color="#7D9B4E" />,
    },
    {
      label: 'Clients actifs',
      value: `${totalClients}`,
      trend: periodClientTrend,
      trendClass: 'text-[#7D9B4E]',
      arrow: '↑',
      spark: <SparkUp color="#7D9B4E" />,
    },
    {
      label: 'Taux de retour',
      value: `${loyaltyRate} %`,
      trend: '+6 pts',
      trendClass: 'text-[#7D9B4E]',
      arrow: '↑',
      spark: <SparkUp color="#7D9B4E" />,
    },
    {
      label: 'Clients à risque',
      value: `${atRisk}`,
      trend: 'à relancer',
      trendClass: 'text-[#D73E26]',
      arrow: '●',
      spark: <SparkDown color="#D73E26" />,
    },
  ];

  return (
    <div className="space-y-6 py-2">

      {/* ── WELCOME + PERIOD ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-bricolage font-bold text-[24px] text-[#1B100C] leading-snug">
            Bonjour, {commerceName} 👋
          </h1>
          <p className="text-[13px] text-[#9C8B82] mt-0.5">
            Vos résultats sur les{' '}
            <span className="text-[#D73E26] font-semibold underline underline-offset-2">
              {PERIOD_LABELS[period]}
            </span>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(['7j', '30j', '12m'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-4 py-1.5 rounded-xl text-[13px] font-semibold transition-all ${
                period === p
                  ? 'bg-[#1A0F0A] text-white shadow-sm scale-105'
                  : 'bg-white text-[#5D534F] border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => router.push('/merchant/campagnes/nouvelle')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#D73E26] hover:bg-[#C0321C] active:scale-95 text-white text-[13px] font-semibold transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Campagne
          </button>
        </div>
      </div>

      {/* ── 4 STAT CARDS ── */}
      <div className={`grid grid-cols-2 xl:grid-cols-4 gap-4 transition-opacity duration-300 ${isChanging ? 'opacity-40' : 'opacity-100'}`}>
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
          >
            <p className="text-[12px] font-semibold text-[#9C8B82] mb-3 leading-snug">{c.label}</p>
            <p className="font-bricolage font-bold text-[32px] text-[#1B100C] leading-none mb-4">
              {c.value}
            </p>
            <div className="flex items-center justify-between">
              <span className={`text-[12px] font-semibold flex items-center gap-1 ${c.trendClass}`}>
                {c.arrow === '●'
                  ? <span className="w-2 h-2 rounded-full bg-[#D73E26] inline-block" />
                  : <span>{c.arrow}</span>
                }
                {c.trend}
              </span>
              {c.spark}
            </div>
          </div>
        ))}
      </div>

      {/* ── BOTTOM: CHART + DONUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Area chart card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 className="font-bricolage font-bold text-[16px] text-[#1B100C]">CA additionnel généré</h2>
              <p className="text-[12px] text-[#9C8B82] mt-0.5">Mesuré et traçable — commission 5 à 10 %.</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#EEF3E8] text-[#7D9B4E] text-[11px] font-bold border border-[#c9dbb2] shrink-0 ml-2">
              +30 % de retour
            </span>
          </div>

          {/* Chart area */}
          <div className="mt-4 -mx-2">
            <AreaChart />
          </div>

          {/* Chart legend */}
          <div className="flex items-center gap-2 mt-3 ml-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#D73E26] shrink-0" />
            <span className="text-[11px] text-[#9C8B82]">
              CA additionnel hebdo&nbsp;&nbsp;S1 · S2 · S3 · S4
            </span>
          </div>
        </div>

        {/* Donut card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col">
          <h2 className="font-bricolage font-bold text-[16px] text-[#1B100C] mb-0.5">Répartition clients</h2>
          <p className="text-[12px] text-[#9C8B82] mb-6">Scoring automatique par l'IA.</p>
          <div className="flex-1 flex items-center justify-center">
            <DonutChart total={totalClients} />
          </div>
        </div>

      </div>
    </div>
  );
}
