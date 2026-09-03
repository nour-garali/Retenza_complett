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

  const filtered = requests.filter(r => filter === 'ALL' || r.status === filter);

  if (isLoading) {
    return <div className="flex justify-center p-20"><RefreshCw className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-bricolage text-[#0D1117]">Demandes de Partenariat</h2>
        <div className="flex gap-2 bg-white border border-gray-200 rounded-xl p-1">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all ${filter === f ? 'bg-[#0D1117] text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
              {f === 'PENDING' ? 'En attente' : f === 'APPROVED' ? 'Approuvées' : f === 'REJECTED' ? 'Refusées' : 'Toutes'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-gray-100">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-bricolage font-bold text-lg text-[#1B100C]">Aucune demande</h3>
          <p className="text-gray-500 text-[14px]">Il n'y a pas de demande pour ce statut.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(req => (
            <div key={req._id} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col lg:flex-row gap-6 shadow-sm hover:shadow-md transition-shadow">
              {/* Info Commerce */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bricolage font-extrabold text-[20px] text-[#0D1117]">{req.businessName}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      req.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                      req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-[13px] font-semibold text-[#D73E26]">{req.category}</p>
                </div>

                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  <div className="flex items-center gap-2 text-[13px] text-gray-600">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{req.ownerFirstName} {req.ownerLastName} ({req.ownerRole})</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{req.city} {req.address ? `- ${req.address}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${req.contactEmail}`} className="text-[#D73E26] hover:underline">{req.contactEmail}</a>
                  </div>
                  {req.phone && (
                    <div className="flex items-center gap-2 text-[13px] text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{req.phone}</span>
                    </div>
                  )}
                </div>

                {req.message && (
                  <div className="p-3 bg-gray-50 rounded-xl text-[13px] text-gray-700 italic border border-gray-100">
                    "{req.message}"
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end lg:w-48 lg:border-l lg:border-gray-100 lg:pl-6">
                {req.status === 'PENDING' ? (
                  <div className="flex flex-col gap-2 w-full">
                    <button onClick={() => handleApprove(req._id, req.businessName)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#00A896] hover:bg-[#009080] text-white rounded-xl text-[13px] font-bold transition-colors">
                      <CheckCircle className="w-4 h-4" /> Approuver
                    </button>
                    <button onClick={() => handleReject(req._id, req.businessName)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-[13px] font-bold transition-colors">
                      <XCircle className="w-4 h-4" /> Refuser
                    </button>
                  </div>
                ) : (
                  <div className="text-right text-[12px] text-gray-500 w-full">
                    <p className="font-bold text-[#0D1117] mb-1">
                      {req.status === 'APPROVED' ? 'Demande approuvée' : 'Demande refusée'}
                    </p>
                    <p>Le {new Date(req.reviewedAt).toLocaleDateString('fr-FR')}</p>
                    <p className="mt-1">Par : {req.reviewedBy?.firstName} {req.reviewedBy?.lastName}</p>
                    {req.status === 'REJECTED' && req.rejectionReason && (
                      <p className="mt-2 text-red-600 italic">Motif : {req.rejectionReason}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
