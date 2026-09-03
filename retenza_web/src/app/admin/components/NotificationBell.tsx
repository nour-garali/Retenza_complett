'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, ShieldCheck, Users, AlertTriangle, Headphones, X, CheckCheck, FileText } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'partnership' | 'incident' | 'support' | 'security' | 'weekly';
  title: string;
  message: string;
  time: string;
  read: boolean;
  link: string;
}


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

async function fetchNotifications(): Promise<Notification[]> {
  try {
    const res = await fetch('/api/admin/notifications', { cache: 'no-store' });
    if (!res.ok) return getDemoNotifications();
    const data = await res.json();
    const notifs: Notification[] = data.notifications || [];
    return notifs.length > 0 ? notifs : getDemoNotifications();
  } catch {
    return getDemoNotifications();
  }
}



function getDemoNotifications(): Notification[] {
  return [
    {
      id: 'demo-1',
      type: 'partnership',
      title: 'Nouvelle demande de partenariat',
      message: 'Café Lumière — Restauration',
      time: 'il y a 5 min',
      read: false,
      link: '/admin/partenaires',
    },
    {
      id: 'demo-2',
      type: 'incident',
      title: 'Incident signalé',
      message: 'Problème de connexion QR code chez Boutique Zénith',
      time: 'il y a 22 min',
      read: false,
      link: '/admin',
    },
    {
      id: 'demo-3',
      type: 'support',
      title: 'Ticket support ouvert',
      message: 'Problème de facturation — Le Fournil',
      time: 'il y a 1h',
      read: true,
      link: '/admin',
    },
    {
      id: 'demo-4',
      type: 'weekly',
      title: 'Rapport hebdomadaire disponible',
      message: 'Résumé des statistiques de la semaine du 4 au 10 août.',
      time: 'ce lundi',
      read: false,
      link: '/admin/parametres',
    },
  ];
}

const iconMap = {
  partnership: { icon: Users, bg: 'bg-[#EEF3E8]', color: 'text-[#7D9B4E]' },
  incident: { icon: AlertTriangle, bg: 'bg-orange-50', color: 'text-orange-500' },
  support: { icon: Headphones, bg: 'bg-blue-50', color: 'text-blue-500' },
  security: { icon: ShieldCheck, bg: 'bg-red-50', color: 'text-[#D73E26]' },
  weekly: { icon: FileText, bg: 'bg-purple-50', color: 'text-purple-500' },
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read && !readIds.has(n.id)).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load on open
  useEffect(() => {
    if (open && notifications.length === 0) {
      setLoading(true);
      fetchNotifications().then(data => {
        setNotifications(data);
        setLoading(false);
      });
    }
  }, [open]);

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications().then(setNotifications);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Initial load for badge count
  useEffect(() => {
    fetchNotifications().then(setNotifications);
  }, []);

  const markAllRead = () => {
    setReadIds(new Set(notifications.map(n => n.id)));
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative cursor-pointer p-1 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-4 h-4 text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-[#D73E26] rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-9 w-[340px] bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#D73E26]" />
              <span className="text-[13px] font-bold text-gray-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-[#D73E26] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-[#7D9B4E] hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Tout lire
                </button>
              )}
              <button onClick={() => setOpen(false)}>
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="py-8 flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-[#D73E26] border-t-transparent rounded-full animate-spin" />
                <p className="text-[11px] text-gray-400">Chargement...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
                <Bell className="w-8 h-8 opacity-30" />
                <p className="text-[12px]">Aucune notification</p>
              </div>
            ) : (
              notifications.map(notif => {
                const isRead = notif.read || readIds.has(notif.id);
                const { icon: Icon, bg, color } = iconMap[notif.type];
                return (
                  <Link
                    key={notif.id}
                    href={notif.link}
                    onClick={() => {
                      setReadIds(prev => new Set([...prev, notif.id]));
                      setOpen(false);
                    }}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                      !isRead ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] ${!isRead ? 'font-semibold text-gray-800' : 'font-medium text-gray-600'} leading-tight`}>
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">{notif.message}</p>
                      <p className="text-[10px] text-gray-300 mt-1">{notif.time}</p>
                    </div>
                    {!isRead && (
                      <span className="w-2 h-2 bg-[#D73E26] rounded-full shrink-0 mt-1.5" />
                    )}
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2.5">
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="text-[11px] text-[#D73E26] hover:underline font-medium"
            >
              Voir toutes les activités →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
