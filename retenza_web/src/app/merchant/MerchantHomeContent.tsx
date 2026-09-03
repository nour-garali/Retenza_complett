'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, getCommerceName } from '@/types/user';
import { Plus, Coins, Users, RefreshCw, AlertTriangle } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Sector
} from 'recharts';

interface MerchantHomeContentProps {
  user: User | null;
  stats: any;
}

type Period = '7j' | '30j' | '12m';

/* ──────────────────────────────────────
   PERIOD LABEL MAP
────────────────────────────────────── */
const PERIOD_LABELS: Record<Period, string> = {
  '7j': '7 derniers jours',
  '30j': '30 derniers jours',
  '12m': '12 derniers mois',
};

/* ──────────────────────────────────────
   DUMMY DATA FOR CHARTS
────────────────────────────────────── */
const sparkDataUp = Array.from({ length: 7 }).map((_, i) => ({ value: 10 + Math.random() * 20 + i * 5 }));
const sparkDataDown = Array.from({ length: 7 }).map((_, i) => ({ value: 40 + Math.random() * 10 - i * 4 }));

const areaData = [
  { name: 'S1', value: 120 },
  { name: 'S2', value: 240 },
  { name: 'S3', value: 370 },
  { name: 'S4', value: 520 },
  { name: 'S5', value: 600 },
];

const donutData = [
  { name: 'VIP', value: 28, color: '#dc2626' },
  { name: 'À risque', value: 12, color: '#F59E0B' },
  { name: 'Régulier', value: 42, color: '#7D9B4E' },
  { name: 'Perdu', value: 18, color: '#9CA3AF' },
];

/* ──────────────────────────────────────
   CUSTOM COMPONENTS
────────────────────────────────────── */
function SparklineArea({ color, data }: { color: string, data: any[] }) {
  return (
    <div style={{ width: 80, height: 36 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`color-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#color-${color.replace('#', '')})`} isAnimationActive={true} animationDuration={600} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] border border-gray-100 text-[13px] animate-in fade-in duration-200">
        <p className="font-semibold text-[#5D534F] mb-1">Semaine : {label}</p>
        <p className="font-bold text-[#dc2626] text-[15px]">{payload[0].value} € additionnels</p>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2.5 rounded-lg shadow-lg border border-gray-100 text-[13px] flex items-center gap-2.5 animate-in fade-in duration-200">
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: payload[0].payload.color }} />
        <p className="font-bold text-[#1B100C]">{payload[0].name}</p>
        <p className="text-[#5D534F] font-semibold">{payload[0].value} %</p>
      </div>
    );
  }
  return null;
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="transition-all duration-300 drop-shadow-md"
      />
    </g>
  );
};


