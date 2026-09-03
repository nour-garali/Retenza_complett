'use client';

import React, { useState } from 'react';
import { Search, Users, ShieldAlert } from 'lucide-react';

export default function AdminClientsContent({ initialClients }: { initialClients: any[] }) {
  const [clients, setClients] = useState(initialClients);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = clients.filter(c => {
    const name = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
    const email = `${c.email || ''}`.toLowerCase();
    const q = searchQuery.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bricolage font-bold text-[#18100B] flex items-center">
            <Users className="w-6 h-6 mr-3 text-[#D73E26]" />
            Utilisateurs
            <span className="ml-3 px-2 py-1 bg-[#FCE7DD] text-[#D73E26] text-xs font-bold rounded-lg">
              {filteredClients.length}
            </span>
          </h1>
          <p className="text-sm text-[#6E5B52] mt-1">Gérez tous les clients inscrits sur la plateforme.</p>
        </div>

        <div className="relative w-full sm:w-72">
          <input 
            type="text" 
            placeholder="Rechercher (nom, email)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#EDE5DF] rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-[#D73E26]/50 transition-colors"
          />
          <Search className="w-4 h-4 text-[#9C8B82] absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#EDE5DF] shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-[#F4EFEB]/50 border-b border-[#EDE5DF]">
              <th className="px-6 py-4 text-xs font-semibold text-[#6E5B52] uppercase tracking-wider">Client</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#6E5B52] uppercase tracking-wider">Téléphone</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#6E5B52] uppercase tracking-wider">Date d'inscription</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#6E5B52] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDE5DF]">
            {filteredClients.length > 0 ? filteredClients.map((c, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#6E5B52] font-bricolage font-bold shrink-0">
                      {c.firstName ? c.firstName[0].toUpperCase() : '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1B100C]">{c.firstName} {c.lastName}</p>
                      <p className="text-xs text-[#9C8B82]">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[#1B100C]">{c.phone || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-[#1B100C]">
                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR') : 'Inconnue'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-1.5 text-[#D73E26] hover:bg-[#FCE7DD] rounded-lg transition-colors" title="Suspendre l'utilisateur">
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-[#6E5B52]">
                  Aucun client trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
