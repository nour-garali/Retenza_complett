'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { logoutAction } from '@/services/authActions';
import { LayoutDashboard, Store, Users, User, LogOut, Menu, X, ShieldCheck, Settings } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleLogout = async () => {
    await logoutAction();
    logout();
    window.location.href = '/login';
  };

  const navItems = [
    { name: 'Vue d\'ensemble', href: '/admin', icon: LayoutDashboard },
    { name: 'Partenaires', href: '/admin/partenaires', icon: Store },
    { name: 'Paramètres', href: '/admin/parametres', icon: Settings },
    { name: 'Profil', href: '/admin/profil', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#F4EFEB] font-inter text-[#1B100C] flex">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#1A0F0A] flex flex-col
        transition-transform duration-300 ease-in-out shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="h-[68px] flex items-center gap-2.5 px-5 border-b border-white/5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#D73E26] flex items-center justify-center shrink-0 shadow-lg shadow-red-900/40">
              <span className="text-white font-bricolage font-bold text-sm">R</span>
            </div>
            <span className="font-bricolage font-bold text-[18px] text-[#D73E26] tracking-tight">retenza.</span>
            <button className="lg:hidden ml-auto text-white/40 hover:text-white transition-colors" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-6 space-y-0.5 overflow-y-auto">
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-4 px-3">Menu Principal</div>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
                    isActive 
                      ? 'bg-[#D73E26]/15 text-[#D73E26] font-semibold' 
                      : 'text-white/45 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? 'text-[#D73E26]' : 'text-white/40 group-hover:text-white/60'}`} />
                  <span className="text-[13px]">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section (User & Logout) */}
          <div className="px-3 pb-4 border-t border-white/5 pt-4">
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[#D73E26] flex items-center justify-center text-white font-bold text-[13px] shrink-0">
                {user?.firstName?.charAt(0) || 'A'}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-white text-[13px] font-bold truncate leading-tight">{user?.firstName} {user?.lastName}</p>
                <p className="text-white/35 text-[11px] truncate leading-tight">Admin System</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-2 py-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-white/5 transition-all text-[12px] font-medium group"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FA]">
        
        {/* Mobile Top Bar */}
        <header className="lg:hidden bg-white border-b border-[#EDE5DF] h-16 flex items-center px-4 shrink-0 sticky top-0 z-30">
          <button 
            className="p-2 -ml-2 mr-2 text-[#6E5B52] hover:bg-gray-100 rounded-lg"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bricolage font-bold text-lg text-[#1B100C]">Dashboard Admin</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>

      </div>

    </div>
  );
}