/* ──────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────── */
export default function MerchantHomeContent({ user, stats }: MerchantHomeContentProps) {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('30j');
  const [isChanging, setIsChanging] = useState(false);
  const [activePieIndex, setActivePieIndex] = useState<number | undefined>(undefined);

  const commerceName = getCommerceName((user as any)?.commerce) || user?.firstName || 'Mon Commerce';

  // ─── Stats computed per period ───
  const hasStats = stats && Object.keys(stats).length > 0;

  const demoTotalClients = 1250;
  const demoAtRisk = 150;
  const demoLoyaltyRate = 42;
  const demoTotalRevenue = 3450;
  
  const rawClients   = stats?.clients ?? {};
  const totalClients = hasStats ? (rawClients.total ?? stats?.totalClients ?? 0) : demoTotalClients;
  const atRisk       = hasStats ? (stats?.atRiskClients ?? 0) : demoAtRisk;
  const loyaltyRate  = hasStats ? (stats?.loyaltyRate ?? 0) : demoLoyaltyRate;
  const totalRevenue = hasStats ? (stats?.totalRevenue ?? 0) : demoTotalRevenue;

  const demoNewClientsForPeriod = period === '7j' ? 45 : period === '30j' ? 180 : demoTotalClients;
  const newClientsForPeriod = hasStats ? (
    period === '7j'  ? (rawClients.newLast7Days  ?? stats?.clientsThisWeek ?? 0) :
    period === '30j' ? (rawClients.newLast30Days ?? stats?.clientsThisWeek ?? 0) :
                       (rawClients.total         ?? 0)
  ) : demoNewClientsForPeriod;

  const periodClientTrend = `+${newClientsForPeriod} ce${period === '7j' ? 'tte sem.' : period === '30j' ? ' mois' : 't an'}`;

  const handlePeriodChange = (p: Period) => {
    setIsChanging(true);
    setPeriod(p);
    setTimeout(() => setIsChanging(false), 300);
  };

  /* Stat cards */
  const cards = [
    {
      label: 'CA généré par Retenza',
      value: `${totalRevenue} €`,
      trend: '+14 %',
      trendIsPositive: true,
      icon: <Coins className="w-5 h-5 text-[#dc2626]" strokeWidth={2} />,
      sparkData: sparkDataUp,
    },
    {
      label: 'Clients actifs',
      value: `${totalClients}`,
      trend: periodClientTrend,
      trendIsPositive: true,
      icon: <Users className="w-5 h-5 text-[#dc2626]" strokeWidth={2} />,
      sparkData: sparkDataUp,
    },
    {
      label: 'Taux de retour',
      value: `${loyaltyRate} %`,
      trend: '+6 pts',
      trendIsPositive: true,
      icon: <RefreshCw className="w-5 h-5 text-[#dc2626]" strokeWidth={2} />,
      sparkData: sparkDataUp,
    },
    {
      label: 'Clients à risque',
      value: `${atRisk}`,
      trend: 'à relancer',
      trendIsPositive: false,
      icon: <AlertTriangle className="w-5 h-5 text-[#dc2626]" strokeWidth={2} />,
      sparkData: sparkDataDown,
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
          <p className="text-[13px] text-[#9C8B82] mt-1">
            Vos résultats sur les{' '}
            <span className="text-[#dc2626] font-semibold underline underline-offset-2">
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
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] active:scale-95 text-white text-[13px] font-semibold transition-all shadow-sm ml-1"
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
            className="bg-white rounded-xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow duration-300 relative flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-1">
              <p className="text-[13px] font-semibold text-[#9C8B82] leading-snug pr-6">{c.label}</p>
              <div className="absolute top-5 right-5 opacity-90">
                {c.icon}
              </div>
            </div>
            
            <p className="font-bricolage font-medium text-[32px] text-[#1B100C] leading-none mb-4 tracking-tight mt-1">
              {c.value}
            </p>
            
            <div className="flex items-center justify-between mt-auto">
              <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full border ${
                c.trendIsPositive 
                  ? 'bg-[#EEF3E8] text-[#4d632c] border-[#d8e3cc]' 
                  : 'bg-[#FCE7E7] text-[#992222] border-[#f5cdcd]'
              }`}>
                {c.trend}
              </span>
              <SparklineArea color={c.trendIsPositive ? '#7D9B4E' : '#dc2626'} data={c.sparkData} />
            </div>
          </div>
        ))}
      </div>

      {/* ── BOTTOM: CHART + DONUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Area chart card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="font-bricolage font-bold text-[18px] text-[#1B100C]">CA additionnel généré</h2>
              <p className="text-[13px] text-[#9C8B82] mt-1">Mesuré et traçable — commission 5 à 10 %.</p>
            </div>
            <span className="px-3.5 py-1.5 rounded-full bg-[#EEF3E8] text-[#4d632c] text-[12px] font-bold border border-[#d8e3cc] shrink-0 shadow-sm">
              +30 % de retour
            </span>
          </div>

          <div className="flex-1 mt-6 -mx-2 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9C8B82' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: '#9C8B82' }} axisLine={false} tickLine={false} dx={-10} />
                <RechartsTooltip content={<CustomAreaTooltip />} cursor={{ stroke: 'rgba(220,38,38,0.05)', strokeWidth: 32 }} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#dc2626" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  activeDot={{ r: 6, fill: "#dc2626", stroke: "#fff", strokeWidth: 2 }}
                  dot={{ r: 4, fill: "#dc2626", stroke: "#fff", strokeWidth: 1.5 }}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] flex flex-col relative h-full min-h-[300px]">
          <h2 className="font-bricolage font-bold text-[18px] text-[#1B100C] mb-0.5">Répartition clients</h2>
          <p className="text-[13px] text-[#9C8B82] mb-6">Scoring automatique par l'IA.</p>
          
          <div className="flex-1 flex items-center justify-between gap-2 px-1">
            <div className="relative w-[150px] h-[150px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius="65%"
                    outerRadius="95%"
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActivePieIndex(index)}
                    onMouseLeave={() => setActivePieIndex(undefined)}
                    // @ts-ignore
                    activeIndex={activePieIndex}
                    activeShape={renderActiveShape}
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                    stroke="none"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-bricolage font-bold text-[30px] text-[#1B100C] leading-none mt-1">{totalClients}</span>
                <span className="text-[12px] text-[#9C8B82] font-semibold mt-1">clients</span>
              </div>
            </div>
            
            <div className="flex flex-col justify-center gap-1.5 min-w-[110px]">
              {donutData.map((entry, index) => (
                <div
                  key={entry.name}
                  className={`flex items-center justify-between transition-all duration-200 px-2 py-1.5 rounded-lg cursor-default ${
                    activePieIndex === index ? 'bg-gray-50 scale-105 shadow-sm' : 'bg-transparent'
                  }`}
                  onMouseEnter={() => setActivePieIndex(index)}
                  onMouseLeave={() => setActivePieIndex(undefined)}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className={`text-[13px] transition-colors ${activePieIndex === index ? 'text-[#1B100C] font-semibold' : 'text-[#5D534F]'}`}>
                      {entry.name}
                    </span>
                  </div>
                  <span className={`text-[13.5px] font-bold ml-3 text-right transition-colors ${activePieIndex === index ? 'text-[#1B100C]' : 'text-[#1B100C] opacity-90'}`}>
                    {entry.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
