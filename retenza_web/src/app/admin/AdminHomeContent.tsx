'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShieldCheck, Store, Bell, Gift, ArrowUp, Zap, Clock, Users, ChevronRight, 
  CheckCircle2, Search, Moon, Grid, LayoutDashboard, Settings, User, 
  ArrowDown, MoreHorizontal, ArrowRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import NotificationBell from './components/NotificationBell';

interface AdminHomeContentProps {
  stats: any;
  commerces: any[];
}

export default function AdminHomeContent({ stats, commerces }: AdminHomeContentProps) {
  const activeMerchants = stats?.commerces?.active || 42;
  const pendingRequests = stats?.partnershipRequests?.pending || 124;
  const approvedRequests = stats?.partnershipRequests?.approved || 342;
  const rejectedRequests = stats?.partnershipRequests?.rejected || 45;
  const totalRequests = stats?.partnershipRequests?.total || 511;
  const totalClients = stats?.users?.clients || 102890;
  const totalScans = stats?.activity?.totalQrScans || 56562;
  const totalLoyalty = stats?.activity?.totalLoyaltyTransactions || 2543;
  const retentionRate = stats?.activity?.retentionRate || 0;
  const retentionTrend = stats?.activity?.retentionTrend || 0;
  
  const [topSortBy, setTopSortBy] = React.useState<'scans' | 'clients' | 'activity'>('scans');
  
  const mockScans = [
    { name: 'Café Lumière', email: 'contact@cafelumiere.com', count: 824 },
    { name: 'Boutique Zénith', email: 'hello@zenith.com', count: 653 },
    { name: 'Le Fournil de Paris', email: 'boulangerie@fournil.fr', count: 512 },
    { name: 'Salle de Sport Fit+', email: 'admin@fitplus.com', count: 345 },
    { name: 'Restaurant l\'Océan', email: 'resa@locean.com', count: 289 }
  ];

  const mockClients = [
    { name: 'Boutique Zénith', email: 'hello@zenith.com', count: 126 },
    { name: 'Café Lumière', email: 'contact@cafelumiere.com', count: 98 },
    { name: 'Salle de Sport Fit+', email: 'admin@fitplus.com', count: 87 },
    { name: 'Spa Détente', email: 'contact@spadetente.com', count: 65 },
    { name: 'Le Fournil de Paris', email: 'boulangerie@fournil.fr', count: 54 }
  ];

  const mockActivity = [
    { name: 'Café Lumière', email: 'contact@cafelumiere.com', count: 1250 },
    { name: 'Boutique Zénith', email: 'hello@zenith.com', count: 1054 },
    { name: 'Le Fournil de Paris', email: 'boulangerie@fournil.fr', count: 890 },
    { name: 'Salle de Sport Fit+', email: 'admin@fitplus.com', count: 720 },
    { name: 'Restaurant l\'Océan', email: 'resa@locean.com', count: 540 }
  ];

  const topByScans = stats?.commerces?.topByScans?.length > 0 ? stats.commerces.topByScans : mockScans;
  const topByClients = stats?.commerces?.topByClients?.length > 0 ? stats.commerces.topByClients : mockClients;
  const topByActivity = stats?.commerces?.topByActivity?.length > 0 ? stats.commerces.topByActivity : mockActivity;
  
  const topList = topSortBy === 'scans' ? topByScans 
                : topSortBy === 'clients' ? topByClients 
                : topByActivity;

  const topColors = [
    'bg-orange-100 text-orange-600',
    'bg-red-100 text-[#D73E26]',
    'bg-blue-100 text-blue-600',
    'bg-[#EEF3E8] text-[#7D9B4E]',
    'bg-purple-100 text-purple-600'
  ];

  const monthlyGoal = stats?.goals?.monthlyAcquisitionGoal || 50;
  const partnersAcquiredThisMonth = stats?.goals?.partnersAcquiredThisMonth || 0;
  
  // Prevent division by zero and cap at 100% for the visual circle if needed, 
  // but let's show the real percentage.
  const rawPercentage = monthlyGoal > 0 ? (partnersAcquiredThisMonth / monthlyGoal) * 100 : 0;
  const displayPercentage = Math.round(rawPercentage);
  
  // Calculate stroke dasharray for the circle (circumference = 2 * pi * r)
  // Let's use a simple CSS conic-gradient for the circle instead of border-t to make it accurate.

  const primaryColor = '#D73E26'; // Retenza Red
  const secondaryColor = '#E8902A'; // Orange/Yellow accent
  const lightBg = '#F8F9FA'; // Nexora light gray bg

  // Mock Data for charts
  const areaData = [
    { name: 'Jan', scans: 400, clients: 240, profit: 100 },
    { name: 'Feb', scans: 300, clients: 139, profit: 200 },
    { name: 'Mar', scans: 200, clients: 980, profit: 150 },
    { name: 'Apr', scans: 278, clients: 390, profit: 300 },
    { name: 'May', scans: 189, clients: 480, profit: 250 },
    { name: 'Jun', scans: 239, clients: 380, profit: 400 },
    { name: 'Jul', scans: 349, clients: 430, profit: 350 },
    { name: 'Aug', scans: 450, clients: 600, profit: 500 },
    { name: 'Sep', scans: 300, clients: 400, profit: 300 },
    { name: 'Oct', scans: 400, clients: 500, profit: 450 },
    { name: 'Nov', scans: 550, clients: 700, profit: 600 },
    { name: 'Dec', scans: 600, clients: 800, profit: 700 },
  ];

  const commerceActive = stats?.commerces?.active || 254;
  const commercePending = stats?.commerces?.pending || 38;
  const commerceInactive = stats?.commerces?.total - (stats?.commerces?.active || 0) - (stats?.commerces?.pending || 0) - (stats?.commerces?.suspended || 0) || 12;
  const commerceSuspended = stats?.commerces?.suspended || 7;
  const commerceTotal = stats?.commerces?.total || (commerceActive + commercePending + commerceInactive + commerceSuspended);

  const pieData = [
    { name: 'Actifs', value: commerceActive },
    { name: 'En attente', value: commercePending },
    { name: 'Inactifs', value: commerceInactive },
    { name: 'Suspendus', value: commerceSuspended },
  ];
  const PIE_COLORS = ['#7D9B4E', '#f97316', '#9ca3af', '#D73E26'];

  const barData = [
    { name: 'S', uv: 20 }, { name: 'M', uv: 40 }, { name: 'T', uv: 30 }, 
    { name: 'W', uv: 50 }, { name: 'T', uv: 45 }, { name: 'F', uv: 70 }, { name: 'S', uv: 60 }
  ];

  return (
    <div className="bg-[#F8F9FA] min-h-screen text-[#1E293B] font-sans pb-10">
      
      {/* ── TOP NAV HEADER (Nexora Style) ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Image src="/logo.png" alt="Retenza Logo" width={120} height={36} className="h-9 w-auto object-contain" priority />
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="bg-gray-50 border-none rounded-md pl-9 pr-4 py-1.5 text-[12px] w-64 focus:ring-1 focus:ring-gray-200 outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5 cursor-pointer">
            <span className="text-[12px] font-medium text-gray-600">FR</span>
          </div>
          <Moon className="w-4 h-4 text-gray-500 cursor-pointer" />
          <NotificationBell />
          <div className="flex items-center gap-2 cursor-pointer border-l border-gray-100 pl-4">
            <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden">
               {/* Avatar placeholder */}
            </div>
            <div className="hidden sm:block">
              <p className="text-[12px] font-bold text-gray-800 leading-tight">Admin Retenza</p>
              <p className="text-[10px] text-gray-500">Super Admin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 mt-6 space-y-5">
        
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome back, Admin 👋</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Track your platform activity, merchants and scans here.</p>
        </div>

        {/* ── ROW 1: TARGET + KPIs + DONUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Target Card */}
          <div className="col-span-1 lg:col-span-3 bg-gradient-to-br from-[#D73E26] to-[#A82C18] rounded-xl p-5 text-white shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute right-0 top-0 opacity-10">
               <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z"/></svg>
            </div>
            <div className="relative z-10">
              <h3 className="text-[15px] font-semibold mb-1">Objectif Mensuel</h3>
              <p className="text-[11px] text-white/80 leading-relaxed mb-4">
                Vous avez atteint {displayPercentage}% de l'objectif d'acquisition ({partnersAcquiredThisMonth}/{monthlyGoal}) ce mois-ci.
              </p>
              
              <div className="flex items-center gap-4 mb-4">
                 <div 
                   className="w-14 h-14 rounded-full flex items-center justify-center relative"
                   style={{
                     background: `conic-gradient(white ${Math.min(displayPercentage, 100)}%, rgba(255,255,255,0.2) 0)`
                   }}
                 >
                   <div className="w-12 h-12 bg-[#D73E26] rounded-full flex items-center justify-center">
                     <span className="text-[12px] font-bold">{displayPercentage}%</span>
                   </div>
                 </div>
              </div>
            </div>
            
            <Link href="/admin/parametres" className="relative z-10 text-[11px] font-medium hover:underline text-left w-fit flex items-center gap-1">
              Modifier l'objectif <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* 4 KPIs Grid */}
          <div className="col-span-1 lg:col-span-6 grid grid-cols-2 gap-5">
            {/* KPI 1 */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#D73E26]" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold bg-[#EEF3E8] text-[#7D9B4E] px-1.5 py-0.5 rounded">+40%</span>
                  <p className="text-[9px] text-gray-400 mt-1">this month</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] font-medium text-gray-500">Total Clients</p>
                <p className="text-2xl font-bold text-gray-800">{totalClients.toLocaleString()}</p>
              </div>
              <p className="text-[10px] text-[#D73E26] font-medium mt-2 cursor-pointer hover:underline">View All &rarr;</p>
            </div>
            
            {/* KPI 2 */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-8 h-8 rounded bg-orange-50 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-orange-500" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold bg-[#EEF3E8] text-[#7D9B4E] px-1.5 py-0.5 rounded">+25%</span>
                  <p className="text-[9px] text-gray-400 mt-1">this month</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] font-medium text-gray-500">Total Scans QR</p>
                <p className="text-2xl font-bold text-gray-800">{totalScans.toLocaleString()}</p>
              </div>
              <p className="text-[10px] text-orange-500 font-medium mt-2 cursor-pointer hover:underline">View All &rarr;</p>
            </div>

            {/* KPI 3 */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="w-8 h-8 rounded bg-red-50 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-[#D73E26]" />
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${retentionTrend >= 0 ? 'text-[#7D9B4E] bg-[#EEF3E8]' : 'text-red-500 bg-red-50'}`}>
                    {retentionTrend > 0 ? '+' : ''}{retentionTrend.toFixed(1)}%
                  </span>
                  <p className="text-[9px] text-gray-400 mt-1">this month</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] font-medium text-gray-500">Taux de Rétention</p>
                <p className="text-2xl font-bold text-gray-800">{retentionRate.toFixed(2)}%</p>
              </div>
              {/* Mini sparkline CSS */}
              <svg className="absolute bottom-2 right-2 w-16 h-8 opacity-40" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path d="M0,25 L20,15 L40,20 L60,10 L80,25 L100,5" fill="none" stroke="#D73E26" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>

            {/* KPI 4 */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="w-8 h-8 rounded bg-orange-50 flex items-center justify-center">
                  <Store className="w-4 h-4 text-orange-500" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold bg-[#EEF3E8] text-[#7D9B4E] px-1.5 py-0.5 rounded">+19%</span>
                  <p className="text-[9px] text-gray-400 mt-1">this month</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-[11px] font-medium text-gray-500">Total Partenaires</p>
                <p className="text-2xl font-bold text-gray-800">{activeMerchants.toLocaleString()}</p>
              </div>
              <svg className="absolute bottom-2 right-2 w-16 h-8 opacity-40" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path d="M0,20 L20,25 L40,10 L60,15 L80,5 L100,10" fill="none" stroke="#E8902A" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* Leads by Source Donut */}
          <div className="col-span-1 lg:col-span-3 bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-bold text-gray-800 border-l-2 border-[#D73E26] pl-2">Statut des commerçants</h3>
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </div>
            
            <div className="flex-1 relative min-h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[10px] text-gray-500">Total</p>
                <p className="text-[16px] font-bold text-gray-800">{commerceTotal}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-2 border-t border-gray-50 pt-3">
              {pieData.map((item, i) => (
                <div key={i} className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }}></span>
                    <span className="text-[9px] text-gray-400 truncate">{item.name}</span>
                  </div>
                  <p className="text-[11px] font-bold text-gray-700">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── ROW 2: TOP DEALS + AREA CHART + BARS/TIMELINE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Top Deals & Profit Bar */}
          <div className="col-span-1 lg:col-span-3 flex flex-col gap-5">
            {/* Top Deals */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-bold text-gray-800 border-l-2 border-[#D73E26] pl-2">Top Partenaires</h3>
                <div className="flex bg-gray-50 rounded-md p-0.5">
                  <button onClick={() => setTopSortBy('scans')} className={`text-[9px] px-2 py-1 rounded-sm ${topSortBy === 'scans' ? 'bg-white shadow-sm font-bold text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>Scans</button>
                  <button onClick={() => setTopSortBy('clients')} className={`text-[9px] px-2 py-1 rounded-sm ${topSortBy === 'clients' ? 'bg-white shadow-sm font-bold text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>Clients</button>
                  <button onClick={() => setTopSortBy('activity')} className={`text-[9px] px-2 py-1 rounded-sm ${topSortBy === 'activity' ? 'bg-white shadow-sm font-bold text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>Activité</button>
                </div>
              </div>
              <div className="space-y-3">
                {topList.length === 0 && <p className="text-[11px] text-gray-400 text-center py-4">Aucune donnée disponible.</p>}
                {topList.map((deal: any, i: number) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${topColors[i % topColors.length]}`}>
                        {deal.name ? deal.name.substring(0, 2).toUpperCase() : 'CO'}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-gray-800 group-hover:text-[#D73E26] transition-colors">{deal.name || 'Commerce Inconnu'}</p>
                        <p className="text-[9px] text-gray-400">{deal.email || 'Email non fourni'}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-gray-700">
                      {deal.count?.toLocaleString() || 0} {topSortBy === 'scans' ? 'scans' : topSortBy === 'clients' ? 'clients' : 'interactions'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Profit Earned Bar Chart */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-bold text-gray-800 border-l-2 border-[#D73E26] pl-2">Scans par Jour</h3>
                <span className="text-[10px] text-gray-400">View All &rarr;</span>
              </div>
              <div className="h-[90px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#9CA3AF' }} dy={5} />
                    <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ fontSize: '10px', borderRadius: '4px', padding: '4px' }} />
                    <Bar dataKey="uv" fill="#E8902A" radius={[2, 2, 2, 2]} barSize={8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Revenue Analytics (Main Chart) */}
          <div className="col-span-1 lg:col-span-6 bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-[13px] font-bold text-gray-800 border-l-2 border-[#D73E26] pl-2">Activité Analytique</h3>
                <p className="text-[10px] text-gray-400 pl-2 mt-0.5">Scans QR et Nouveaux Clients (Mensuel)</p>
              </div>
              <div className="flex gap-2">
                 <button className="p-1 rounded hover:bg-gray-50"><Grid className="w-3.5 h-3.5 text-gray-400" /></button>
                 <button className="p-1 rounded hover:bg-gray-50"><Settings className="w-3.5 h-3.5 text-gray-400" /></button>
              </div>
            </div>

            <div className="flex-1 min-h-[260px] mt-4 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D73E26" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#D73E26" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E8902A" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#E8902A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="clients" name="Clients" stroke="#D73E26" strokeWidth={2} fillOpacity={1} fill="url(#colorClients)" />
                  <Area type="monotone" dataKey="scans" name="Scans" stroke="#E8902A" strokeWidth={2} fillOpacity={1} fill="url(#colorScans)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex justify-center gap-6 mt-2 pt-2 border-t border-gray-50">
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#E8902A]"></div><span className="text-[10px] text-gray-500">Scans QR</span></div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#D73E26]"></div><span className="text-[10px] text-gray-500">Nouveaux Clients</span></div>
            </div>
          </div>

          {/* Deals Status & Recent Activity */}
          <div className="col-span-1 lg:col-span-3 flex flex-col gap-5">
            {/* Deals Status */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-bold text-gray-800 border-l-2 border-[#D73E26] pl-2">Demandes de partenariat</h3>
                <Link href="/admin/partenariats" className="text-[10px] text-gray-400 hover:text-[#D73E26]">View All &rarr;</Link>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-2xl font-bold text-gray-800 tracking-tight">{totalRequests}</span>
                <span className="text-[9px] text-gray-400 mb-1 ml-1">demandes au total</span>
              </div>
              
              {/* Stacked Bar */}
              <div className="flex w-full h-1.5 rounded-full overflow-hidden mb-4">
                <div className="bg-[#7D9B4E] h-full" style={{ width: `${totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0}%` }}></div>
                <div className="bg-orange-400 h-full border-l border-white" style={{ width: `${totalRequests > 0 ? (pendingRequests / totalRequests) * 100 : 100}%` }}></div>
                <div className="bg-red-500 h-full border-l border-white" style={{ width: `${totalRequests > 0 ? (rejectedRequests / totalRequests) * 100 : 0}%` }}></div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#7D9B4E]"></span><span className="text-[10px] text-gray-600">Approuvées</span></div>
                  <span className="text-[10px] text-gray-400 font-medium">{approvedRequests}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span><span className="text-[10px] text-gray-600">En attente</span></div>
                  <span className="text-[10px] text-gray-400 font-medium">{pendingRequests}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span><span className="text-[10px] text-gray-600">Refusées</span></div>
                  <span className="text-[10px] text-gray-400 font-medium">{rejectedRequests}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-bold text-gray-800 border-l-2 border-[#D73E26] pl-2">Activité Récente</h3>
                <span className="text-[10px] text-gray-400">View All &rarr;</span>
              </div>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-100 before:to-transparent">
                {[
                  { text: 'Nouveau scan au Café Lumière', time: '4:45 PM', color: 'bg-[#D73E26]' },
                  { text: 'Partenaire "Boutique Zen" validé', time: '22 hrs', color: 'bg-[#E8902A]' },
                  { text: 'Demande de partenariat refusée', time: 'Today', color: 'bg-gray-300' },
                ].map((ev, i) => (
                  <div key={i} className="relative flex items-start gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ring-2 ring-white mt-0.5 relative z-10 ${ev.color}`}></div>
                    <div className="flex-1">
                       <p className="text-[10px] text-gray-700 font-medium leading-tight">{ev.text}</p>
                    </div>
                    <span className="text-[9px] text-gray-400 shrink-0">{ev.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ── ROW 3: DETAILED DATA TABLE ── */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-bold text-gray-800 border-l-2 border-[#D73E26] pl-2">Statistiques des Partenaires</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3 h-3 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search here..." className="border border-gray-200 rounded text-[10px] pl-6 pr-2 py-1 focus:outline-none focus:border-[#D73E26]"/>
              </div>
              <button className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                Sort By <ArrowDown className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase">
                  <th className="py-2 pl-2 w-8"><input type="checkbox" className="rounded border-gray-300" /></th>
                  <th className="py-2">Partenaire</th>
                  <th className="py-2">Catégorie</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Localisation</th>
                  <th className="py-2">Date d'inscription</th>
                  <th className="py-2">Scans</th>
                  <th className="py-2 text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody className="text-[11px] text-gray-700">
                {[
                  { name: 'Mayor Kelly', cat: 'Restauration', email: 'mayor.kelly@gmail.com', loc: 'Paris', date: 'Sep 15 - 2023', amt: '4,289', active: true },
                  { name: 'Andrew Garfield', cat: 'Boutique', email: 'andrewgarfield@gmail.com', loc: 'Lyon', date: 'Oct 12 - 2023', amt: '2,670', active: true },
                  { name: 'Simon Cowel', cat: 'Service', email: 'simoncowel234@gmail.com', loc: 'Marseille', date: 'Sep 10 - 2023', amt: '6,347', active: true },
                  { name: 'Mirinda Hers', cat: 'Marketing', email: 'mirindahers@gmail.com', loc: 'Bordeaux', date: 'Apr 14 - 2023', amt: '3,894', active: true },
                  { name: 'Jacob Smith', cat: 'Social Platform', email: 'jacobsmith@gmail.com', loc: 'Lille', date: 'Feb 25 - 2023', amt: '2,893', active: false },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-2.5 pl-2"><input type="checkbox" className="rounded border-gray-300" /></td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center font-bold text-[9px] text-gray-600">
                           {row.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-800">{row.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-gray-500">{row.cat}</td>
                    <td className="py-2.5 text-gray-500">{row.email}</td>
                    <td className="py-2.5">
                      <span className="text-[#E8902A] font-medium">{row.loc}</span>
                    </td>
                    <td className="py-2.5 text-gray-500">{row.date}</td>
                    <td className="py-2.5 font-bold text-gray-800">{row.amt}</td>
                    <td className="py-2.5 text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button className="p-1 rounded text-[#D73E26] hover:bg-red-50"><ArrowUp className="w-3.5 h-3.5" /></button>
                        <button className="p-1 rounded text-gray-400 hover:bg-gray-100"><Settings className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex items-center justify-between mt-3 px-2">
            <span className="text-[10px] text-gray-400">Showing 5 Entries</span>
            <div className="flex items-center gap-1">
              <button className="text-[10px] text-gray-500 hover:text-gray-800">Prev</button>
              <button className="w-5 h-5 flex items-center justify-center rounded bg-[#D73E26] text-white text-[10px] font-bold">1</button>
              <button className="w-5 h-5 flex items-center justify-center rounded text-gray-500 text-[10px] hover:bg-gray-100">2</button>
              <button className="text-[10px] text-gray-500 hover:text-gray-800">Next</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
