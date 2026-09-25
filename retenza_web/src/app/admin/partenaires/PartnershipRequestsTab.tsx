'use client';

import React, { useEffect, useState } from 'react';
import { Search, CheckCircle, XCircle, Clock, RefreshCw, Mail, Phone, MapPin, Building2 } from 'lucide-react';
import Swal from 'sweetalert2';
import {
  getPartnershipRequestsAction,
  approvePartnershipRequestAction,
  rejectPartnershipRequestAction
} from '@/services/adminPartnershipActions';

export default function PartnershipRequestsTab() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED, ALL
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRequests = async () => {
    setIsLoading(true);
    const res = await getPartnershipRequestsAction();
    if (res.success) setRequests(res.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: 'Approuver la demande ?',
      text: `Vous êtes sur le point d'approuver le partenariat pour ${name}. Un email contenant le lien d'activation sera envoyé au commerçant.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#00A896',
      cancelButtonColor: '#9C8B82',
      confirmButtonText: 'Oui, approuver',
      cancelButtonText: 'Annuler',
      customClass: { popup: 'rounded-2xl', title: 'font-bricolage font-bold text-[#1B100C]', confirmButton: 'rounded-xl px-6 py-2.5 font-bold', cancelButton: 'rounded-xl px-6 py-2.5 font-medium' }
    });

    if (!result.isConfirmed) return;

    Swal.fire({ title: 'Traitement en cours...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const res = await approvePartnershipRequestAction(id);
    if (res.success) {
      await fetchRequests();
      Swal.fire({ title: 'Approuvé !', text: res.message, icon: 'success', confirmButtonColor: '#00A896' });
    } else {
      Swal.fire({ title: 'Erreur', text: res.message, icon: 'error', confirmButtonColor: '#D73E26' });
    }
  };

  const handleReject = async (id: string, name: string) => {
    const { value: reason } = await Swal.fire({
      title: 'Refuser la demande',
      text: `Indiquez le motif de refus pour ${name} (envoyé par email) :`,
      input: 'textarea',
      inputPlaceholder: 'Motif du refus...',
      showCancelButton: true,
      confirmButtonColor: '#D73E26',
      cancelButtonColor: '#9C8B82',
      confirmButtonText: 'Refuser définitivement',
      cancelButtonText: 'Annuler',
      customClass: { popup: 'rounded-2xl', title: 'font-bricolage font-bold text-[#1B100C]', confirmButton: 'rounded-xl px-6 py-2.5 font-bold', cancelButton: 'rounded-xl px-6 py-2.5 font-medium', input: 'rounded-xl border-gray-200' }
    });

    if (!reason) return;

    Swal.fire({ title: 'Traitement en cours...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const res = await rejectPartnershipRequestAction(id, reason);
    if (res.success) {
      await fetchRequests();
      Swal.fire({ title: 'Refusé', text: res.message, icon: 'success', confirmButtonColor: '#D73E26' });
    } else {
      Swal.fire({ title: 'Erreur', text: res.message, icon: 'error', confirmButtonColor: '#D73E26' });
    }
  };

  const filtered = requests.filter(r => {
    const matchesFilter = filter === 'ALL' || r.status === filter;
    const matchesSearch = r.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         `${r.ownerFirstName} ${r.ownerLastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (isLoading) {
    return <div className="flex justify-center p-20"><RefreshCw className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une demande..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F5F0EB]/50 border-none rounded-lg py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#D73E26]/20 transition-all placeholder-gray-400 font-medium"
          />
        </div>
        
        <div className="flex bg-[#F5F0EB] p-0.5 rounded-lg w-full sm:w-auto">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-1 sm:flex-none px-3 py-1 rounded text-xs font-bold transition-all ${filter === f ? 'bg-white text-[#1B100C] shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
              {f === 'PENDING' ? 'En attente' : f === 'APPROVED' ? 'Approuvées' : f === 'REJECTED' ? 'Refusées' : 'Toutes'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
          <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h3 className="font-bricolage font-bold text-base text-gray-900">Aucune demande</h3>
          <p className="text-gray-500 text-sm">Il n'y a pas de demande pour ce statut.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <div key={req._id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all duration-200">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-bricolage font-bold text-lg text-gray-900 mb-1">{req.businessName}</h3>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                        {req.category}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                        req.status === 'PENDING' ? 'bg-gray-100 text-gray-700' :
                        req.status === 'APPROVED' ? 'bg-gray-100 text-gray-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {req.status === 'PENDING' ? 'En attente' : req.status === 'APPROVED' ? 'Approuvée' : 'Refusée'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  {req.status === 'PENDING' ? (
                    <>
                      <button onClick={() => handleApprove(req._id, req.businessName)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approuver
                      </button>
                      <button onClick={() => handleReject(req._id, req.businessName)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-red-300 text-red-700 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors">
                        <XCircle className="w-3.5 h-3.5" />
                        Refuser
                      </button>
                    </>
                  ) : (
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {req.status === 'APPROVED' ? '✓ Approuvée' : '✗ Refusée'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(req.reviewedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                {/* Contact Info */}
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Contact Principal</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Building2 className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{req.ownerFirstName} {req.ownerLastName}</p>
                        <p className="text-xs text-gray-500">{req.ownerRole}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Mail className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                      <div>
                        <a href={`mailto:${req.contactEmail}`} className="text-sm font-medium text-[#D73E26] hover:underline">
                          {req.contactEmail}
                        </a>
                      </div>
                    </div>

                    {req.phone && (
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Phone className="w-3.5 h-3.5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{req.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location Info */}
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Localisation</h4>
                  <div className="space-y-2.5">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                        <MapPin className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{req.city}</p>
                        {req.address && (
                          <p className="text-xs text-gray-500 mt-0.5">{req.address}</p>
                        )}
                      </div>
                    </div>

                    {req.message && (
                      <div className="p-3 bg-gray-50 rounded-lg border-l-3 border-gray-300 mt-3">
                        <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Message</h5>
                        <p className="text-sm text-gray-700 leading-relaxed italic">"{req.message}"</p>
                      </div>
                    )}

                    {req.status === 'REJECTED' && req.rejectionReason && (
                      <div className="p-3 bg-red-50 rounded-lg border-l-3 border-red-400 mt-3">
                        <h5 className="text-xs font-medium text-red-700 uppercase tracking-wide mb-1">Motif du refus</h5>
                        <p className="text-sm text-red-700 leading-relaxed">{req.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
