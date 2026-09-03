"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { LayoutDashboard, Users, Send, BarChart3, Shield, Clock3, MessageSquare, TrendingUp, RefreshCw, Settings2, Bot, ShieldCheck } from "lucide-react";

function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");

  const [unreadTickets, setUnreadTickets] = useState<number>(0);

  // Polling toutes les 10 secondes pour connaître le nombre de tickets non lus
  useEffect(() => {
    let commerceId: string | null = null;
    try {
      const stored = localStorage.getItem("user_commerce");
      if (stored) {
        const parsed = JSON.parse(stored);
        commerceId = parsed?.commerce_id || parsed?.id || null;
      }
    } catch {}

    const fetchUnread = async () => {
      try {
        // Vue admin globale : tous les tickets non lus, sans filtre boutique
        const url = `/api/chatbot/support-tickets?limit=1`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setUnreadTickets(data.unread_tickets_count ?? 0);
        }
      } catch {}
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, []);

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/clients", label: "Clients", icon: Users },
    { href: "/campaigns", label: "Campagnes", icon: Send },
    { href: "/statistiques", label: "Statistiques", icon: BarChart3 },
    { href: "/heures-creuses", label: "Heures Creuses", icon: Clock3 },
    { href: "/administration/securite", label: "Sécurité & Fraude", icon: Shield },
    { href: "/avis-clients", label: "Avis Clients", icon: MessageSquare },
    { href: "/parametres/audit-moderation", label: "Audit Chatbot", icon: ShieldCheck, badgeCount: unreadTickets },
    { href: "/recommandations", label: "Cross-Sell / Up-Sell", icon: TrendingUp },
    { href: "/parametres/avances", label: "Paramètres", icon: Settings2 },
  ];

  return (
    <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
      {links.map((link) => {
        const Icon = link.icon;
        let isActive = false;

        if (link.href === "/") {
          isActive = pathname === "/" && activeTab !== "global";
        } else {
          isActive = pathname === link.href;
        }

        const badge = (link as { badgeCount?: number }).badgeCount ?? 0;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${isActive
                ? "bg-[#FDECEA] text-[#E8462F]"
                : "text-[#7A6E68] hover:bg-[#FAF3EE] hover:text-[#1A1A1A]"
              }`}
          >
            <Icon
              className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-[#E8462F]" : "text-[#B0A49C] group-hover:text-[#7A6E68]"
                }`}
            />
            <span className="flex-1">{link.label}</span>
            {badge > 0 && (
              <span
                className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold text-white animate-pulse"
                style={{ backgroundColor: "#E8462F" }}
              >
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-[#EEE5DF] flex flex-col h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-[#EEE5DF]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E8462F] to-[#F06038] flex items-center justify-center shadow-md shadow-[#E8462F]/25">
            <RefreshCw className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1A1A1A] tracking-tight leading-none">
              Retenza <span className="text-[#E8462F]">AI</span>
            </h1>
            <p className="text-[10px] text-[#7A6E68] font-medium mt-0.5">Console d'Administration</p>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="flex-1 px-4 py-6" />}>
        <SidebarNav />
      </Suspense>
    </aside>
  );
}
