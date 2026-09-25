'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users, Zap, TrendingUp, Store, Search,
  MoreHorizontal, ArrowUpRight, ChevronDown, ChevronRight,
  Activity, ShieldCheck, Target, BarChart2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

interface AdminHomeContentProps { stats: any; commerces: any[] }

/* ── Animated counter ─────────────────────── */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    let s = 0;
    const t = setInterval(() => {
      s += to / 60;
      if (s >= to) { setV(to); clearInterval(t); return; }
      setV(Math.floor(s));
    }, 16);
    return () => clearInterval(t);
  }, [to]);
  return <>{v.toLocaleString('fr-FR')}{suffix}</>;
}

/* ── Custom tooltip ───────────────────────── */
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1E2B4A] text-white rounded-xl px-4 py-3 shadow-2xl text-[11px] font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}</span>
          <span className="text-white font-bold ml-auto pl-4">{p.value.toLocaleString('fr-FR')}</span>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════ */
export default function AdminHomeContent({ stats, commerces }: AdminHomeContentProps) {

  // États pour les onglets principaux
  const [activeMainTab, setActiveMainTab] = useState<'dashboard' | 'partners'>('dashboard');

  /* Values */
  const totalClients    = stats?.users?.clients                     ?? 102890;
  const totalScans      = stats?.activity?.totalQrScans             ?? 56562;
  const totalLoyalty    = stats?.activity?.totalLoyaltyTransactions ?? 2543;
  const retention       = stats?.activity?.retentionRate            ?? 78.4;
  const retentionTrend  = stats?.activity?.retentionTrend           ?? 2.3;
  const activeMerchants = stats?.commerces?.active                  ?? 42;
  const pendingReq      = stats?.partnershipRequests?.pending        ?? 124;
  const approvedReq     = stats?.partnershipRequests?.approved       ?? 342;
  const rejectedReq     = stats?.partnershipRequests?.rejected       ?? 45;
  const totalReq        = stats?.partnershipRequests?.total         ?? 511;
  const monthlyGoal     = stats?.goals?.monthlyAcquisitionGoal      ?? 50;
  const thisMonth       = stats?.goals?.partnersAcquiredThisMonth   ?? 32;
  const goalPct         = monthlyGoal > 0 ? Math.min((thisMonth / monthlyGoal) * 100, 100) : 0;

  const [topTab, setTopTab] = React.useState<'scans' | 'clients' | 'activity'>('scans');
  const [chartPeriod, setChartPeriod] = React.useState('Annuel');

  const topData = {
    scans:    [{ n: 'Café Lumière', e: 'contact@cafelumiere.com', v: 824 }, { n: 'Boutique Zénith', e: 'hello@zenith.com', v: 653 }, { n: 'Le Fournil', e: 'boulangerie@fournil.fr', v: 512 }, { n: 'Salle Fit+', e: 'admin@fitplus.com', v: 345 }, { n: "L'Océan", e: 'resa@locean.com', v: 289 }],
    clients:  [{ n: 'Boutique Zénith', e: 'hello@zenith.com', v: 126 }, { n: 'Café Lumière', e: 'contact@cafelumiere.com', v: 98 }, { n: 'Salle Fit+', e: 'admin@fitplus.com', v: 87 }, { n: 'Spa Détente', e: 'contact@spadetente.com', v: 65 }, { n: 'Le Fournil', e: 'boulangerie@fournil.fr', v: 54 }],
    activity: [{ n: 'Café Lumière', e: 'contact@cafelumiere.com', v: 1250 }, { n: 'Boutique Zénith', e: 'hello@zenith.com', v: 1054 }, { n: 'Le Fournil', e: 'boulangerie@fournil.fr', v: 890 }, { n: 'Salle Fit+', e: 'admin@fitplus.com', v: 720 }, { n: "L'Océan", e: 'resa@locean.com', v: 540 }],
  };
  const topList = topData[topTab];

  /* Chart data */
  const areaData = [
    { m: 'Jan', scans: 4200, clients: 2400 }, { m: 'Fév', scans: 3800, clients: 3200 },
    { m: 'Mar', scans: 5200, clients: 4800 }, { m: 'Avr', scans: 4800, clients: 3900 },
    { m: 'Mai', scans: 5800, clients: 5200 }, { m: 'Jun', scans: 7200, clients: 5800 },
    { m: 'Jul', scans: 6800, clients: 4300 }, { m: 'Aoû', scans: 8400, clients: 6600 },
    { m: 'Sep', scans: 6200, clients: 4900 }, { m: 'Oct', scans: 7600, clients: 5600 },
    { m: 'Nov', scans: 9200, clients: 7200 }, { m: 'Déc', scans: 10800, clients: 8800 },
  ];

  const barData = [
    { d: 'L', v: 30 }, { d: 'M', v: 55 }, { d: 'M', v: 40 },
    { d: 'J', v: 65 }, { d: 'V', v: 48 }, { d: 'S', v: 72 }, { d: 'D', v: 58 },
  ];

  const cActive = stats?.commerces?.active ?? 254;
  const cPend   = stats?.commerces?.pending ?? 38;
  const cSusp   = stats?.commerces?.suspended ?? 7;
  const cInact  = 12;
  const cTotal  = cActive + cPend + cSusp + cInact;

  const pieData = [
    { name: 'Actifs', value: cActive, color: '#1E2B4A' },
    { name: 'En attente', value: cPend, color: '#D73E26' },
    { name: 'Inactifs', value: cInact, color: '#CBD5E1' },
    { name: 'Suspendus', value: cSusp, color: '#94A3B8' },
  ];

  const tableRows = [
    { n: 'Café Lumière', cat: 'Restauration', loc: 'Paris', date: '15 Sep 2023', scans: '4 289', on: true },
    { n: 'Boutique Zénith', cat: 'Commerce', loc: 'Lyon', date: '12 Oct 2023', scans: '2 670', on: true },
    { n: 'Salle Fit+', cat: 'Sport', loc: 'Marseille', date: '10 Sep 2023', scans: '6 347', on: true },
    { n: 'Spa Détente', cat: 'Bien-être', loc: 'Bordeaux', date: '14 Avr 2023', scans: '3 894', on: false },
    { n: 'Le Fournil', cat: 'Boulangerie', loc: 'Lille', date: '25 Fév 2023', scans: '2 893', on: true },
  ];

  /* ══════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════ */
  return (
    <div className="font-inter">

      {/* ─── ONGLETS PRINCIPAUX ─────────────────────── */}
      <div className="mb-6">
        <div className="flex gap-6 border-b border-slate-200 pb-0">
          <button
            onClick={() => setActiveMainTab('dashboard')}
            className={`flex items-center gap-2 pb-3.5 text-[14px] font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeMainTab === 'dashboard'
                ? 'border-[#DD2C1F] text-[#DD2C1F]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <BarChart2 className="w-4 h-4 shrink-0" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveMainTab('partners')}
            className={`flex items-center gap-2 pb-3.5 text-[14px] font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeMainTab === 'partners'
                ? 'border-[#DD2C1F] text-[#DD2C1F]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Store className="w-4 h-4 shrink-0" />
            Historique des partenaires
          </button>
        </div>
      </div>

      {/* ─── CONTENU DASHBOARD ─────────────────────── */}
      {activeMainTab === 'dashboard' && (
        <div className="space-y-6">

          {/* ═══ ROW 1 — 4 KPI CARDS + GOAL ════════════ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">

          {/* KPI 1 */}
          {[
            { label: 'Total clients', value: totalClients, trend: '+12.8%', sub: `+${(totalClients * 0.1).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ce mois`, icon: Users, c1: '#F7F4EF', c2: '#DD2C1F' },
            { label: 'Scans QR', value: totalScans, trend: '+2.4%', sub: '-124 vs mois dernier', icon: Zap, c1: '#F1F5F9', c2: '#64748B' },
            { label: 'Rétention', value: Math.round(retention), suffix: '%', trend: `+${retentionTrend.toFixed(1)}%`, sub: `+${retentionTrend.toFixed(1)}% vs mois dernier`, icon: TrendingUp, c1: '#F7F4EF', c2: '#DD2C1F' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200 group cursor-default">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: kpi.c1 }}>
                    <kpi.icon className="w-4 h-4" style={{ color: kpi.c2 }} />
                  </div>
                  <p className="text-[12px] font-semibold text-slate-500">{kpi.label}</p>
                </div>
                <span className="text-[10px] font-bold text-[#DD2C1F] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                  {kpi.trend}
                </span>
              </div>
              <p className="font-bricolage text-[30px] font-bold text-[#1E2B4A] leading-none tracking-tight mb-2">
                <Counter to={kpi.value} suffix={kpi.suffix} />
              </p>
              <p className="text-[11px] text-slate-400 font-medium">{kpi.sub}</p>
            </div>
          ))}

          {/* KPI 4 — Partenaires */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200 cursor-default">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                  <Store className="w-4 h-4 text-[#DD2C1F]" />
                </div>
                <p className="text-[12px] font-semibold text-slate-500">Partenaires actifs</p>
              </div>
              <span className="text-[10px] font-bold text-[#DD2C1F] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">+19%</span>
            </div>
            <p className="font-bricolage text-[30px] font-bold text-[#1E2B4A] leading-none tracking-tight mb-2">
              <Counter to={activeMerchants} />
            </p>
            <p className="text-[11px] text-slate-400 font-medium">+{Math.round(activeMerchants * 0.19)} ce mois-ci</p>
          </div>

          {/* Objectif card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200 group cursor-default">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                  <Target className="w-4 h-4 text-[#DD2C1F]" />
                </div>
                <p className="text-[12px] font-semibold text-slate-500">Objectif mensuel</p>
              </div>
              <span className="text-[10px] font-bold text-[#DD2C1F] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                +{Math.round((thisMonth / monthlyGoal) * 100)}%
              </span>
            </div>
            <p className="font-bricolage text-[30px] font-bold text-[#1E2B4A] leading-none tracking-tight mb-2">
              {thisMonth}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">sur {monthlyGoal} partenaires ce mois</p>
            <Link href="/admin/parametres" className="no-underline flex items-center gap-1 mt-4 text-[11px] font-semibold text-slate-400 hover:text-[#DD2C1F] transition-colors w-fit">
              Modifier <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* ═══ ROW 2 — CHART + RIGHT PANEL ════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">

          {/* Activity Chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-bricolage text-[17px] font-bold text-[#1E2B4A] tracking-tight">Résumé d'activité</h2>
                <p className="text-[12px] text-slate-400 mt-1">Scans QR & nouveaux clients — 12 mois</p>
              </div>
              <button className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                {chartPeriod} <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gClients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E2B4A" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1E2B4A" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D73E26" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#D73E26" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#F1F5F9" strokeDasharray="0" />
                  <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Inter' }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Inter' }} />
                  <Tooltip content={<ChartTip />} cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="clients" name="Clients" stroke="#1E2B4A" strokeWidth={2.5} fill="url(#gClients)" dot={false} activeDot={{ r: 5, fill: '#1E2B4A', strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="scans" name="Scans" stroke="#D73E26" strokeWidth={2.5} fill="url(#gScans)" dot={false} activeDot={{ r: 5, fill: '#D73E26', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100">
              {[{ c: '#1E2B4A', l: 'Nouveaux clients' }, { c: '#D73E26', l: 'Scans QR' }].map(x => (
                <div key={x.l} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: x.c }} />
                  <span className="text-[11px] font-medium text-slate-500">{x.l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Donut + Requests stacked */}
          <div className="flex flex-col gap-4">

            {/* Donut */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bricolage text-[14px] font-bold text-[#1E2B4A]">Statut des partenaires</h3>
                <MoreHorizontal className="w-4 h-4 text-slate-400 cursor-pointer" />
              </div>
              <div className="relative h-[130px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={56} paddingAngle={3} dataKey="value" stroke="none">
                      {pieData.map((x, i) => <Cell key={i} fill={x.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] text-slate-400 font-medium">Total</p>
                  <p className="font-bricolage text-[20px] font-bold text-[#1E2B4A]">{cTotal}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {pieData.map((x, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: x.color }} />
                      <span className="text-[10px] font-medium text-slate-500">{x.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#1E2B4A]">{x.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requests mini */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bricolage text-[14px] font-bold text-[#1E2B4A]">Demandes partenariat</h3>
                <Link href="/admin/partenaires" className="no-underline text-[11px] font-semibold text-[#D73E26] hover:underline flex items-center gap-0.5">
                  Voir <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <p className="font-bricolage text-[38px] font-bold text-[#1E2B4A] leading-none mb-4">{totalReq}</p>
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-4">
                <div className="h-full rounded-full" style={{ width: `${(approvedReq / totalReq) * 100}%`, background: '#1E2B4A' }} />
                <div className="h-full rounded-full" style={{ width: `${(pendingReq / totalReq) * 100}%`, background: '#D73E26' }} />
                <div className="h-full rounded-full" style={{ width: `${(rejectedReq / totalReq) * 100}%`, background: '#CBD5E1' }} />
              </div>
              <div className="space-y-2">
                {[
                  { l: 'Approuvées', v: approvedReq, c: '#1E2B4A' },
                  { l: 'En attente', v: pendingReq,  c: '#D73E26' },
                  { l: 'Refusées',   v: rejectedReq, c: '#94A3B8' },
                ].map(x => (
                  <div key={x.l} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: x.c }} />
                      <span className="text-[12px] font-medium text-slate-500">{x.l}</span>
                    </div>
                    <span className="text-[13px] font-bold" style={{ color: x.c }}>{x.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ ROW 3 — TOP + BAR + EXPENSES ══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Top partenaires */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bricolage text-[15px] font-bold text-[#1E2B4A]">Top Partenaires</h3>
              <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-0.5 gap-0.5">
                {(['scans', 'clients', 'activity'] as const).map(s => (
                  <button key={s} onClick={() => setTopTab(s)}
                    className={`text-[10px] px-2.5 py-1 rounded-md font-semibold transition-all border ${topTab === s ? 'bg-white text-[#1E2B4A] shadow-sm border-slate-200' : 'text-slate-400 border-transparent hover:text-slate-600'}`}>
                    {s === 'scans' ? 'Scans' : s === 'clients' ? 'Clients' : 'Activité'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              {topList.map((r, i) => (
                <div key={i}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group cursor-default">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-300 w-4 text-right">{i + 1}</span>
                    <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      {r.n.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-[#1E2B4A] group-hover:text-[#D73E26] transition-colors leading-tight">{r.n}</p>
                      <p className="text-[10px] text-slate-400">{r.e}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bricolage text-[13px] font-bold text-[#1E2B4A]">{r.v.toLocaleString('fr-FR')}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wide">{topTab === 'scans' ? 'scans' : topTab === 'clients' ? 'clients' : 'actions'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scans par jour (bar) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bricolage text-[15px] font-bold text-[#1E2B4A]">Scans par jour</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Cette semaine</p>
              </div>
              <MoreHorizontal className="w-4 h-4 text-slate-400 cursor-pointer" />
            </div>
            <div className="flex items-end gap-1 mb-4">
              <span className="font-bricolage text-[30px] font-bold text-[#1E2B4A] leading-none">
                +{Math.round(activeMerchants * 0.3).toLocaleString('fr-FR')}
              </span>
              <span className="text-[11px] font-bold text-emerald-500 mb-1 ml-1 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />+30.00%
              </span>
            </div>
            <div className="flex-1 min-h-[130px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'Inter' }} />
                  <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'Inter' }} />
                  <Bar dataKey="v" name="Scans" radius={[5, 5, 3, 3]} barSize={24}>
                    {barData.map((_, i) => (
                      <Cell key={i} fill={i === 3 ? '#1E2B4A' : i === 5 ? '#D73E26' : '#E2E8F0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">Total cette semaine</span>
              <span className="text-[13px] font-bold text-[#1E2B4A]">{barData.reduce((a, b) => a + b.v, 0)} scans</span>
            </div>
          </div>

          {/* Résumé indicateurs */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex flex-col">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-bricolage text-[15px] font-bold text-[#1E2B4A]">Résumé des indicateurs</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <button className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">Mars <ChevronDown className="w-3 h-3" /></button>
                </div>
              </div>
              <MoreHorizontal className="w-4 h-4 text-slate-400 cursor-pointer" />
            </div>

            {/* Big donut */}
            <div className="relative h-[120px] mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ v: Math.round(retention) }, { v: 100 - Math.round(retention) }]}
                    cx="50%" cy="100%" startAngle={180} endAngle={0}
                    innerRadius={55} outerRadius={72} dataKey="v" stroke="none"
                  >
                    <Cell fill="#1E2B4A" />
                    <Cell fill="#F1F5F9" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                <p className="font-bricolage text-[22px] font-bold text-[#1E2B4A] leading-none">{Math.round(retention)}%</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Rétention totale</p>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              {[
                { l: 'Transactions fidélité', v: totalLoyalty.toLocaleString('fr-FR'), color: '#1E2B4A', pct: 68 },
                { l: 'Scans totaux', v: totalScans.toLocaleString('fr-FR'), color: '#D73E26', pct: 84 },
                { l: 'Partenaires actifs', v: String(activeMerchants), color: '#94A3B8', pct: 52 },
              ].map(x => (
                <div key={x.l}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-slate-500">{x.l}</span>
                    <span className="font-bricolage text-[13px] font-bold text-[#1E2B4A]">{x.v}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${x.pct}%`, background: x.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        </div>
      )}

      {/* ─── CONTENU HISTORIQUE DES PARTENAIRES ─────────────────────── */}
      {activeMainTab === 'partners' && (
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div>
              <h2 className="font-bricolage text-[17px] font-bold text-[#1E2B4A] tracking-tight">Historique des partenaires</h2>
              <p className="text-[12px] text-slate-400 mt-1">{activeMerchants} partenaires enregistrés</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input placeholder="Rechercher…"
                  className="h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-700 placeholder-slate-400 outline-none focus:border-[#D73E26]/30 focus:ring-2 focus:ring-[#D73E26]/10 transition-all w-44 font-inter" />
              </div>
              <Link href="/admin/partenaires"
                className="no-underline h-9 px-4 flex items-center gap-2 bg-[#1E2B4A] text-white text-[12px] font-semibold rounded-xl hover:bg-[#162038] transition-colors shadow-md shadow-slate-900/15">
                <Store className="w-3.5 h-3.5" />
                Voir tout
              </Link>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Nom', 'Catégorie', 'Localisation', 'Date', 'Scans', 'Statut'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tableRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors group cursor-default">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-500">
                          {r.n.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[13px] font-semibold text-[#1E2B4A] group-hover:text-[#D73E26] transition-colors">{r.n}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">{r.cat}</span>
                    </td>
                    <td className="px-6 py-4 text-[12px] font-medium text-slate-500">{r.loc}</td>
                    <td className="px-6 py-4 text-[11px] text-slate-400">{r.date}</td>
                    <td className="px-6 py-4">
                      <span className="font-bricolage text-[14px] font-bold text-[#1E2B4A]">{r.scans}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-full border ${r.on ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${r.on ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {r.on ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">Affichage de <strong className="text-slate-600">5</strong> sur <strong className="text-slate-600">{activeMerchants}</strong> partenaires</span>
            <div className="flex items-center gap-1.5">
              {['Préc.', '1', '2', '3', 'Suiv.'].map((p, i) => (
                <button key={i} className={`h-8 px-3 text-[11px] font-semibold rounded-lg border transition-all ${i === 1 ? 'bg-[#1E2B4A] text-white border-[#1E2B4A] shadow-md shadow-slate-900/20' : 'text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
