'use client';

import React, { useState } from 'react';
import { Search, Store, MoreVertical, CheckCircle, Ban, Clock, Trash2, Users, FileText } from 'lucide-react';
import { updateCommerceStatus, deleteCommerceAction } from '@/services/adminDashboardActions';
import Swal from 'sweetalert2';
import PartnershipRequestsTab from './PartnershipRequestsTab';


export default function AdminMerchantsContent({ initialCommerces }: { initialCommerces: any[] }) {
  const [commerces, setCommerces] = useState(initialCommerces);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, pending, suspended
  const [activeTab, setActiveTab] = useState<'merchants' | 'requests'>('merchants');


  const filteredCommerces = commerces.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || c.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleStatusChange = async (id: string, action: 'activate' | 'suspend') => {
    const isActivate = action === 'activate';
    
    const result = await Swal.fire({
      title: 'Confirmer l\'action',
      text: `Voulez-vous vraiment ${isActivate ? 'activer' : 'suspendre'} ce partenaire ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: isActivate ? '#00A896' : '#D73E26',
      cancelButtonColor: '#9C8B82',
      confirmButtonText: isActivate ? 'Oui, Activer' : 'Oui, Suspendre',
      cancelButtonText: 'Annuler',
      customClass: {
        popup: 'rounded-2xl',
        title: 'font-bricolage font-bold text-[#1B100C]',
        confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
        cancelButton: 'rounded-xl px-6 py-2.5 font-medium'
      }
    });

    if (!result.isConfirmed) return;
    
    // Optimistic update
    const previousStatus = commerces.find(c => c._id === id)?.status;
    setCommerces(commerces.map(c => c._id === id ? { ...c, status: action === 'activate' ? 'active' : 'suspended' } : c));
    
    const res = await updateCommerceStatus(id, action);
    if (!res?.success) {
      Swal.fire({
        title: 'Erreur',
        text: res?.message || 'Action impossible',
        icon: 'error',
        confirmButtonColor: '#D73E26'
      });
      // Revert
      setCommerces(commerces.map(c => c._id === id ? { ...c, status: previousStatus } : c));
    } else {
      Swal.fire({
        title: 'Succès !',
        text: `Le partenaire a été ${isActivate ? 'activé' : 'suspendu'} avec succès.`,
        icon: 'success',
        confirmButtonColor: '#00A896',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Supprimer le partenaire ?',
      text: "Cette action est irréversible, toutes les données associées seront perdues.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#D73E26',
      cancelButtonColor: '#9C8B82',
      confirmButtonText: 'Oui, supprimer définitivement',
      cancelButtonText: 'Annuler',
      customClass: {
        popup: 'rounded-2xl',
        title: 'font-bricolage font-bold text-[#1B100C]',
        confirmButton: 'rounded-xl px-6 py-2.5 font-bold',
        cancelButton: 'rounded-xl px-6 py-2.5 font-medium'
      }
    });

    if (!result.isConfirmed) return;

    // Optimistic update
    const prevCommerces = [...commerces];
    setCommerces(commerces.filter(c => c._id !== id));

    const res = await deleteCommerceAction(id);
    if (!res?.success) {
      Swal.fire({
        title: 'Erreur',
        text: res?.message || 'Suppression impossible',
        icon: 'error',
        confirmButtonColor: '#D73E26'
      });
      setCommerces(prevCommerces);
    } else {
      Swal.fire({
        title: 'Supprimé !',
        text: 'Le partenaire a été supprimé.',
        icon: 'success',
        confirmButtonColor: '#00A896',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-1 bg-[#E6F4F2] text-[#00A896] text-[10px] font-space font-bold rounded-md">ACTIF</span>;
      case 'pending':
        return <span className="px-2.5 py-1 bg-[#FFF3E0] text-[#E8902A] text-[10px] font-space font-bold rounded-md">EN ATTENTE</span>;
      case 'suspended':
        return <span className="px-2.5 py-1 bg-[#FBE9E7] text-[#D0392A] text-[10px] font-space font-bold rounded-md">SUSPENDU</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-[10px] font-space font-bold rounded-md">INCONNU</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── TABS ── */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('merchants')}
          className={`flex items-center gap-2 px-6 py-4 text-[14px] font-bold transition-all border-b-2 ${
            activeTab === 'merchants' 
              ? 'border-[#0D1117] text-[#0D1117]' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Commerçants Partenaires
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-6 py-4 text-[14px] font-bold transition-all border-b-2 ${
            activeTab === 'requests' 
              ? 'border-[#D73E26] text-[#D73E26]' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Demandes de partenariat
        </button>
      </div>

      {activeTab === 'requests' ? (
        <PartnershipRequestsTab />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un partenaire..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F5F0EB]/50 border-none rounded-xl py-2.5 pl-10 pr-4 text-[13px] outline-none focus:ring-2 focus:ring-[#D73E26]/20 transition-all placeholder-gray-400 font-medium"
              />
            </div>
            
            <div className="flex bg-[#F5F0EB] p-1 rounded-xl w-full sm:w-auto">
              {[
                { id: 'all', label: 'Tous' },
                { id: 'active', label: 'Actifs' },
                { id: 'pending', label: 'En attente' },
                { id: 'suspended', label: 'Suspendus' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all ${
                    filter === f.id ? 'bg-white text-[#1B100C] shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#F4EFEB]/50 border-b border-[#EDE5DF]">
                  <th className="px-6 py-4 text-xs font-semibold text-[#6E5B52] uppercase tracking-wider">Commerce</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#6E5B52] uppercase tracking-wider">Catégorie</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#6E5B52] uppercase tracking-wider">Ville</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#6E5B52] uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-xs font-semibold text-[#6E5B52] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE5DF]">
                {filteredCommerces.length > 0 ? filteredCommerces.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FCE7DD] flex items-center justify-center text-[#D73E26] font-bricolage font-bold shrink-0">
                          {c.name?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div>
                          <p className="font-semibold text-[#1B100C]">{c.name}</p>
                          <p className="text-xs text-[#9C8B82]">{c.merchantCode || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1B100C]">{c.category || 'Non spécifié'}</td>
                    <td className="px-6 py-4 text-sm text-[#1B100C]">{c.contact?.city || 'Non spécifié'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.status === 'active' && (
                          <button 
                            onClick={() => handleStatusChange(c._id, 'suspend')}
                            className="p-1.5 text-[#00A896] hover:bg-[#E6F4F2] rounded-lg transition-colors"
                            title="Cliquez pour Suspendre"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {c.status === 'suspended' && (
                          <button 
                            onClick={() => handleStatusChange(c._id, 'activate')}
                            className="p-1.5 text-[#D0392A] hover:bg-[#FBE9E7] rounded-lg transition-colors"
                            title="Cliquez pour Activer"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        {c.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleStatusChange(c._id, 'activate')}
                              className="p-1.5 text-[#00A896] hover:bg-[#E6F4F2] rounded-lg transition-colors"
                              title="Activer"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleStatusChange(c._id, 'suspend')}
                              className="p-1.5 text-[#D0392A] hover:bg-[#FBE9E7] rounded-lg transition-colors"
                              title="Refuser/Suspendre"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => handleDelete(c._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#6E5B52]">
                      Aucun partenaire ne correspond à vos critères.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {filteredCommerces.length === 0 && (
              <div className="py-12 text-center text-gray-500 bg-gray-50">
                <Store className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                <p className="text-[14px] font-medium">Aucun partenaire trouvé</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
