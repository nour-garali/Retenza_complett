'use client';

import { useState } from 'react';
import {
  Store, User, ChevronDown, CheckCircle, ArrowRight, ArrowLeft,
  Mail, Phone, Globe, MapPin, Building2, Users, Layers, Send
} from 'lucide-react';
import { submitPartnershipRequestAction, checkPartnershipEmailAction, resendActivationAction } from '@/services/authActions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  'Restaurant / Café', 'Boulangerie / Pâtisserie', 'Mode & Accessoires',
  'Beauté & Bien-être', 'Épicerie / Alimentation', 'Pharmacie',
  'Sport & Loisirs', 'Services', 'Technologie', 'Autre',
];

const LOYALTY_TYPES = [
  { value: 'points',   label: 'Points',   desc: 'Le client cumule des points à chaque achat' },
  { value: 'stamps',   label: 'Tampons',  desc: 'Carte à tamponner — ex: 10 cafés = 1 gratuit' },
  { value: 'cashback', label: 'Cashback', desc: 'Remboursement d\'un % du montant dépensé' },
  { value: 'unknown',  label: 'Je ne sais pas encore', desc: 'Notre équipe vous conseillera' },
];

type Step = 1 | 2 | 3;

export default function RegisterMerchantPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [emailStatus, setEmailStatus] = useState<{ code: string; message: string } | null>(null);

  // Step 1 — Commerce
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [website, setWebsite] = useState('');

  // Step 2 — Responsable
  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');
  const [ownerRole, setOwnerRole] = useState('Gérant');
  const [ownerPhone, setOwnerPhone] = useState('');

  // Step 3 — Complémentaires
  const [numberOfLocations, setNumberOfLocations] = useState(1);
  const [loyaltyProgramType, setLoyaltyProgramType] = useState('unknown');
  const [message, setMessage] = useState('');
  const [acceptCGU, setAcceptCGU] = useState(false);

  const validateStep = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!businessName.trim() || !category || !contactEmail.trim() || !city.trim()) {
        setErrorMsg('Veuillez remplir les champs obligatoires : nom, catégorie, email et ville.');
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail)) {
        setErrorMsg('Adresse email invalide.');
        return false;
      }
    }
    if (step === 2) {
      if (!ownerFirstName.trim() || !ownerLastName.trim()) {
        setErrorMsg('Veuillez renseigner le prénom et le nom du responsable.');
        return false;
      }
    }
    if (step === 3) {
      if (!acceptCGU) {
        setErrorMsg('Vous devez accepter les conditions générales d\'utilisation.');
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    // ── Vérification email dès l'étape 1 — avant de passer à l'étape 2 ──
    if (step === 1) {
      setIsCheckingEmail(true);
      setEmailStatus(null);
      const check = await checkPartnershipEmailAction(contactEmail);
      setIsCheckingEmail(false);
      if (!check.available) {
        setEmailStatus({ code: check.code!, message: check.message });
        return; // Bloquer la progression
      }
    }

    setStep((s) => (s < 3 ? (s + 1) as Step : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    setIsLoading(true);
    const res = await submitPartnershipRequestAction({
      businessName, category, address, city, phone, contactEmail, website,
      ownerFirstName, ownerLastName, ownerRole, ownerPhone,
      numberOfLocations, loyaltyProgramType, message,
    });
    setIsLoading(false);

    if (res.success) {
      router.push('/register/merchant/demande-envoyee');
    } else {
      setErrorMsg(res.message);
    }
  };

  const steps = ['Commerce', 'Responsable', 'Finaliser'];

  return (
    <div className="min-h-screen flex font-inter">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-[42%] flex-col relative overflow-hidden bg-[#0D1117]">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#D73E26]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#D73E26]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 flex flex-col h-full p-10">
          <Link href="/" className="flex items-center gap-3 mb-16">
            <img src="/retenza-icon.png" alt="Retenza" className="h-10 w-10 object-contain drop-shadow-md" />
            <span className="font-bricolage font-bold text-xl text-white">Retenza Connect</span>
          </Link>

          <div className="flex-1 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white/80 rounded-full text-[11px] font-bold tracking-widest w-fit mb-6 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D73E26] animate-pulse" />
              DEVENIR PARTENAIRE
            </div>

            <h1 className="font-bricolage text-[36px] font-extrabold leading-[1.1] text-white tracking-tight mb-5">
              Rejoignez<br />le réseau<br />
              <span className="text-[#D73E26]">Retenza.</span>
            </h1>

            <p className="text-white/50 text-[14px] leading-relaxed mb-10 max-w-[300px]">
              Soumettez votre demande de partenariat. Notre équipe l'examine et vous contacte sous 48h.
            </p>

            {/* Comment ça marche */}
            <div className="space-y-4">
              {[
                { n: '1', t: 'Remplissez la demande', d: 'Informations du commerce et du responsable' },
                { n: '2', t: 'Validation par Retenza', d: 'Notre équipe examine votre profil' },
                { n: '3', t: 'Activation du compte', d: 'Créez votre mot de passe par email' },
                { n: '4', t: 'Accès au Dashboard', d: 'Gérez votre programme de fidélité' },
              ].map((item) => (
                <div key={item.n} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#D73E26] flex items-center justify-center shrink-0 text-white text-[11px] font-bold mt-0.5">
                    {item.n}
                  </div>
                  <div>
                    <p className="text-white/80 text-[13px] font-semibold">{item.t}</p>
                    <p className="text-white/40 text-[11px]">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-6 pt-8 border-t border-white/10">
            {[{ value: '12K+', label: 'Commerçants' }, { value: '850K+', label: 'Clients fidèles' }, { value: '4.9★', label: 'Note moyenne' }].map((s) => (
              <div key={s.label}>
                <p className="text-white font-bricolage font-bold text-[22px]">{s.value}</p>
                <p className="text-white/40 text-[11px] font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 bg-[#FAFAFA] flex flex-col">

        {/* Top bar */}
        <div className="flex items-center justify-between py-5 px-8 border-b border-gray-100 bg-white">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 bg-[#D73E26] rounded-lg flex items-center justify-center">
              <span className="text-white font-bricolage font-bold text-sm">R</span>
            </div>
            <span className="font-bricolage font-bold text-base text-[#1B100C]">Retenza Connect</span>
          </Link>
          <span className="hidden lg:block text-[13px] text-[#9C8B82] font-medium">Demande de partenariat</span>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-[#5D534F] hidden sm:inline">Déjà partenaire ?</span>
            <Link href="/login" className="px-5 py-2 rounded-xl bg-[#0D1117] text-white font-semibold text-[13px] hover:bg-black transition-colors shadow-sm">
              Se connecter
            </Link>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-8 pt-6 bg-white border-b border-gray-100">
          <div className="max-w-[520px] mx-auto">
            <div className="flex items-center gap-0 mb-2">
              {steps.map((label, i) => {
                const n = i + 1;
                const active = step === n;
                const done = step > n;
                return (
                  <div key={label} className="flex items-center flex-1 last:flex-none">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 transition-all ${done ? 'bg-[#D73E26] text-white' : active ? 'bg-[#0D1117] text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {done ? <CheckCircle className="w-4 h-4" /> : n}
                      </div>
                      <span className={`text-[12px] font-semibold ${active ? 'text-[#0D1117]' : done ? 'text-[#D73E26]' : 'text-gray-400'}`}>{label}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`flex-1 h-[2px] mx-3 ${done ? 'bg-[#D73E26]' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex items-start justify-center py-8 px-6">
          <div className="w-full max-w-[520px]">

            {/* Erreur générique */}
            {errorMsg && (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-600 text-[13px] rounded-2xl flex items-center gap-3">
                <span>⚠️</span><span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {/* Erreurs bloquantes contextuelles — Montrées à l'étape 1 après clic Suivant */}

            <form onSubmit={handleSubmit}>

              {/* ── ÉTAPE 1 : Commerce ── */}
              {step === 1 && (
                <div className="animate-in fade-in duration-300">
                  <div className="mb-8">
                    <div className="w-12 h-12 bg-[#FCE7DD] rounded-2xl flex items-center justify-center mb-5">
                      <Store className="w-6 h-6 text-[#D73E26]" />
                    </div>
                    <h2 className="font-bricolage text-[26px] font-extrabold text-[#0D1117] mb-1">Votre commerce</h2>
                    <p className="text-[#9C8B82] text-[14px]">Présentez votre établissement à notre équipe.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Nom du commerce *" icon={<Store className="w-4 h-4" />}>
                        <input type="text" required value={businessName} onChange={e => setBusinessName(e.target.value)}
                          placeholder="Café El Medina" className="field-input" />
                      </Field>
                      <div>
                        <label className="block text-[11px] font-bold text-[#5D534F] mb-1.5 uppercase tracking-wide">Catégorie *</label>
                        <div className="relative">
                          <select required value={category} onChange={e => setCategory(e.target.value)}
                            className={`w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-[13px] outline-none focus:border-[#D73E26] focus:ring-2 focus:ring-[#D73E26]/10 appearance-none cursor-pointer transition-all ${category ? 'text-gray-900' : 'text-gray-400'}`}>
                            <option value="" disabled>Sélectionner</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Ville *" icon={<MapPin className="w-4 h-4" />}>
                        <input type="text" required value={city} onChange={e => setCity(e.target.value)}
                          placeholder="Tunis" className="field-input" />
                      </Field>
                      <Field label="Adresse" icon={<Building2 className="w-4 h-4" />}>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                          placeholder="Rue, quartier..." className="field-input" />
                      </Field>
                    </div>

                    <Field label="Email professionnel *" icon={<Mail className="w-4 h-4" />}>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={e => { setContactEmail(e.target.value); setEmailStatus(null); }}
                        placeholder="contact@moncommerce.com"
                        className={`field-input ${
                          emailStatus && !emailStatus.code.startsWith('OK')
                            ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                            : ''
                        }`}
                      />
                    </Field>

                    {/* Alerte contextuelle inline sous l'email — apparaît après clic Suivant */}
                    {emailStatus && (
                      <div className={`-mt-1 p-4 rounded-2xl border ${
                        emailStatus.code === 'ALREADY_ACTIVE' ? 'bg-blue-50 border-blue-200' :
                        emailStatus.code === 'PENDING_ACTIVATION' ? 'bg-amber-50 border-amber-200' :
                        'bg-orange-50 border-orange-200'
                      }`}>
                        <div className="flex items-start gap-2.5 mb-3">
                          <span className="text-lg mt-0.5">
                            {emailStatus.code === 'ALREADY_ACTIVE' ? '✅' :
                             emailStatus.code === 'PENDING_ACTIVATION' ? '📧' : '⏳'}
                          </span>
                          <p className={`text-[13px] font-semibold leading-relaxed ${
                            emailStatus.code === 'ALREADY_ACTIVE' ? 'text-blue-800' :
                            emailStatus.code === 'PENDING_ACTIVATION' ? 'text-amber-800' : 'text-orange-800'
                          }`}>{emailStatus.message}</p>
                        </div>

                        {emailStatus.code === 'ALREADY_ACTIVE' && (
                          <Link href="/login"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-[12px] font-bold transition-colors">
                            Se connecter →
                          </Link>
                        )}

                        {emailStatus.code === 'PENDING_ACTIVATION' && (
                          <div className="flex flex-wrap gap-2">
                            <Link href="/activate-account"
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[12px] font-bold transition-colors">
                              J’ai reçu mon email →
                            </Link>
                            <button type="button"
                              onClick={async () => {
                                await resendActivationAction(contactEmail);
                                setEmailStatus({
                                  code: 'PENDING_ACTIVATION',
                                  message: `Nouveau lien envoyé à ${contactEmail}. Vérifiez votre boîte email.`
                                });
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 border border-amber-400 text-amber-700 bg-white hover:bg-amber-50 rounded-xl text-[12px] font-semibold transition-colors">
                              Renvoyer le lien
                            </button>
                          </div>
                        )}

                        {emailStatus.code === 'ALREADY_PENDING' && (
                          <p className="text-[12px] text-orange-600 font-medium mt-1">
                            Vous recevrez un email dès que votre dossier sera traité.
                          </p>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Téléphone" icon={<Phone className="w-4 h-4" />}>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                          placeholder="+216 XX XXX XXX" className="field-input" />
                      </Field>
                      <Field label="Site web / Réseaux" icon={<Globe className="w-4 h-4" />}>
                        <input type="url" value={website} onChange={e => setWebsite(e.target.value)}
                          placeholder="https://..." className="field-input" />
                      </Field>
                    </div>
                  </div>
                </div>
              )}

              {/* ── ÉTAPE 2 : Responsable ── */}
              {step === 2 && (
                <div className="animate-in fade-in duration-300">
                  <div className="mb-8">
                    <div className="w-12 h-12 bg-[#FCE7DD] rounded-2xl flex items-center justify-center mb-5">
                      <User className="w-6 h-6 text-[#D73E26]" />
                    </div>
                    <h2 className="font-bricolage text-[26px] font-extrabold text-[#0D1117] mb-1">Responsable</h2>
                    <p className="text-[#9C8B82] text-[14px]">Informations de la personne en charge du partenariat.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Prénom *" icon={<User className="w-4 h-4" />}>
                        <input type="text" required value={ownerFirstName} onChange={e => setOwnerFirstName(e.target.value)}
                          placeholder="Mohamed" className="field-input" />
                      </Field>
                      <Field label="Nom *" icon={<User className="w-4 h-4" />}>
                        <input type="text" required value={ownerLastName} onChange={e => setOwnerLastName(e.target.value)}
                          placeholder="Ben Ali" className="field-input" />
                      </Field>
                    </div>

                    <Field label="Fonction" icon={<Building2 className="w-4 h-4" />}>
                      <input type="text" value={ownerRole} onChange={e => setOwnerRole(e.target.value)}
                        placeholder="Gérant, Directeur..." className="field-input" />
                    </Field>

                    <Field label="Téléphone du responsable" icon={<Phone className="w-4 h-4" />}>
                      <input type="tel" value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)}
                        placeholder="+216 XX XXX XXX" className="field-input" />
                    </Field>

                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                      <p className="text-[12px] text-blue-700 font-medium">
                        📧 L'email d'activation sera envoyé à l'adresse <strong>{contactEmail}</strong> renseignée à l'étape précédente.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── ÉTAPE 3 : Finaliser ── */}
              {step === 3 && (
                <div className="animate-in fade-in duration-300">
                  <div className="mb-8">
                    <div className="w-12 h-12 bg-[#FCE7DD] rounded-2xl flex items-center justify-center mb-5">
                      <Layers className="w-6 h-6 text-[#D73E26]" />
                    </div>
                    <h2 className="font-bricolage text-[26px] font-extrabold text-[#0D1117] mb-1">Finaliser</h2>
                    <p className="text-[#9C8B82] text-[14px]">Quelques informations sur votre projet de fidélisation.</p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#5D534F] mb-3 uppercase tracking-wide">
                        Nombre de points de vente
                      </label>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setNumberOfLocations(Math.max(1, numberOfLocations - 1))}
                          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors font-bold text-lg">−</button>
                        <span className="w-12 text-center font-bold text-[#0D1117] text-lg">{numberOfLocations}</span>
                        <button type="button" onClick={() => setNumberOfLocations(numberOfLocations + 1)}
                          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors font-bold text-lg">+</button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#5D534F] mb-3 uppercase tracking-wide">
                        Programme de fidélité souhaité
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {LOYALTY_TYPES.map((t) => (
                          <button type="button" key={t.value}
                            onClick={() => setLoyaltyProgramType(t.value)}
                            className={`p-3 rounded-xl border text-left transition-all ${loyaltyProgramType === t.value ? 'border-[#D73E26] bg-[#FFF5F2]' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                            <p className={`text-[13px] font-bold ${loyaltyProgramType === t.value ? 'text-[#D73E26]' : 'text-gray-800'}`}>{t.label}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{t.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#5D534F] mb-1.5 uppercase tracking-wide">
                        Présentation / Message (optionnel)
                      </label>
                      <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} maxLength={1000}
                        placeholder="Dites-nous quelques mots sur votre commerce et vos attentes..."
                        className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-[13px] text-gray-900 outline-none focus:border-[#D73E26] focus:ring-2 focus:ring-[#D73E26]/10 resize-none transition-all placeholder-gray-400" />
                      <p className="text-[11px] text-gray-400 text-right mt-1">{message.length}/1000</p>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" checked={acceptCGU} onChange={e => setAcceptCGU(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-[#D73E26] shrink-0" />
                      <span className="text-[12px] text-gray-600 leading-relaxed">
                        J'accepte les{' '}
                        <a href="#" className="text-[#D73E26] font-semibold hover:underline">conditions générales d'utilisation</a>{' '}
                        et la{' '}
                        <a href="#" className="text-[#D73E26] font-semibold hover:underline">politique de confidentialité</a>{' '}
                        de Retenza Connect.
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className={`flex mt-8 gap-3 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
                {step > 1 && (
                  <button type="button" onClick={() => setStep((s) => (s - 1) as Step)}
                    className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-2xl text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors bg-white">
                    <ArrowLeft className="w-4 h-4" /> Précédent
                  </button>
                )}
                {step < 3 ? (
                  <button type="button" onClick={handleNext} disabled={isCheckingEmail}
                    className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-[#0D1117] text-white font-bold text-[14px] hover:bg-black transition-all shadow-xl shadow-black/20 disabled:opacity-70">
                    {isCheckingEmail ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Vérification...</>
                    ) : (
                      <>Suivant <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                ) : (
                  <button type="submit" disabled={isLoading}
                    className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-[#D73E26] hover:bg-[#C0321C] text-white font-bold text-[14px] transition-all shadow-xl shadow-red-900/20 disabled:opacity-60">
                    {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                    {isLoading ? 'Envoi en cours...' : 'Envoyer ma demande'}
                  </button>
                )}
              </div>
            </form>

            <p className="text-center text-[12px] text-gray-400 font-medium mt-6">
              Déjà partenaire ?{' '}
              <Link href="/login" className="text-[#D73E26] font-bold hover:underline">Se connecter</Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .field-input {
          width: 100%;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px 16px 12px 40px;
          font-size: 13px;
          color: #111827;
          outline: none;
          transition: all 0.15s;
        }
        .field-input::placeholder { color: #9ca3af; }
        .field-input:focus { border-color: #D73E26; box-shadow: 0 0 0 3px rgba(215,62,38,0.08); }
      `}</style>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-[#5D534F] mb-1.5 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">{icon}</div>
        {children}
      </div>
    </div>
  );
}
