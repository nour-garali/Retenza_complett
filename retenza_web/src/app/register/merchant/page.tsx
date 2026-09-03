'use client';

import { useState } from 'react';
import {
  Store, User, ChevronDown, CheckCircle, ArrowRight, ArrowLeft,
  Mail, Phone, Globe, MapPin, Building2, Users, Layers, Send
} from 'lucide-react';
import { submitPartnershipRequestAction, checkPartnershipEmailAction, resendActivationAction } from '@/services/authActions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PublicNavbar from '@/components/landing/PublicNavbar';

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
    <div className="min-h-screen flex flex-col font-inter">
      <PublicNavbar />
      
      <main className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL */}
      <div className="hidden lg:flex w-[42%] flex-col relative overflow-hidden bg-white items-center justify-start pt-24 border-r border-[#F4CDBF]/30">
        {/* Boutique illustration */}
        <div className="relative z-10 w-full flex justify-center px-8">
          <img
            src="/illustration_boutique_transparent.png"
            alt="Rejoignez le réseau Retenza"
            className="w-full max-w-[630px] max-h-[92%] object-contain select-none"
            draggable={false}
          />
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 bg-[#FDF0EC] flex flex-col">

        {/* Progress wizard — Card */}
        <div className="px-6 pt-5 pb-2 bg-[#FDF0EC]">
          <div className="max-w-[520px] mx-auto">
            <div className="bg-white rounded-2xl border border-[#F0E8E4] shadow-md shadow-[#BF2112]/8 px-7 py-5">
              <div className="flex items-center">
                {steps.map((label, i) => {
                  const n = i + 1;
                  const active = step === n;
                  const done = step > n;
                  const upcoming = !active && !done;
                  return (
                    <div key={label} className="flex items-center flex-1 last:flex-none">
                      {/* Step node */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 transition-all duration-300 ${
                          done
                            ? 'bg-[#BF2112] text-white shadow-md shadow-[#BF2112]/30'
                            : active
                            ? 'bg-[#BF2112] text-white shadow-lg shadow-[#BF2112]/30 ring-4 ring-[#BF2112]/15'
                            : 'bg-white border-2 border-[#E8D8D4] text-[#C0A099]'
                        }`}>
                          {done ? <CheckCircle className="w-4 h-4" /> : n}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-0.5 ${
                            done ? 'text-[#BF2112]/60' : active ? 'text-[#BF2112]' : 'text-[#C0A099]'
                          }`}>
                            {done ? 'Complété' : active ? 'En cours' : 'À venir'}
                          </span>
                          <span className={`text-[13px] font-semibold leading-none ${
                            done ? 'text-[#5D534F]' : active ? 'text-[#1B100C]' : 'text-[#C0A099]'
                          }`}>
                            {label}
                          </span>
                        </div>
                      </div>
                      {/* Connector line */}
                      {i < steps.length - 1 && (
                        <div className="flex-1 mx-4 h-[2px] relative overflow-hidden rounded-full">
                          <div className="absolute inset-0 bg-[#F0E8E4]" />
                          {done && <div className="absolute inset-0 bg-[#BF2112]" />}
                          {active && <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#BF2112] to-[#F4CDBF]" />}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex items-start justify-center py-6 px-6">
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
                      <Store className="w-6 h-6 text-[#BF2112]" />
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
                            className={`w-full bg-white border border-[#E8D8D4] rounded-xl py-3 px-4 text-[13px] outline-none focus:border-[#BF2112] focus:ring-[3px] focus:ring-[#BF2112]/10 appearance-none cursor-pointer transition-all shadow-sm ${category ? 'text-gray-900' : 'text-gray-400'}`}>
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
                          emailStatus && (!emailStatus.code || !emailStatus.code.startsWith('OK'))
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
                      <User className="w-6 h-6 text-[#BF2112]" />
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

                    <div className="p-4 bg-[#FDF3F0] border border-[#FCE7DD] rounded-2xl flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#FCE7DD]/60">
                        <Mail className="w-4 h-4 text-[#BF2112]" />
                      </div>
                      <p className="text-[12px] text-[#5D534F] font-medium leading-relaxed pt-1">
                        L'email d'activation sera envoyé à l'adresse <strong className="text-[#BF2112] font-bold">{contactEmail}</strong> renseignée à l'étape précédente.
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
                      <Layers className="w-6 h-6 text-[#BF2112]" />
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
                            className={`p-3 rounded-xl border text-left transition-all ${loyaltyProgramType === t.value ? 'border-[#BF2112] bg-[#FDF3F0]' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                            <p className={`text-[13px] font-bold ${loyaltyProgramType === t.value ? 'text-[#BF2112]' : 'text-gray-800'}`}>{t.label}</p>
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
                        className="w-full bg-[#FDF3F0] border border-[#FCE7DD]/60 rounded-xl py-3 px-4 text-[13px] text-gray-900 outline-none focus:border-[#BF2112] focus:ring-[3px] focus:ring-[#BF2112]/10 resize-none transition-all placeholder-gray-400 shadow-sm" />
                      <p className="text-[11px] text-gray-400 text-right mt-1">{message.length}/1000</p>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" checked={acceptCGU} onChange={e => setAcceptCGU(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-[#BF2112] shrink-0" />
                      <span className="text-[12px] text-gray-600 leading-relaxed">
                        J'accepte les{' '}
                        <a href="#" className="text-[#BF2112] font-semibold hover:underline">conditions générales d'utilisation</a>{' '}
                        et la{' '}
                        <a href="#" className="text-[#BF2112] font-semibold hover:underline">politique de confidentialité</a>{' '}
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
                    className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-[#BF2112] to-[#9E1A0A] hover:to-[#BF2112] text-white font-bold text-[14px] transition-all shadow-lg shadow-[#BF2112]/25 border border-[#BF2112]/50 disabled:opacity-70">
                    {isCheckingEmail ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Vérification...</>
                    ) : (
                      <>Suivant <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                ) : (
                  <button type="submit" disabled={isLoading}
                    className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-[#BF2112] to-[#9E1A0A] hover:to-[#BF2112] text-white font-bold text-[14px] transition-all shadow-lg shadow-[#BF2112]/25 border border-[#BF2112]/50 disabled:opacity-70">
                    {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                    {isLoading ? 'Envoi en cours...' : 'Envoyer ma demande'}
                  </button>
                )}
              </div>
            </form>

            <p className="text-center text-[12px] text-gray-400 font-medium mt-6">
              Déjà partenaire ?{' '}
              <Link href="/login" className="text-[#BF2112] font-bold hover:underline">Se connecter</Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .field-input {
          width: 100%;
          background: #FFFFFF;
          border: 1px solid #E8D8D4;
          border-radius: 12px;
          padding: 12px 16px 12px 40px;
          font-size: 14px;
          font-weight: 500;
          color: #111827;
          outline: none;
          transition: all 0.15s;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.04);
        }
        .field-input::placeholder { color: #9ca3af; }
        .field-input:focus { border-color: #BF2112; box-shadow: 0 0 0 3px rgba(191,33,18,0.1); background: #FFFFFF; }
      `}</style>
      </main>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-[#5D534F] mb-1.5 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#BF2112]/50">{icon}</div>
        {children}
      </div>
    </div>
  );
}
