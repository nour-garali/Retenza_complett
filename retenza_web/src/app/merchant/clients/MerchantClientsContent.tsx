'use client';

import React, { useState } from 'react';
import { Search, Users, MoreHorizontal, Calendar, Star, TrendingDown, ArrowUpRight, ArrowDownRight, SlidersHorizontal } from 'lucide-react';

/* ─── Mock Data for beautiful UI presentation ─── */
const MOCK_CLIENTS = [
  { _id: '1', firstName: 'Sophie', lastName: 'Martin', email: 'sophie.m@example.com', loyaltyPoints: 450, status: 'VIP', lastVisit: 'Il y a 2 jours', totalSpent: 1240 },
  { _id: '2', firstName: 'Thomas', lastName: 'Dubois', email: 'thomas.dubois@gmail.com', loyaltyPoints: 120, status: 'Régulier', lastVisit: 'La semaine dernière', totalSpent: 340 },
  { _id: '3', firstName: 'Emma', lastName: 'Leroy', email: 'emma.lry@hotmail.fr', loyaltyPoints: 85, status: 'Nouveau', lastVisit: 'Hier', totalSpent: 110 },
  { _id: '4', firstName: 'Lucas', lastName: 'Moreau', email: 'lucas.moreau88@yahoo.com', loyaltyPoints: 340, status: 'À risque', lastVisit: 'Il y a 2 mois', totalSpent: 890 },
  { _id: '5', firstName: 'Julie', lastName: 'Roux', email: 'j.roux@entreprise.com', loyaltyPoints: 210, status: 'Régulier', lastVisit: 'Il y a 3 semaines', totalSpent: 420 },
  { _id: '6', firstName: 'Antoine', lastName: 'Petit', email: 'antoine.p@live.fr', loyaltyPoints: 620, status: 'VIP', lastVisit: 'Aujourd\'hui', totalSpent: 2100 },
  { _id: '7', firstName: 'Chloé', lastName: 'Simon', email: 'chloe.simon@gmail.com', loyaltyPoints: 45, status: 'Nouveau', lastVisit: 'Il y a 5 jours', totalSpent: 65 },
  { _id: '8', firstName: 'Nicolas', lastName: 'Laurent', email: 'nicolas.l@example.com', loyaltyPoints: 180, status: 'À risque', lastVisit: 'Il y a 3 mois', totalSpent: 550 },
];

export default function MerchantClientsContent({ initialClients }: { initialClients: any[] }) {
  // Use mock data if API returns empty for demonstration purposes
  const [clients, setClients] = useState<any[]>(initialClients.length > 0 ? initialClients : MOCK_CLIENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredClients = clients.filter(c => {
    const name = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
    const email = `${c.email || ''}`.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = name.includes(q) || email.includes(q);
    const matchesFilter = filter === 'all' || c.status?.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const getStatusStyle = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'vip':      return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'régulier': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'à risque': return 'bg-[#FFF5F2] text-[#D73E26] border-[#D73E26]/20';
      case 'nouveau':  return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      default:         return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'vip':      return <Star className="w-3 h-3" />;
      case 'à risque': return <TrendingDown className="w-3 h-3" />;
      case 'nouveau':  return <ArrowUpRight className="w-3 h-3" />;
      default:         return null;
    }
  };

  const tabs = [
    { id: 'all',      label: 'Tous les clients' },
    { id: 'vip',      label: 'VIP' },
    { id: 'régulier', label: 'Réguliers' },
    { id: 'à risque', label: 'À risque' },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <div>
          <h1 className="text-[22px] font-bricolage font-bold text-[#1B100C]">Clients</h1>
          <p className="text-[13px] text-[#5D534F] mt-0.5">Gérez votre base de clients et suivez leur engagement.</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Quick Stats Header */}
          <div className="hidden sm:flex items-center gap-6 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Base</span>
              <span className="text-[14px] font-bricolage font-bold text-[#1B100C]">{clients.length}</span>
            </div>
            <div className="w-px h-6 bg-gray-100" />
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Clients VIP</span>
              <span className="text-[14px] font-bricolage font-bold text-amber-600">
                {clients.filter(c => c.status?.toLowerCase() === 'vip').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toolbar: Tabs + Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-[#1A0F0A] text-white shadow-sm'
                  : 'text-[#5D534F] hover:text-[#1B100C] hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + filter icon */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-[13px] text-[#1B100C] placeholder-gray-400 focus:outline-none focus:border-[#D73E26] focus:ring-2 focus:ring-[#D73E26]/10 transition-all w-full sm:w-[240px] shadow-sm"
            />
          </div>
          <button className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-[#5D534F] hover:text-[#1B100C] shadow-sm transition-colors shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden flex flex-col">
        {/* Column headers */}
        <div className="grid grid-cols-12 items-center px-5 py-3 border-b border-gray-100 bg-gray-50/60 shrink-0">
          <span className="col-span-5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Client</span>
          <span className="col-span-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Statut</span>
          <span className="col-span-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Fidélité</span>
          <span className="col-span-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right">Dernière visite</span>
          <span className="col-span-1"></span>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100/80">
          {filteredClients.length === 0 ? (
            <div className="py-24 flex flex-col items-center gap-3 text-center">
              <Users className="w-8 h-8 text-gray-300" />
              <p className="text-[14px] font-semibold text-[#1B100C]">Aucun client trouvé</p>
              <p className="text-[13px] text-[#5D534F]">Vos clients apparaîtront ici lorsqu'ils scanneront votre QR code.</p>
            </div>
          ) : (
            filteredClients.map((c) => {
              const initials = c.firstName ? c.firstName[0].toUpperCase() + (c.lastName ? c.lastName[0].toUpperCase() : '') : '?';
              return (
                <div
                  key={c._id}
                  className="grid grid-cols-12 items-center px-5 py-4 hover:bg-[#FAFAF9] transition-colors group cursor-pointer"
                >
                  {/* Client Info */}
                  <div className="col-span-5 flex items-center gap-3 pr-4">
                    <div className="w-10 h-10 rounded-full bg-[#FFF5F2] border border-[#D73E26]/10 flex items-center justify-center text-[#D73E26] font-bricolage font-bold text-[13px] shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <span className="text-[14px] font-bold text-[#1B100C] truncate group-hover:text-[#D73E26] transition-colors">
                        {c.firstName} {c.lastName}
                      </span>
                      <span className="text-[12px] text-[#5D534F] truncate">{c.email}</span>
                    </div>
                  </div>

                  {/* Statut */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusStyle(c.status)}`}>
                      {getStatusIcon(c.status)}
                      {c.status || 'Standard'}
                    </span>
                  </div>

                  {/* Fidélité */}
                  <div className="col-span-2 text-right flex flex-col items-end gap-0.5">
                    <span className="text-[15px] font-bricolage font-bold text-[#1B100C]">
                      {c.loyaltyPoints} <span className="text-[11px] text-[#5D534F] font-semibold">pts</span>
                    </span>
                    {c.totalSpent && (
                      <span className="text-[11px] text-gray-400 font-medium">Dépensé : {c.totalSpent}€</span>
                    )}
                  </div>

                  {/* Dernière visite */}
                  <div className="col-span-2 text-right flex items-center justify-end gap-1.5 text-[12px] font-medium text-[#5D534F]">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {c.lastVisit || 'Inconnue'}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex justify-end">
                    <button className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-[#1B100C] hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer count */}
        {filteredClients.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 shrink-0">
            <span className="text-[12px] text-gray-400 font-medium">{filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}
