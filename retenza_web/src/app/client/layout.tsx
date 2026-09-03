'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { logoutAction } from '@/services/authActions';
import { Home, CreditCard, Compass, User, LogOut, Menu, X, Bell, Settings } from 'lucide-react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);

  const handleLogout = async () => {
    await logoutAction();
    logout();
    window.location.href = '/login';
  };

  const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`.toUpperCase() || 'CL';
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Client';

  const navItems = [
    { name: 'Accueil',   href: '/client',         icon: Home },
    { name: 'Mes Cartes', href: '/client/cartes',  icon: CreditCard },
    { name: 'Explorer',  href: '/client/explorer', icon: Compass },
    { name: 'Profil',    href: '/client/profil',   icon: User },
  ];

  return (
    <div className="min-h-screen flex font-inter bg-[#F0EDE8]">

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-[220px] bg-[#1A0F0A] flex flex-col
        transition-transform duration-300 ease-in-out shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-[#D73E26] flex items-center justify-center shrink-0 shadow-lg shadow-red-900/40">
            <span className="text-white font-bricolage font-bold text-sm">R</span>
          </div>
          <span className="font-bricolage font-bold text-[18px] text-[#D73E26] tracking-tight">retenza.</span>
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
                    ? 'bg-[#D73E26]/15 text-[#D73E26] font-semibold'
                    : 'text-white/45 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D73E26]' : 'text-white/40'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom — user card */}
        <div className="px-3 pb-4 border-t border-white/5 pt-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-xl bg-[#D73E26] flex items-center justify-center text-white font-bold text-[13px] shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-[13px] font-semibold truncate leading-tight">{fullName}</p>
              <p className="text-white/35 text-[11px] leading-tight">Membre Retenza</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-2 py-2 mt-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-white/5 transition-all text-[12px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-16 bg-[#F0EDE8] flex items-center gap-4 px-6 lg:px-8 sticky top-0 z-30">
          <button
            className="lg:hidden p-2 -ml-2 text-[#5D534F] hover:bg-white/60 rounded-lg"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Spacer to push right icons to the end since the search bar is removed */}
          <div className="flex-1" />

          {/* Right icons */}
          <div className="flex items-center gap-3 ml-auto relative">
            <button className="relative w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 text-[#5D534F] hover:text-[#1B100C] transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D73E26] rounded-full text-white text-[9px] font-bold flex items-center justify-center">2</span>
            </button>

            {/* Avatar + dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-9 h-9 rounded-xl bg-[#D73E26] flex items-center justify-center text-white font-bold text-[12px] shadow-sm cursor-pointer"
              >
                {initials}
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 top-11 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden py-1">
                  <Link href="/client/profil" onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#1B100C] hover:bg-gray-50 transition-colors">
                    <User className="w-4 h-4 text-[#9C8B82]" /> Mon profil
                  </Link>
                  <Link href="/client/profil?tab=settings" onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#1B100C] hover:bg-gray-50 transition-colors">
                    <Settings className="w-4 h-4 text-[#9C8B82]" /> Paramètres
                  </Link>
                  <div className="border-t border-gray-100 my-1" />
                  <button onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" /> Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-6 lg:px-8 pb-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
