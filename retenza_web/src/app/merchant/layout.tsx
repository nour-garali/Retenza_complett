'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { logoutAction } from '@/services/authActions';
import { globalSearch } from '@/services/merchantDashboardActions';
import { SearchContext } from '@/contexts/SearchContext';
import { LayoutDashboard, Users, Gift, ShoppingBag, Megaphone, LogOut, Menu, X, Search, Bell, User, BarChart2, Sparkles, Clock, MessageSquare, Bot, Globe, ShieldAlert, TrendingUp, Settings, ChevronRight } from 'lucide-react';
import AINotificationBell from '@/components/AINotificationBell';

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isHandledLocally, setIsHandledLocally] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = React.useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search Debounce Effect
  React.useEffect(() => {
    // If the active page handles search locally, don't trigger global API search
    if (isHandledLocally) {
      setShowSearchDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true);
        try {
          const results = await globalSearch(searchQuery);
          setSearchResults(results);
          setShowSearchDropdown(true);
        } catch (err) {
          console.error("Search error", err);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isHandledLocally]);

  const handleLogout = async () => {
    await logoutAction();
    logout();
    window.location.href = '/login';
  };

  const commerceName = (user as any)?.commerce?.name || user?.firstName || 'Mon Commerce';
  const initials = commerceName.slice(0, 2).toUpperCase();

  const navItems = [
    { name: 'Tableau de bord', href: '/merchant', icon: LayoutDashboard },
    { name: 'Dashboard', href: '/merchant/dashboard-ia', icon: LayoutDashboard },
    { name: 'Clients', href: '/merchant/clients-ia', icon: Users },
    { name: 'Campagnes', href: '/merchant/campagnes-ia', icon: Megaphone },
    { name: 'Statistiques', href: '/merchant/statistiques', icon: BarChart2 },
    { name: 'Heures Creuses', href: '/merchant/heures-creuses', icon: Clock },
    { name: 'Sécurité & Fraude', href: '/merchant/securite', icon: ShieldAlert },
    { name: 'Avis Clients', href: '/merchant/avis', icon: MessageSquare },
    { name: 'Audit Chatbot', href: '/merchant/parametres/audit-moderation', icon: ShieldAlert },
    { name: 'Cross-Sell / Up-Sell', href: '/merchant/recommandations', icon: TrendingUp },
    { name: 'Paramètres', href: '/merchant/parametres/avances', icon: Sparkles },
    { name: 'Récompenses', href: '/merchant/programme', icon: Gift },
    { name: 'Marketplace', href: '/merchant/marketplace', icon: ShoppingBag },
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
          <div className="flex-1 max-w-[340px]" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) setShowSearchDropdown(true);
                }}
                className="w-full bg-white border border-gray-200/80 rounded-xl py-2.5 pl-10 pr-4 text-[13px] text-[#1B100C] placeholder-gray-400 outline-none focus:border-[#DD2C1F] focus:ring-2 focus:ring-[#DD2C1F]/10 transition-all shadow-sm"
              />

              {/* Search Dropdown */}
              {showSearchDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E9E4DD] rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[300px] overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-[13px] text-gray-500 animate-pulse">Recherche en cours...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((res: any) => (
                        <Link
                          key={res.id}
                          href={res.url}
                          onClick={() => {
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F7F5F2] transition-colors group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[13.5px] font-semibold text-[#17151A] truncate group-hover:text-[#DD2C1F] transition-colors">{res.title}</p>
                            <p className="text-[12px] text-[#736C72] truncate mt-0.5">{res.subtitle}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{res.type}</span>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#DD2C1F] transition-colors" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-[13px] text-gray-500">Aucun résultat trouvé</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-3 ml-auto relative" ref={dropdownRef}>
            <AINotificationBell />
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-9 h-9 rounded-xl bg-[#FFF5F2] border border-[#DD2C1F]/10 flex items-center justify-center text-[#DD2C1F] font-bold text-[13px] shadow-sm cursor-pointer hover:bg-[#FBEAE6] transition-colors focus:outline-none focus:ring-2 focus:ring-[#DD2C1F]/20"
            >
              {initials}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-12 w-56 bg-white border border-[#E9E4DD] rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-[#E9E4DD]">
                  <p className="text-[14px] font-bold text-[#17151A] truncate">{commerceName}</p>
                  <p className="text-[12px] text-[#736C72] truncate">{user?.email || 'Commerçant'}</p>
                </div>
                
                <div className="py-1.5">
                  <Link 
                    href="/merchant/profil" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13.5px] font-medium text-[#17151A] hover:bg-[#F7F5F2] transition-colors"
                  >
                    <User className="w-4 h-4 text-[#736C72]" />
                    Voir le profil
                  </Link>
                  <Link 
                    href="/merchant/parametres/avances" 
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13.5px] font-medium text-[#17151A] hover:bg-[#F7F5F2] transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#736C72]" />
                    Paramètres
                  </Link>
                </div>

                <div className="border-t border-[#E9E4DD] py-1.5">
                  <button 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[13.5px] font-bold text-[#C31F3C] hover:bg-[#FBEAE6] transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-6 lg:px-8 pt-8 pb-12 overflow-x-hidden">
          <SearchContext.Provider value={{ searchQuery, setSearchQuery, isHandledLocally, setIsHandledLocally }}>
            {children}
          </SearchContext.Provider>
        </main>
      </div>
    </div>
  );
}
