'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store, Star, Clock, ArrowRight, ArrowLeft, CheckCircle2,
  Image as ImageIcon, Link2, Palette, Zap, Gift, Stamp, Percent, UploadCloud,
} from 'lucide-react';
import { completeOnboardingAction } from '@/services/authActions';

type Step = 1 | 2 | 3;
type LoyaltyType = 'points' | 'stamps' | 'cashback';

const DAYS = [
  { key: 'monday',    label: 'Lundi' },
  { key: 'tuesday',   label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday',  label: 'Jeudi' },
  { key: 'friday',    label: 'Vendredi' },
  { key: 'saturday',  label: 'Samedi' },
  { key: 'sunday',    label: 'Dimanche' },
];

const DEFAULT_HOURS = DAYS.map((d, i) => ({
  day: d.key, open: '09:00', close: '18:00', isClosed: i === 6,
}));

const STEPS = [
  { n: 1, label: 'Votre commerce',  icon: Store,  desc: 'Profil & coordonnées' },
  { n: 2, label: 'Programme fidélité', icon: Star, desc: 'Récompensez vos clients' },
  { n: 3, label: 'Horaires',         icon: Clock, desc: 'Jours & heures' },
];

export default function MerchantOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [services, setServices] = useState<string[]>([]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        setLogoUrl(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 2
  const [loyaltyType, setLoyaltyType] = useState<LoyaltyType>('points');
  const [pointsPerEuro, setPointsPerEuro] = useState(10);
  const [amountPerPoints, setAmountPerPoints] = useState(100);
  const [rewardThreshold, setRewardThreshold] = useState(500);
  const [stampsRequired, setStampsRequired] = useState(10);
  const [cashbackPercentage, setCashbackPercentage] = useState(5);
  const [rewardName, setRewardName] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');

  // Step 3
  const [openingHours, setOpeningHours] = useState(DEFAULT_HOURS);
  const updateHour = (day: string, field: string, value: string | boolean) =>
    setOpeningHours(prev => prev.map(h => h.day === day ? { ...h, [field]: value } : h));

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMsg('');
    const res = await completeOnboardingAction({
      description, logoUrl, services,
      openingHours, loyaltyType,
      pointsPerEuro, amountPerPoints, rewardThreshold,
      stampsRequired, cashbackPercentage,
      rewardName, rewardDescription,
    });
    setIsLoading(false);
    if (res.success) router.push('/merchant');
    else setErrorMsg(res.message);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F5F4F2] flex items-start justify-center py-10 px-6">
      <div className="w-full max-w-2xl">

        {/* ── En-tête de bienvenue ── */}
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0D1117] text-white text-[11px] font-bold uppercase tracking-widest mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D73E26] animate-pulse" />
            Configuration initiale
          </span>
          <h1 className="font-bricolage text-[34px] font-extrabold text-[#0D1117] leading-[1.1] mb-3">
            Bienvenue sur Retenza&nbsp;Connect&nbsp;🎉
          </h1>
          <p className="text-slate-500 text-[14px] max-w-md mx-auto leading-relaxed">
            Quelques informations pour personnaliser votre espace et démarrer avec vos clients.
          </p>
        </div>

        {/* ── Stepper ── */}
        <div className="flex items-center mb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isDone = step > s.n;
            const isActive = step === s.n;
            return (
              <div key={s.n} className="flex items-center flex-1 last:flex-none">
                <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all ${
                  isActive ? 'bg-[#0D1117] shadow-lg shadow-black/20' :
                  isDone   ? 'bg-white border border-slate-200' :
                  'bg-white/60 border border-slate-100'
                }`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-white/15' :
                    isDone   ? 'bg-[#D73E26]/10' :
                    'bg-slate-100'
                  }`}>
                    {isDone
                      ? <CheckCircle2 className="w-4 h-4 text-[#D73E26]" />
                      : <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    }
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-[12px] font-bold leading-none mb-0.5 ${isActive ? 'text-white' : isDone ? 'text-slate-600' : 'text-slate-400'}`}>
                      {s.label}
                    </p>
                    <p className={`text-[10px] ${isActive ? 'text-white/50' : 'text-slate-400'}`}>{s.desc}</p>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-2 rounded-full transition-all duration-500 ${isDone ? 'bg-[#D73E26]' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Carte principale ── */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">

          {/* Barre de progression */}
          <div className="h-[3px] bg-slate-100">
            <div className="h-full bg-gradient-to-r from-[#D73E26] to-[#E85538] transition-all duration-700 ease-out"
              style={{ width: `${(step / 3) * 100}%` }} />
          </div>

          <div className="p-8 md:p-10">

            {/* Titre de l'étape */}
            <div className="mb-8">
              <p className="text-[11px] font-bold text-[#D73E26] uppercase tracking-widest mb-2">
                Étape {step} / 3
              </p>
              <h2 className="font-bricolage text-[24px] font-extrabold text-[#0D1117] mb-1">
                {step === 1 && 'Profil de votre commerce'}
                {step === 2 && 'Programme de fidélité'}
                {step === 3 && "Horaires d'ouverture"}
              </h2>
              <p className="text-[13px] text-slate-400">
                {step === 1 && "Ces informations apparaissent dans l'application Retenza client."}
                {step === 2 && 'Choisissez comment récompenser vos clients fidèles.'}
                {step === 3 && 'Définissez vos jours et horaires d\'ouverture.'}
              </p>
            </div>

            {/* ── ÉTAPE 1 ── */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-200">

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Description</label>
                  <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Décrivez votre commerce, vos spécialités, votre ambiance..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-800 outline-none focus:border-slate-400 transition-colors resize-none placeholder:text-slate-300 bg-[#FAFAFA]" />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Logo de votre commerce</label>
                  <label className="relative flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-200 hover:border-[#D73E26] hover:bg-[#FFF7F5] rounded-2xl cursor-pointer transition-all overflow-hidden group">
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    {logoPreview ? (
                      <div className="absolute inset-0">
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-2" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-[13px] font-semibold">Changer l'image</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors shadow-sm">
                          <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-[#D73E26] transition-colors" />
                        </div>
                        <p className="text-[13px] font-semibold text-slate-600">Cliquez pour importer votre logo</p>
                        <p className="text-[11px] text-slate-400">PNG, JPG jusqu'à 5MB</p>
                      </div>
                    )}
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Services proposés</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      'Livraison', 'Réservation', 
                      'Commande en ligne', 'Vente en magasin', 
                      'Service à domicile', 'Prise de rendez-vous'
                    ].map(service => (
                      <button 
                        key={service} 
                        type="button" 
                        onClick={() => {
                          setServices(prev => 
                            prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
                          )
                        }}
                        className={`py-2.5 px-3 rounded-xl border text-[13px] font-semibold transition-all ${
                          services.includes(service) 
                            ? 'bg-[#0D1117] text-white border-[#0D1117]' 
                            : 'bg-[#FAFAFA] text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── ÉTAPE 2 ── */}
            {step === 2 && (
              <div className="space-y-8 animate-in fade-in duration-200">

                {/* Sélecteur type */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'points',   Icon: Zap,     label: 'Points',   desc: 'Pts par achat' },
                    { id: 'stamps',   Icon: Stamp,   label: 'Tampons',  desc: 'Carte cadeau' },
                    { id: 'cashback', Icon: Percent, label: 'Cashback', desc: 'Remboursement' },
                  ].map(({ id, Icon, label, desc }) => (
                    <button key={id} type="button" onClick={() => setLoyaltyType(id as LoyaltyType)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        loyaltyType === id
                          ? 'border-[#0D1117] bg-[#0D1117]'
                          : 'border-slate-200 bg-[#FAFAFA] hover:border-slate-300'
                      }`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${loyaltyType === id ? 'bg-white/15' : 'bg-white border border-slate-200'}`}>
                        <Icon className={`w-4 h-4 ${loyaltyType === id ? 'text-white' : 'text-slate-500'}`} />
                      </div>
                      <p className={`text-[13px] font-bold mb-0.5 ${loyaltyType === id ? 'text-white' : 'text-slate-700'}`}>{label}</p>
                      <p className={`text-[11px] ${loyaltyType === id ? 'text-white/50' : 'text-slate-400'}`}>{desc}</p>
                    </button>
                  ))}
                </div>

                {/* Config Points */}
                {loyaltyType === 'points' && (
                  <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-slate-200 space-y-5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Configuration des points</p>
                    <div className="grid grid-cols-3 gap-5">
                      {[
                        { label: 'Points / DT', value: pointsPerEuro, set: setPointsPerEuro, hint: 'Points par dinar dépensé' },
                        { label: 'Seuil récompense', value: rewardThreshold, set: setRewardThreshold, hint: 'Points pour la récompense' },
                        { label: 'DT / 100 pts', value: amountPerPoints, set: setAmountPerPoints, hint: 'Valeur de 100 points' },
                      ].map(({ label, value, set, hint }) => (
                        <div key={label}>
                          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">{label}</label>
                          <input type="number" min={1} value={value} onChange={e => set(+e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[15px] font-bold text-slate-800 outline-none focus:border-slate-400 bg-white transition-colors" />
                          <p className="text-[10px] text-slate-400 mt-1">{hint}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Config Tampons */}
                {loyaltyType === 'stamps' && (
                  <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-slate-200 space-y-4">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tampons requis</p>
                    <div className="max-w-[160px]">
                      <input type="number" min={2} max={20} value={stampsRequired} onChange={e => setStampsRequired(+e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[20px] font-extrabold text-center text-slate-800 outline-none focus:border-slate-400 bg-white transition-colors" />
                    </div>
                    <div className="flex gap-2 flex-wrap pt-1">
                      {Array.from({ length: Math.min(stampsRequired, 12) }).map((_, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-[#0D1117] flex items-center justify-center">
                          <Stamp className="w-3.5 h-3.5 text-white" />
                        </div>
                      ))}
                      {stampsRequired > 12 && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          +{stampsRequired - 12}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Config Cashback */}
                {loyaltyType === 'cashback' && (
                  <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-slate-200 space-y-3">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Taux de cashback</p>
                    <div className="flex items-end gap-3">
                      <input type="number" min={1} max={50} value={cashbackPercentage} onChange={e => setCashbackPercentage(+e.target.value)}
                        className="w-28 border border-slate-200 rounded-xl px-4 py-3 text-[24px] font-extrabold text-center text-slate-800 outline-none focus:border-slate-400 bg-white transition-colors" />
                      <span className="text-[24px] font-extrabold text-slate-300 mb-3">%</span>
                    </div>
                    <p className="text-[12px] text-slate-400">Chaque client récupère {cashbackPercentage}% de son achat en crédit Retenza.</p>
                  </div>
                )}

                {/* Récompense */}
                <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-slate-200 space-y-4">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Gift className="w-3.5 h-3.5" /> Récompense offerte
                  </p>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Nom</label>
                      <input type="text" value={rewardName} onChange={e => setRewardName(e.target.value)}
                        placeholder="Ex : Café offert"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] text-slate-800 outline-none focus:border-slate-400 bg-white transition-colors placeholder:text-slate-300" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                      <input type="text" value={rewardDescription} onChange={e => setRewardDescription(e.target.value)}
                        placeholder="Ex : 1 café de votre choix"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] text-slate-800 outline-none focus:border-slate-400 bg-white transition-colors placeholder:text-slate-300" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── ÉTAPE 3 ── */}
            {step === 3 && (
              <div className="space-y-1 animate-in fade-in duration-200">
                {DAYS.map(d => {
                  const h = openingHours.find(o => o.day === d.key)!;
                  return (
                    <div key={d.key} className={`flex items-center gap-4 py-3.5 px-4 rounded-2xl transition-all ${h.isClosed ? 'opacity-50 hover:opacity-70' : 'hover:bg-slate-50'}`}>
                      <span className="w-24 text-[13px] font-semibold text-slate-600 shrink-0">{d.label}</span>

                      {/* Toggle */}
                      <button type="button" onClick={() => updateHour(d.key, 'isClosed', !h.isClosed)}
                        className={`relative w-9 h-5 rounded-full transition-all duration-200 shrink-0 ${!h.isClosed ? 'bg-[#0D1117]' : 'bg-slate-200'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${!h.isClosed ? 'translate-x-4' : ''}`} />
                      </button>

                      {!h.isClosed ? (
                        <div className="flex items-center gap-3 flex-1">
                          <input type="time" value={h.open} onChange={e => updateHour(d.key, 'open', e.target.value)}
                            className="text-[13px] font-semibold text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-slate-400 bg-[#FAFAFA] w-[100px] transition-colors" />
                          <span className="text-slate-300 text-[12px] font-light">→</span>
                          <input type="time" value={h.close} onChange={e => updateHour(d.key, 'close', e.target.value)}
                            className="text-[13px] font-semibold text-slate-700 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-slate-400 bg-[#FAFAFA] w-[100px] transition-colors" />
                        </div>
                      ) : (
                        <span className="flex-1 text-[12px] text-slate-300 italic">Fermé</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Erreur */}
            {errorMsg && (
              <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-[13px] text-red-600 font-medium">
                {errorMsg}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100">
              {step > 1 ? (
                <button type="button" onClick={() => setStep(s => (s - 1) as Step)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-all">
                  <ArrowLeft className="w-4 h-4" /> Retour
                </button>
              ) : <div />}

              {step < 3 ? (
                <button type="button" onClick={() => setStep(s => (s + 1) as Step)}
                  className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[#0D1117] text-white text-[13px] font-bold hover:bg-black transition-all shadow-lg shadow-black/10">
                  Continuer <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={isLoading}
                  className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[#D73E26] text-white text-[13px] font-bold hover:bg-[#B93320] transition-all shadow-lg shadow-[#D73E26]/20 disabled:opacity-60">
                  {isLoading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><CheckCircle2 className="w-4 h-4" /> Accéder à mon espace</>
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
