'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { logoutAction } from '@/services/authActions';
import { LayoutDashboard, Users, Gift, ShoppingBag, Megaphone, LogOut, Menu, X, Search, Bell, User, BarChart2, Sparkles, Clock, MessageSquare, Bot, Globe, ShieldAlert, TrendingUp, Settings } from 'lucide-react';



export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleLogout = async () => {
    await logoutAction();
    logout();
    window.location.href = '/login';
  };

  const commerceName = (user as any)?.commerce?.name || user?.firstName || 'Mon Commerce';
  const initials = commerceName.slice(0, 2).toUpperCase();

  const navItems = [
    { name: 'Tableau de bord', href: '/merchant', icon: LayoutDashboard },
    // — Modules IA —
    { name: 'Dashboard', href: '/merchant/dashboard-ia', icon: LayoutDashboard },
    { name: 'Clients', href: '/merchant/clients-ia', icon: Users },
    { name: 'Campagnes', href: '/merchant/campagnes-ia', icon: Megaphone },
    { name: 'Statistiques', href: '/merchant/statistiques', icon: BarChart2 },
    { name: 'Heures Creuses', href: '/merchant/heures-creuses', icon: Clock },
    { name: 'Sécurité & Fraude', href: '/merchant/securite', icon: ShieldAlert },
    { name: 'Avis Clients', href: '/merchant/avis', icon: MessageSquare },
    { name: 'Audit Chatbot', href: '/merchant/parametres/audit-moderation', icon: ShieldAlert },
    { name: 'Cross-Sell / Up-Sell', href: '/merchant/recommandations', icon: TrendingUp },
    { name: 'Récompenses', href: '/merchant/programme', icon: Gift },
    { name: 'Marketplace', href: '/merchant/marketplace', icon: ShoppingBag },
    { name: 'Paramètres', href: '/merchant/parametres/avances', icon: Sparkles },
    // —
    { name: 'Profil', href: '/merchant/profil', icon: User },
  ];

  return (
    <div className="min-h-screen flex font-inter bg-[#F7F5F2]">

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* -- SIDEBAR -- */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-[60] h-screen w-[220px] bg-[#1A0F0A] flex flex-col
        transition-transform duration-300 ease-in-out shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-[#DD2C1F] flex items-center justify-center shrink-0 shadow-lg shadow-red-900/40">
            <span className="text-white font-bricolage font-bold text-sm">R</span>
          </div>
          <span className="font-bricolage font-bold text-[18px] text-[#DD2C1F] tracking-tight">retenza.</span>
          <button className="lg:hidden ml-auto text-white/40 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-[#DD2C1F]/15 text-[#DD2C1F] font-semibold'
                    : 'text-white/45 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#DD2C1F]' : 'text-white/40'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom  user card */}
        <div className="px-3 pb-4 border-t border-white/5 pt-4">
          <Link href="/merchant/profil" className="flex items-center gap-3 px-2 py-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-[#DD2C1F] flex items-center justify-center text-white font-bold text-[13px] shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-[13px] font-semibold truncate leading-tight">{commerceName}</p>
              <p className="text-white/35 text-[11px] leading-tight">Voir le profil</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-2 py-2 mt-1 rounded-xl text-white/30 hover:text-red-400 hover:bg-white/5 transition-all text-[12px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* -- MAIN -- */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-[72px] bg-white border-b border-gray-200/60 flex items-center gap-4 px-6 lg:px-8 sticky top-0 z-40">
          <button
            className="lg:hidden p-2 -ml-2 text-[#5D534F] hover:bg-gray-50 rounded-lg"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-[340px]">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full bg-white border border-gray-200/80 rounded-xl py-2.5 pl-10 pr-4 text-[13px] text-[#1B100C] placeholder-gray-400 outline-none focus:border-[#DD2C1F] focus:ring-2 focus:ring-[#DD2C1F]/10 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative p-2 text-gray-500 hover:text-gray-900 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-9 h-9 rounded-xl bg-[#FFF5F2] border border-[#DD2C1F]/10 flex items-center justify-center text-[#DD2C1F] font-bold text-[13px] shadow-sm cursor-pointer">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-6 lg:px-8 pt-8 pb-12 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
