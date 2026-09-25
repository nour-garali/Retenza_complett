'use client';

import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight, User, CheckCircle2, Star, Phone, Loader2, ChevronDown, Search } from 'lucide-react';
import { registerClientAction, checkVerificationStatusAction } from '@/services/authActions';
import Link from 'next/link';
import PublicNavbar from '@/components/landing/PublicNavbar';

const COUNTRIES = [
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'TN', name: 'Tunisie', dialCode: '+216', flag: '🇹🇳' },
  { code: 'DZ', name: 'Algérie', dialCode: '+213', flag: '🇩🇿' },
  { code: 'MA', name: 'Maroc', dialCode: '+212', flag: '🇲🇦' },
  { code: 'BE', name: 'Belgique', dialCode: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', dialCode: '+41', flag: '🇨🇭' },
  { code: 'LU', name: 'Luxembourg', dialCode: '+352', flag: '🇱🇺' },
  { code: 'DE', name: 'Allemagne', dialCode: '+49', flag: '🇩🇪' },
  { code: 'ES', name: 'Espagne', dialCode: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italie', dialCode: '+39', flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'GB', name: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧' },
  { code: 'NL', name: 'Pays-Bas', dialCode: '+31', flag: '🇳🇱' },
  { code: 'SE', name: 'Suède', dialCode: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norvège', dialCode: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Danemark', dialCode: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finlande', dialCode: '+358', flag: '🇫🇮' },
  { code: 'PL', name: 'Pologne', dialCode: '+48', flag: '🇵🇱' },
  { code: 'CZ', name: 'Tchéquie', dialCode: '+420', flag: '🇨🇿' },
  { code: 'AT', name: 'Autriche', dialCode: '+43', flag: '🇦🇹' },
  { code: 'GR', name: 'Grèce', dialCode: '+30', flag: '🇬🇷' },
  { code: 'RO', name: 'Roumanie', dialCode: '+40', flag: '🇷🇴' },
  { code: 'HU', name: 'Hongrie', dialCode: '+36', flag: '🇭🇺' },
  { code: 'TR', name: 'Turquie', dialCode: '+90', flag: '🇹🇷' },
  { code: 'RU', name: 'Russie', dialCode: '+7', flag: '🇷🇺' },
  { code: 'US', name: 'États-Unis', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'MX', name: 'Mexique', dialCode: '+52', flag: '🇲🇽' },
  { code: 'BR', name: 'Brésil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'AR', name: 'Argentine', dialCode: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chili', dialCode: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombie', dialCode: '+57', flag: '🇨🇴' },
  { code: 'JP', name: 'Japon', dialCode: '+81', flag: '🇯🇵' },
  { code: 'CN', name: 'Chine', dialCode: '+86', flag: '🇨🇳' },
  { code: 'KR', name: 'Corée du Sud', dialCode: '+82', flag: '🇰🇷' },
  { code: 'IN', name: 'Inde', dialCode: '+91', flag: '🇮🇳' },
  { code: 'AU', name: 'Australie', dialCode: '+61', flag: '🇦🇺' },
  { code: 'NZ', name: 'Nouvelle-Zélande', dialCode: '+64', flag: '🇳🇿' },
  { code: 'ZA', name: 'Afrique du Sud', dialCode: '+27', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'EG', name: 'Égypte', dialCode: '+20', flag: '🇪🇬' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  { code: 'SN', name: 'Sénégal', dialCode: '+221', flag: '🇸🇳' },
  { code: 'CI', name: "Côte d'Ivoire", dialCode: '+225', flag: '🇨🇮' },
  { code: 'CM', name: 'Cameroun', dialCode: '+237', flag: '🇨🇲' },
  { code: 'LY', name: 'Libye', dialCode: '+218', flag: '🇱🇾' },
  { code: 'SA', name: 'Arabie Saoudite', dialCode: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'Émirats Arabes Unis', dialCode: '+971', flag: '🇦🇪' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
  { code: 'KW', name: 'Koweït', dialCode: '+965', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahreïn', dialCode: '+973', flag: '🇧🇭' },
  { code: 'JO', name: 'Jordanie', dialCode: '+962', flag: '🇯🇴' },
  { code: 'LB', name: 'Liban', dialCode: '+961', flag: '🇱🇧' },
  { code: 'IQ', name: 'Irak', dialCode: '+964', flag: '🇮🇶' },
  { code: 'SY', name: 'Syrie', dialCode: '+963', flag: '🇸🇾' },
  { code: 'PS', name: 'Palestine', dialCode: '+970', flag: '🇵🇸' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰' },
  { code: 'TH', name: 'Thaïlande', dialCode: '+66', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭' },
  { code: 'ID', name: 'Indonésie', dialCode: '+62', flag: '🇮🇩' },
  { code: 'MY', name: 'Malaisie', dialCode: '+60', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapour', dialCode: '+65', flag: '🇸🇬' },
];

export default function RegisterClientScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // France par défaut
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const phone = phoneNumber ? `${selectedCountry.dialCode} ${phoneNumber}` : '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [waitingUserId, setWaitingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!waitingUserId) return;
    const interval = setInterval(async () => {
      const status = await checkVerificationStatusAction(waitingUserId);
      if (status.success) {
        if (status.verified) {
          clearInterval(interval);
          setSuccessMsg('Compte vérifié avec succès ! Redirection...');
          window.location.href = '/client';
        } else if (status.status === 'rejected') {
          clearInterval(interval);
          setWaitingUserId(null);
          setErrorMsg('Votre demande a été annulée depuis l\'e-mail.');
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [waitingUserId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    const res = await registerClientAction({ firstName, lastName, email, phone, password });

    if (res.success) {
      if (res.data?.user?.id) {
        setWaitingUserId(res.data.user.id);
        setIsLoading(false);
      } else {
        setSuccessMsg(res.message || 'Compte créé avec succès ! Veuillez vérifier votre e-mail.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      }
    } else {
      setErrorMsg(res.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF0EC] to-[#F9E2DB] font-inter relative overflow-hidden flex flex-col">

      <PublicNavbar />

      {/* ── BACKGROUND — Soft deeper red tone for contrast ── */}
      <div className="absolute top-0 right-0 h-full w-[45%] bg-[#F4CDBF] rounded-l-full translate-x-[65%] -z-0 opacity-100 flex items-center justify-center">
        <div className="absolute w-[800px] h-[800px] border-[40px] border-white/30 rounded-full pointer-events-none"></div>
        <div className="absolute w-[600px] h-[600px] border-[40px] border-white/30 rounded-full pointer-events-none"></div>
      </div>

      {/* ── MAIN ── */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center justify-between px-8 md:px-12 lg:px-20 py-6 lg:py-2 z-10 gap-16 lg:gap-8">

        {/* ── LEFT — Branding ── */}
        <div className="w-full lg:w-[45%] flex flex-col pt-4">

          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#BF2112]/[0.08] border border-[#BF2112]/[0.16] rounded-full w-fit mb-3 lg:mb-4">
            <Star className="w-3.5 h-3.5 text-[#BF2112]" fill="#BF2112" />
            <span className="text-[#BF2112] text-[12px] font-bold tracking-[0.04em]">ESPACE CLIENT</span>
          </div>

          <h1 className="font-bricolage text-[42px] md:text-[52px] lg:text-[50px] font-bold leading-[1.05] text-[#1B100C] tracking-tight mb-2 lg:mb-3">
            Rejoignez<br />la communauté<br />
            <span className="text-[#BF2112]">Retenza.</span>
          </h1>

          <p className="text-[#5D534F] text-[15px] leading-relaxed mb-5 lg:mb-6 max-w-sm">
            Accumulez des points, profitez d'offres exclusives et restez connecté à vos commerçants favoris.
          </p>

          <div className="space-y-6">
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-2xl bg-[#FCE7DD] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#BF2112]" />
              </div>
              <div>
                <h3 className="text-[#1B100C] font-semibold text-[14px]">Carte de fidélité dans votre poche</h3>
                <p className="text-[#9C8B82] text-[12px]">Partout, tout le temps, sans papier.</p>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-2xl bg-[#FCE7DD] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#BF2112]" />
              </div>
              <div>
                <h3 className="text-[#1B100C] font-semibold text-[14px]">Offres & récompenses exclusives</h3>
                <p className="text-[#9C8B82] text-[12px]">Des avantages réservés aux membres Retenza.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT — Form Card ── */}
        <div className="w-full lg:w-[55%] flex justify-end">
          <div className="w-full max-w-[540px] bg-[#FFFBFA] rounded-[32px] p-6 lg:p-8 mt-4 lg:mt-8 shadow-2xl shadow-[#BF2112]/15 border-l-[4px] border-l-[#BF2112] border-t border-r border-b border-white relative">
            
            {waitingUserId ? (
              <div className="flex flex-col items-center text-center py-10">
                <div className="w-20 h-20 bg-[#FCE7DD] rounded-full flex items-center justify-center mb-6">
                  <Mail className="w-10 h-10 text-[#BF2112]" />
                </div>
                <h2 className="font-bricolage text-[26px] font-bold text-[#1B100C] mb-4">Vérifiez votre e-mail</h2>
                <p className="text-[#5D534F] text-[15px] leading-relaxed mb-8">
                  Nous avons envoyé un lien de confirmation à votre adresse e-mail. Veuillez cliquer dessus pour activer votre compte.
                </p>
                <div className="flex items-center gap-3 text-[#D73E26] font-semibold bg-[#FFF5F2] px-6 py-3 rounded-xl border border-[#FCE7DD]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>En attente de validation...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Card header */}
                <div className="flex flex-col items-center mb-6 text-center">
                  <h2 className="font-bricolage text-[22px] font-bold text-[#1B100C] mb-1">Créer mon compte</h2>
                </div>

                {/* Alerts */}
                {errorMsg && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-[13px] rounded-xl flex items-start gap-3">
                    <span className="mt-0.5">⚠️</span>
                    <span className="font-medium">{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 text-[13px] rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <span className="font-medium">{successMsg}</span>
                  </div>
                )}

            {/* Form */}
            <form onSubmit={handleRegister} className="space-y-4">

              {/* BLOC: Identité */}
              <div className="space-y-3">
                <div className="flex items-center mb-1">
                  <div className="border-l-[3px] border-[#BF2112] bg-gradient-to-r from-[#FCE7DD]/60 to-transparent py-1 pl-2 pr-6 rounded-r-md">
                    <span className="text-[10px] font-bold text-[#BF2112] uppercase tracking-wider">Identité</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[12px] font-bold text-[#1B100C] ml-1 uppercase tracking-wide opacity-80">Prénom *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-[#BF2112]/50" />
                      </div>
                      <input
                        type="text" required value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="Votre prénom"
                        className="w-full bg-[#FDF3F0] border border-[#FCE7DD]/60 focus:border-[#BF2112] focus:ring-[3px] focus:ring-[#BF2112]/10 outline-none rounded-xl py-2.5 lg:py-2 pl-11 pr-4 text-[14px] font-medium text-gray-900 transition-all placeholder-gray-400 shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[12px] font-bold text-[#1B100C] ml-1 uppercase tracking-wide opacity-80">Nom *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="w-4 h-4 text-[#BF2112]/50" />
                      </div>
                      <input
                        type="text" required value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Votre nom"
                        className="w-full bg-[#FDF3F0] border border-[#FCE7DD]/60 focus:border-[#BF2112] focus:ring-[3px] focus:ring-[#BF2112]/10 outline-none rounded-xl py-2.5 lg:py-2 pl-11 pr-4 text-[14px] font-medium text-gray-900 transition-all placeholder-gray-400 shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOC: Contact */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center mb-1">
                  <div className="border-l-[3px] border-[#BF2112] bg-gradient-to-r from-[#FCE7DD]/60 to-transparent py-1 pl-2 pr-6 rounded-r-md">
                    <span className="text-[10px] font-bold text-[#BF2112] uppercase tracking-wider">Contact</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-[#1B100C] ml-1 uppercase tracking-wide opacity-80">Adresse e-mail *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-[#BF2112]/50" />
                    </div>
                    <input
                      type="email" required value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="w-full bg-[#FDF3F0] border border-[#FCE7DD]/60 focus:border-[#BF2112] focus:ring-[3px] focus:ring-[#BF2112]/10 outline-none rounded-xl py-2.5 lg:py-2 pl-11 pr-4 text-[14px] font-medium text-gray-900 transition-all placeholder-gray-400 shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[12px] font-bold text-[#1B100C] ml-1 uppercase tracking-wide opacity-80">Téléphone</label>
                  <div className="relative" ref={countryDropdownRef}>
                    <div className="flex bg-[#FDF3F0] border border-[#FCE7DD]/60 focus-within:border-[#BF2112] focus-within:ring-[3px] focus-within:ring-[#BF2112]/10 rounded-xl shadow-sm transition-all relative overflow-hidden h-[42px]">
                      
                      {/* ── Sélecteur de pays ── */}
                      <button
                        type="button"
                        onClick={() => { setShowCountryDropdown(v => !v); setCountrySearch(''); }}
                        className="flex items-center gap-2 h-full px-3 hover:bg-black/5 outline-none transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <img 
                          src={`https://flagcdn.com/${selectedCountry.code.toLowerCase()}.svg`} 
                          alt={selectedCountry.name} 
                          className="w-5 h-auto object-cover rounded-[2px] shadow-sm"
                        />
                        <span className="text-[13px] font-bold text-gray-800">{selectedCountry.dialCode}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      <div className="w-[1px] bg-[#FCE7DD]/60 my-2"></div>

                      {/* ── Numéro de téléphone ── */}
                      <div className="relative flex-1 flex items-center">
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={e => setPhoneNumber(e.target.value.replace(/[^0-9 \-().]/g, ''))}
                          placeholder="6 12 34 56 78"
                          className="w-full h-full bg-transparent outline-none py-2.5 px-3 text-[14px] font-medium text-gray-900 transition-all placeholder-gray-400"
                        />
                      </div>
                    </div>

                    {showCountryDropdown && (
                      <div className="absolute left-0 top-full mt-1.5 z-50 w-[280px] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
                        {/* Barre de recherche */}
                        <div className="p-2 border-b border-gray-100">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <input
                              autoFocus
                              type="text"
                              value={countrySearch}
                              onChange={e => setCountrySearch(e.target.value)}
                              placeholder="Rechercher un pays..."
                              className="flex-1 bg-transparent text-[13px] text-gray-800 placeholder-gray-400 outline-none"
                            />
                          </div>
                        </div>
                        {/* Liste des pays */}
                        <div className="max-h-[240px] overflow-y-auto">
                          {COUNTRIES.filter(c =>
                            c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                            c.dialCode.includes(countrySearch)
                          ).map(country => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => { setSelectedCountry(country); setShowCountryDropdown(false); setCountrySearch(''); }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#FDF3F0] transition-colors ${
                                selectedCountry.code === country.code ? 'bg-[#FDF3F0] text-[#BF2112]' : 'text-gray-700'
                              }`}
                            >
                              <img 
                                src={`https://flagcdn.com/${country.code.toLowerCase()}.svg`} 
                                alt={country.name} 
                                className="w-5 h-auto object-cover rounded-[2px] shadow-sm shrink-0"
                              />
                              <span className="flex-1 text-[13px] font-medium truncate">{country.name}</span>
                              <span className="text-[12px] text-gray-400 font-mono font-semibold shrink-0">{country.dialCode}</span>
                            </button>
                          ))}
                          {COUNTRIES.filter(c =>
                            c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                            c.dialCode.includes(countrySearch)
                          ).length === 0 && (
                            <p className="px-4 py-6 text-center text-[13px] text-gray-400">Aucun pays trouvé</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Fermer le dropdown en cliquant ailleurs */}
                    {showCountryDropdown && (
                      <div className="fixed inset-0 z-40" onClick={() => setShowCountryDropdown(false)} />
                    )}
                  </div>
                </div>
              </div>

              {/* BLOC: Sécurité */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center mb-1">
                  <div className="border-l-[3px] border-[#BF2112] bg-gradient-to-r from-[#FCE7DD]/60 to-transparent py-1 pl-2 pr-6 rounded-r-md">
                    <span className="text-[10px] font-bold text-[#BF2112] uppercase tracking-wider">Sécurité</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[12px] font-bold text-[#1B100C] ml-1 uppercase tracking-wide opacity-80">Mot de passe *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-[#BF2112]/50" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'} required value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{ letterSpacing: showPassword || !password ? 'normal' : '2px' }}
                        className="w-full bg-[#FDF3F0] border border-[#FCE7DD]/60 focus:border-[#BF2112] focus:ring-[3px] focus:ring-[#BF2112]/10 outline-none rounded-xl py-2.5 lg:py-2 pl-11 pr-11 text-[14px] font-medium text-gray-900 transition-all placeholder-gray-400 shadow-sm"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center outline-none text-gray-400 hover:text-[#BF2112] transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[12px] font-bold text-[#1B100C] ml-1 uppercase tracking-wide opacity-80">Confirmer *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-4 h-4 text-[#BF2112]/50" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'} required value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{ letterSpacing: showPassword || !confirmPassword ? 'normal' : '2px' }}
                        className="w-full bg-[#FDF3F0] border border-[#FCE7DD]/60 focus:border-[#BF2112] focus:ring-[3px] focus:ring-[#BF2112]/10 outline-none rounded-xl py-2.5 lg:py-2 pl-11 pr-11 text-[14px] font-medium text-gray-900 transition-all placeholder-gray-400 shadow-sm"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Terms */}
              <p className="text-[11px] text-[#9C8B82] leading-relaxed px-1 mt-4">
                En créant votre compte, vous acceptez nos{' '}
                <a href="#" className="text-[#BF2112] font-semibold hover:underline">Conditions d'utilisation</a>{' '}
                et notre{' '}
                <a href="#" className="text-[#BF2112] font-semibold hover:underline">Politique de confidentialité</a>.
              </p>

              {/* CTA */}
              <div className="pt-2">
                <button type="submit" disabled={isLoading}
                  className="w-full h-[48px] lg:h-[44px] rounded-xl bg-gradient-to-r from-[#BF2112] to-[#9E1A0A] hover:to-[#BF2112] text-white font-semibold text-[14px] transition-all active:scale-[0.98] flex items-center justify-center shadow-lg shadow-[#BF2112]/25 border border-[#BF2112]/50 disabled:opacity-70 gap-2">
                  {isLoading ? (
                    <div className="w-[20px] h-[20px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Créer mon compte <ArrowRight className="w-4 h-4 ml-1" /></>
                  )}
                </button>
              </div>

              {/* Links */}
              <div className="pt-4 mt-2 border-t border-gray-100 flex flex-col gap-2">
                <p className="text-[12px] text-gray-400 text-center">
                  Vous avez déjà un compte ?{' '}
                  <Link href="/login" className="text-[#BF2112] font-semibold hover:underline">Se connecter</Link>
                </p>
              </div>

            </form>
            </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
