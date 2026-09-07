'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { logoutAction } from '@/services/authActions';
import { LayoutDashboard, Store, User, LogOut, Search, ChevronRight, Settings, Menu, X } from 'lucide-react';
import NotificationBell from './components/NotificationBell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logoutAction();
    logout();
    window.location.href = '/login';
  };

  const navItems = [
    { name: "Vue d'ensemble", href: '/admin', icon: LayoutDashboard },
    { name: 'Partenaires', href: '/admin/partenaires', icon: Store },
    { name: 'Paramètres', href: '/admin/parametres', icon: Settings },
    { name: 'Profil', href: '/admin/profil', icon: User },
  ];

  const adminName = user?.firstName || 'Admin';
  const initials = adminName.slice(0, 2).toUpperCase();

  // Get active tab info
  const activeItem = navItems.find(item => item.href === pathname) || navItems[0];

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
          <div className="w-8 h-8 rounded-lg bg-[#D85A30] flex items-center justify-center shrink-0 shadow-lg shadow-[#D85A30]/40">
            <span className="text-white font-bricolage font-bold text-sm">R</span>
          </div>
          <span className="font-bricolage font-bold text-[18px] text-[#D85A30] tracking-tight">retenza.</span>
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
                    ? 'bg-[#D85A30]/15 text-[#D85A30] font-semibold'
                    : 'text-white/45 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#D85A30]' : 'text-white/40'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom — user card */}
        <div className="px-3 pb-4 border-t border-white/5 pt-4">
          <Link href="/admin/profil" className="flex items-center gap-3 px-2 py-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-[#D85A30] flex items-center justify-center text-white font-bold text-[13px] shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-[13px] font-semibold truncate leading-tight">{adminName}</p>
              <p className="text-white/35 text-[11px] leading-tight">Admin System</p>
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
        
        {/* ── TOP BAR (White background) ── */}
        <header className="h-[72px] bg-white border-b border-gray-200/60 flex items-center gap-4 px-6 lg:px-8 sticky top-0 z-40 shrink-0">
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
                className="w-full bg-white border border-gray-200/80 rounded-xl py-2.5 pl-10 pr-4 text-[13px] text-[#1B100C] placeholder-gray-400 outline-none focus:border-[#D85A30] focus:ring-2 focus:ring-[#D85A30]/10 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-3 ml-auto relative" ref={dropdownRef}>
            <NotificationBell />
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-9 h-9 rounded-xl bg-[#FFF5F2] border border-[#D85A30]/10 flex items-center justify-center text-[#D85A30] font-bold text-[13px] shadow-sm cursor-pointer hover:bg-[#FBEAE6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D85A30]/20"
            >
              {initials}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-12 w-56 bg-white border border-[#E9E4DD] rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-[#E9E4DD]">
                  <p className="text-[14px] font-bold text-[#17151A] truncate">{adminName} {user?.lastName}</p>
                  <p className="text-[12px] text-[#736C72] truncate">{user?.email || 'Admin System'}</p>
                </div>
                
                <div className="py-1.5">
                  <Link 
                    href="/admin/profil" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#736C72] hover:text-[#17151A] hover:bg-[#F7F5F2] transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Profil
                  </Link>
                  <Link 
                    href="/admin/parametres" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#736C72] hover:text-[#17151A] hover:bg-[#F7F5F2] transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Paramètres
                  </Link>
                </div>
                <div className="border-t border-[#E9E4DD] py-1.5">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#D85A30] font-medium hover:bg-[#FFF5F2] transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ── BRANDED SaaS HEADER ── */}
        <header className="relative bg-[#F7F5F2] shrink-0 border-b border-gray-200/70 z-30">
          
          {/* Background container with overflow-hidden just for the decorative wave */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute right-0 top-0 h-full w-72 select-none opacity-[0.06]">
              <svg viewBox="0 0 300 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute right-0 top-0 h-full w-full">
                <path d="M300 0 C220 40, 200 80, 300 120" stroke="#D85A30" strokeWidth="60" strokeLinecap="round" fill="none"/>
                <path d="M300 0 C240 30, 230 70, 300 110" stroke="#D85A30" strokeWidth="30" strokeLinecap="round" fill="none"/>
                <path d="M280 20 C230 50, 220 80, 280 120" stroke="#D85A30" strokeWidth="20" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
          </div>

          <div className="relative px-6 lg:px-8 pt-4 pb-0 max-w-7xl mx-auto w-full">

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 mb-2.5">
              <span className="text-[12px] text-gray-400 font-medium">Dashboard Admin</span>
              <span className="text-[12px] text-gray-300 mx-0.5">/</span>
              <span className="text-[12px] text-[#D85A30] font-semibold">
                {activeItem.name}
              </span>
            </nav>

            {/* Title row */}
            <div className="flex items-start justify-between gap-6 pb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-[26px] font-bold leading-tight tracking-tight">
                  <span className="text-[#1B100C]">
                    {activeItem.name === "Vue d'ensemble" ? "Tableau de Bord " : activeItem.name === "Partenaires" ? "Gestion des " : activeItem.name === "Paramètres" ? "Configuration " : "Mon "}
                  </span>
                  <span className="text-[#D85A30]">
                    {activeItem.name === "Vue d'ensemble" ? "Système" : activeItem.name === "Partenaires" ? "Commerçants" : activeItem.name === "Paramètres" ? "Globale" : "Profil"}
                  </span>
                </h1>

                <p className="text-[13px] text-[#9C8B82] mt-1 leading-snug max-w-xl">
                  {activeItem.name === "Vue d'ensemble" 
                    ? "Supervisez l'activité globale de la plateforme Retenza."
                    : activeItem.name === "Partenaires"
                    ? "Gérez les inscriptions et suivez les métriques des partenaires."
                    : activeItem.name === "Paramètres"
                    ? "Ajustez les paramètres globaux de la plateforme."
                    : "Gérez vos informations personnelles et préférences."}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 -mb-px overflow-x-auto no-scrollbar">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-1 py-3 mr-5 text-[13px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? "border-[#D85A30] text-[#D85A30]"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
          {children}
        </main>

      </div>
    </div>
  );
}
