'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMerchantCampaigns } from '@/services/merchantDashboardActions';
import { 
  Megaphone, MessageSquare, Mail, Bell, 
  Users, Calendar, Plus, MoreHorizontal, SlidersHorizontal
} from 'lucide-react';

type Campaign = {
  id: number;
  title: string;
  type: string;
  target: string;
  status: string;
  date: string;
  sent: number;
  opened: number;
  clicked: number;
};

export default function MerchantCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function loadData() {
      const data = await getMerchantCampaigns();
      setCampaigns(data);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const typeConfig: Record<string, { label: string; icon: React.ReactNode; pill: string }> = {
    sms:   { label: 'SMS',   icon: <MessageSquare className="w-3.5 h-3.5" />, pill: 'bg-blue-50 text-blue-600 border-blue-100' },
    email: { label: 'Email', icon: <Mail          className="w-3.5 h-3.5" />, pill: 'bg-violet-50 text-violet-600 border-violet-100' },
    push:  { label: 'Push',  icon: <Bell          className="w-3.5 h-3.5" />, pill: 'bg-amber-50 text-amber-600 border-amber-100' },
  };

  const statusConfig: Record<string, { label: string; dot: string; pill: string }> = {
    terminée:  { label: 'Terminée', dot: 'bg-gray-300',                             pill: 'bg-gray-50 text-gray-500 border-gray-200' },
    en_cours:  { label: 'Active',   dot: 'bg-[#D73E26]',                            pill: 'bg-[#FFF5F2] text-[#D73E26] border-[#D73E26]/20' },
    planifiée: { label: 'À venir',  dot: 'bg-amber-400',                            pill: 'bg-amber-50 text-amber-600 border-amber-100' },
  };

  const tabs = [
    { id: 'all',      label: 'Toutes' },
    { id: 'en_cours', label: 'Actives' },
    { id: 'planifiée',label: 'Planifiées' },
    { id: 'terminée', label: 'Terminées' },
  ];

  const filtered = filter === 'all' ? campaigns : campaigns.filter(c => c.status === filter);

  return (
    <div className="h-full flex flex-col">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <div>
          <h1 className="text-[22px] font-bricolage font-bold text-[#1B100C]">Campagnes</h1>
          <p className="text-[13px] text-[#5D534F] mt-0.5">Configurez une fois, Retenza relance tout seul.</p>
        </div>
        <Link
          href="/merchant/campagnes/nouvelle"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#D73E26] hover:bg-[#C0321C] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-sm shadow-[#D73E26]/20"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouvelle campagne
        </Link>
      </div>

      {/* ── Toolbar: Tabs + Search ── */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
                filter === tab.id
                  ? 'bg-[#1A0F0A] text-white shadow-sm'
                  : 'text-[#5D534F] hover:text-[#1B100C] hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter icon */}
        <button className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-[#5D534F] hover:text-[#1B100C] shadow-sm transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden flex flex-col">

        {/* Column headers */}
        <div className="grid grid-cols-12 items-center px-5 py-3 border-b border-gray-100 bg-gray-50/60 shrink-0">
          <span className="col-span-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Campagne</span>
          <span className="col-span-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Canal</span>
          <span className="col-span-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Envoyés</span>
          <span className="col-span-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Ouvertures</span>
          <span className="col-span-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">Statut</span>
          <span className="col-span-1"></span>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100/80">
          {isLoading ? (
            <div className="py-24 flex items-center justify-center gap-3 text-[#5D534F]">
              <div className="w-5 h-5 border-2 border-[#D73E26]/20 border-t-[#D73E26] rounded-full animate-spin" />
              <span className="text-[13px] font-medium">Chargement...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 flex flex-col items-center gap-3 text-center">
              <Megaphone className="w-8 h-8 text-gray-300" />
              <p className="text-[14px] font-semibold text-[#1B100C]">Aucune campagne</p>
              <p className="text-[13px] text-[#5D534F]">Créez votre première campagne pour engager vos clients.</p>
            </div>
          ) : (
            filtered.map((camp) => {
              const t = typeConfig[camp.type] ?? typeConfig.push;
              const s = statusConfig[camp.status] ?? statusConfig.terminée;
              const openPct = camp.sent > 0 ? Math.round((camp.opened / camp.sent) * 100) : 0;

              return (
                <div
                  key={camp.id}
                  className="grid grid-cols-12 items-center px-5 py-4 hover:bg-[#FAFAF9] transition-colors group"
                >
                  {/* Campagne name + meta */}
                  <div className="col-span-4 flex flex-col gap-1 min-w-0 pr-4">
                    <span className="text-[14px] font-semibold text-[#1B100C] truncate group-hover:text-[#D73E26] transition-colors">
                      {camp.title}
                    </span>
                    <div className="flex items-center gap-2 text-[12px] text-[#5D534F]">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{camp.target}</span>
                      <span className="text-gray-300">·</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{camp.date}</span>
                    </div>
                  </div>

                  {/* Canal */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border ${t.pill}`}>
                      {t.icon} {t.label}
                    </span>
                  </div>

                  {/* Envoyés */}
                  <div className="col-span-2 text-right">
                    <span className="text-[14px] font-semibold text-[#1B100C]">
                      {camp.sent > 0 ? camp.sent.toLocaleString('fr') : '—'}
                    </span>
                  </div>

                  {/* Ouvertures + mini bar */}
                  <div className="col-span-2 flex flex-col items-center gap-1.5 px-4">
                    <div className="w-full flex items-center justify-between text-[12px]">
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-[#D73E26] rounded-full"
                          style={{ width: `${openPct}%` }}
                        />
                      </div>
                      <span className="ml-2 font-bold text-[#1B100C] whitespace-nowrap">{openPct > 0 ? `${openPct}%` : '—'}</span>
                    </div>
                  </div>

                  {/* Statut */}
                  <div className="col-span-1 flex justify-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${s.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot} ${camp.status === 'en_cours' ? 'animate-pulse' : ''}`} />
                      {s.label}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="col-span-1 flex justify-end">
                    <button className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-[#1B100C] hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer count */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 shrink-0">
            <span className="text-[12px] text-gray-400 font-medium">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
          </div>
        )}

      </div>
    </div>
  );
}
