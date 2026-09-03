'use client';

import React, { useState } from 'react';
import { 
  Gift, Save, CheckCircle2, AlertCircle,
  Star, Stamp, Percent, ChevronRight, Info
} from 'lucide-react';
import { updateMerchantLoyaltyProgram } from '@/services/merchantDashboardActions';

type ProgramType = 'points' | 'stamps' | 'cashback';

export default function MerchantProgramContent({ initialProgram }: { initialProgram: any }) {
  const [loading, setLoading]     = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg]   = useState('');

  const [type, setType] = useState<ProgramType>(initialProgram?.type || 'points');

  const [pointsPerEuro, setPointsPerEuro]         = useState(initialProgram?.pointsPerEuro?.toString()         || '10');
  const [pointsForReward, setPointsForReward]     = useState(initialProgram?.pointsForReward?.toString()       || '100');
  const [stampsRequired, setStampsRequired]       = useState(initialProgram?.stampsRequired?.toString()       || '10');
  const [cashbackPercentage, setCashbackPercentage] = useState(initialProgram?.cashbackPercentage?.toString() || '5');
  const [rewardDescription, setRewardDescription] = useState(initialProgram?.rewardDescription || '');

  /* ── Validation ── */
  const validate = (): string | null => {
    if (type === 'points') {
      if (!pointsPerEuro || parseFloat(pointsPerEuro) <= 0) return 'Le taux de points doit être supérieur à 0.';
      if (!pointsForReward || parseInt(pointsForReward) <= 0) return 'Le seuil de points doit être supérieur à 0.';
    }
    if (type === 'stamps') {
      if (!stampsRequired || parseInt(stampsRequired) < 2) return 'Le nombre de tampons doit être au moins 2.';
    }
    if (type === 'cashback') {
      const pct = parseFloat(cashbackPercentage);
      if (!cashbackPercentage || pct <= 0 || pct > 50) return 'Le cashback doit être entre 0 % et 50 %.';
    }
    if (!rewardDescription.trim()) return 'Veuillez décrire la récompense.';
    return null;
  };

  const handleSave = async () => {
    setSuccessMsg('');
    setErrorMsg('');

    const err = validate();
    if (err) { setErrorMsg(err); return; }

    setLoading(true);

    let payload: Record<string, any> = { rewardDescription: rewardDescription.trim() };
    if (type === 'points')   Object.assign(payload, { pointsPerEuro: parseFloat(pointsPerEuro), pointsForReward: parseInt(pointsForReward) });
    if (type === 'stamps')   Object.assign(payload, { stampsRequired: parseInt(stampsRequired) });
    if (type === 'cashback') Object.assign(payload, { cashbackPercentage: parseFloat(cashbackPercentage) });

    const res = await updateMerchantLoyaltyProgram(type, payload);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Programme mis à jour avec succès.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(res.message || 'Une erreur est survenue. Réessayez.');
    }
  };

  /* ── Program types definition ── */
  const programTypes = [
    {
      id: 'points' as ProgramType,
      label: 'Points',
      desc: 'Le client cumule des points à chaque achat et les échange contre une récompense.',
      icon: <Star className="w-5 h-5" />,
    },
    {
      id: 'stamps' as ProgramType,
      label: 'Tampons',
      desc: 'Après X passages, le client reçoit automatiquement une récompense.',
      icon: <Stamp className="w-5 h-5" />,
    },
    {
      id: 'cashback' as ProgramType,
      label: 'Cashback',
      desc: 'Un pourcentage de chaque achat est crédité en cagnotte client.',
      icon: <Percent className="w-5 h-5" />,
    },
  ];

  return (
    <div className="h-full flex flex-col">

      {/* ── Page header ── */}
      <div className="flex items-end justify-between mb-8 pt-2">
        <div>
          <h1 className="text-[22px] font-bricolage font-bold text-[#1B100C]">Programme de fidélité</h1>
          <p className="text-[13px] text-[#5D534F] mt-0.5">Configurez les règles de récompense pour vos clients.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#D73E26] hover:bg-[#C0321C] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-sm shadow-[#D73E26]/20 disabled:opacity-60"
        >
          <Save className="w-3.5 h-3.5" />
          {loading ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      </div>

      {/* Feedback banners */}
      {successMsg && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-[13px] font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[13px] font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 flex-1">

        {/* ── LEFT: Form ── */}
        <div className="flex-1 flex flex-col gap-6">

          {/* Type selector */}
          <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
              <h2 className="text-[13px] font-bold text-[#1B100C]">Type de programme</h2>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {programTypes.map((pt) => (
                <button
                  key={pt.id}
                  onClick={() => { setType(pt.id); setErrorMsg(''); }}
                  className={`relative flex flex-col gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    type === pt.id
                      ? 'border-[#D73E26] bg-[#FFF5F2]'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    type === pt.id ? 'bg-[#D73E26] text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {pt.icon}
                  </div>
                  <div>
                    <p className={`text-[14px] font-bold mb-0.5 ${type === pt.id ? 'text-[#D73E26]' : 'text-[#1B100C]'}`}>
                      {pt.label}
                    </p>
                    <p className="text-[12px] text-[#5D534F] leading-snug">{pt.desc}</p>
                  </div>
                  {type === pt.id && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#D73E26] flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic params */}
          <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
              <h2 className="text-[13px] font-bold text-[#1B100C]">Paramètres du programme</h2>
            </div>
            <div className="p-6 space-y-6">

              {/* POINTS fields */}
              {type === 'points' && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-[12px] font-bold text-[#5D534F] mb-2 uppercase tracking-widest">Points par euro dépensé</label>
                      <div className="flex items-center gap-3">
                        <span className="text-[13px] font-medium text-[#5D534F] whitespace-nowrap">1 € =</span>
                        <input
                          type="number"
                          min="1"
                          value={pointsPerEuro}
                          onChange={(e) => setPointsPerEuro(e.target.value)}
                          className="w-24 text-center text-[16px] font-bold bg-gray-50 border border-gray-200 rounded-xl py-2.5 outline-none focus:border-[#D73E26] focus:ring-2 focus:ring-[#D73E26]/10 transition-all"
                        />
                        <span className="text-[13px] font-bold text-[#D73E26]">pts</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-[12px] font-bold text-[#5D534F] mb-2 uppercase tracking-widest">Seuil de récompense</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          value={pointsForReward}
                          onChange={(e) => setPointsForReward(e.target.value)}
                          className="w-24 text-center text-[16px] font-bold bg-gray-50 border border-gray-200 rounded-xl py-2.5 outline-none focus:border-[#D73E26] focus:ring-2 focus:ring-[#D73E26]/10 transition-all"
                        />
                        <span className="text-[13px] font-bold text-[#D73E26]">pts = 1 récompense</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* STAMPS fields */}
              {type === 'stamps' && (
                <div>
                  <label className="block text-[12px] font-bold text-[#5D534F] mb-2 uppercase tracking-widest">Nombre de tampons pour une récompense</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="2"
                      max="30"
                      value={stampsRequired}
                      onChange={(e) => setStampsRequired(e.target.value)}
                      className="w-24 text-center text-[16px] font-bold bg-gray-50 border border-gray-200 rounded-xl py-2.5 outline-none focus:border-[#D73E26] focus:ring-2 focus:ring-[#D73E26]/10 transition-all"
                    />
                    <span className="text-[13px] font-medium text-[#5D534F]">tampons = 1 récompense</span>
                  </div>
                  {/* Visual stamps preview */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Array.from({ length: Math.min(parseInt(stampsRequired) || 10, 20) }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${
                          i < Math.ceil((parseInt(stampsRequired) || 10) * 0.6)
                            ? 'border-[#D73E26] bg-[#FFF5F2] text-[#D73E26]'
                            : 'border-gray-200 bg-gray-50 text-gray-300'
                        }`}
                      >
                        {i + 1}
                      </div>
                    ))}
                    {parseInt(stampsRequired) > 20 && (
                      <span className="text-[12px] text-gray-400 self-center">+{parseInt(stampsRequired) - 20}</span>
                    )}
                  </div>
                </div>
              )}

              {/* CASHBACK fields */}
              {type === 'cashback' && (
                <div>
                  <label className="block text-[12px] font-bold text-[#5D534F] mb-2 uppercase tracking-widest">Pourcentage reversé en cagnotte</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0.5"
                      max="50"
                      step="0.5"
                      value={cashbackPercentage}
                      onChange={(e) => setCashbackPercentage(e.target.value)}
                      className="w-24 text-center text-[16px] font-bold bg-gray-50 border border-gray-200 rounded-xl py-2.5 outline-none focus:border-[#D73E26] focus:ring-2 focus:ring-[#D73E26]/10 transition-all"
                    />
                    <span className="text-[13px] font-bold text-[#D73E26]">% de chaque achat</span>
                  </div>
                  <p className="mt-2 text-[12px] text-[#5D534F] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Exemple : pour un achat de 50 €, le client reçoit {((parseFloat(cashbackPercentage) || 5) * 0.5).toFixed(2)} € en cagnotte.
                  </p>
                </div>
              )}

              {/* Reward description (always shown) */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-[12px] font-bold text-[#5D534F] mb-2 uppercase tracking-widest">Description de la récompense</label>
                <input
                  type="text"
                  value={rewardDescription}
                  onChange={(e) => setRewardDescription(e.target.value)}
                  placeholder="Ex : 1 café offert, -10 % sur l'addition…"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] text-[#1B100C] outline-none focus:border-[#D73E26] focus:ring-2 focus:ring-[#D73E26]/10 transition-all"
                />
                <p className="mt-1.5 text-[12px] text-gray-400">Ce texte s'affiche dans l'application client.</p>
              </div>

            </div>
          </div>
        </div>

        {/* ── RIGHT: Live Preview ── */}
        <div className="w-full lg:w-[320px] shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden sticky top-6">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
              <h2 className="text-[13px] font-bold text-[#1B100C]">Aperçu client</h2>
              <p className="text-[11px] text-[#5D534F] mt-0.5">Comme affiché dans l'application</p>
            </div>
            <div className="p-5">
              {/* Phone notification style */}
              <div className="bg-[#F0EDE8]/50 rounded-xl p-4 border border-white shadow-inner">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#D73E26] flex items-center justify-center text-white font-bold text-[14px]">R</div>
                  <div>
                    <p className="text-[13px] font-bold text-[#1B100C]">Votre programme</p>
                    <p className="text-[11px] text-[#5D534F]">Retenza Fidélité</p>
                  </div>
                </div>

                {type === 'points' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] text-[#5D534F]">Vos points</span>
                      <span className="text-[18px] font-bricolage font-bold text-[#1B100C]">350 <span className="text-[12px] text-[#D73E26] font-bold">pts</span></span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="h-2 bg-[#D73E26] rounded-full" style={{ width: `${Math.min(350 / (parseInt(pointsForReward) || 100) * 100, 100)}%` }} />
                    </div>
                    <p className="text-[11px] text-[#5D534F]">{Math.max(0, (parseInt(pointsForReward) || 100) - 350)} pts restants avant : <strong className="text-[#1B100C]">{rewardDescription || 'votre récompense'}</strong></p>
                  </div>
                )}

                {type === 'stamps' && (
                  <div className="space-y-3">
                    <p className="text-[12px] text-[#5D534F]">Votre carte tampons</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: Math.min(parseInt(stampsRequired) || 10, 12) }).map((_, i) => (
                        <div key={i} className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${
                          i < 4 ? 'border-[#D73E26] bg-[#D73E26] text-white' : 'border-gray-200 bg-gray-50 text-gray-300'
                        }`}>✓</div>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#5D534F]">4 / {stampsRequired} — récompense : <strong className="text-[#1B100C]">{rewardDescription || '…'}</strong></p>
                  </div>
                )}

                {type === 'cashback' && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[12px] text-[#5D534F]">Cagnotte disponible</span>
                      <span className="text-[18px] font-bricolage font-bold text-[#1B100C]">4,20 €</span>
                    </div>
                    <p className="text-[11px] text-[#5D534F]">+{cashbackPercentage}% sur chaque achat • Récompense : <strong className="text-[#1B100C]">{rewardDescription || '…'}</strong></p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
