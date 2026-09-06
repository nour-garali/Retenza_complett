'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getMerchantQr, getMerchantBillingStats } from '@/services/merchantDashboardActions';
import QRCode from 'react-qr-code';
import PageHeader from '@/components/PageHeader';
import { 
  Store, Phone, Mail, MapPin, Pencil, Calendar, Tag, ExternalLink,
  Building2, User, Hash, Briefcase, Link2, FileText, Lock, QrCode,
  ShieldCheck, Shield, Headphones, Camera, X, Save, Upload, Info, 
  CreditCard, Copy
} from 'lucide-react';

type Tab = 'overview' | 'billing' | 'security' | 'qrcode';

function InfoGridCell({
  icon: Icon,
  label,
  value,
  isLink = false,
  linkHref,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  isLink?: boolean;
  linkHref?: string;
}) {
  return (
    <div className="flex items-center gap-3.5 py-3.5 sm:py-4">
      <div className="w-9 h-9 rounded-xl bg-[#F5D7CD]/70 flex items-center justify-center shrink-0 text-[#C31F3C]">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold text-[#736C72]">{label}</p>
        {isLink ? (
          <a
            href={linkHref || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] font-semibold text-[#C31F3C] hover:underline flex items-center gap-1.5 truncate mt-0.5"
          >
            <span className="truncate">{value}</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[#C31F3C]" />
          </a>
        ) : (
          <p className="text-[14px] font-semibold text-[#17151A] truncate mt-0.5">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

export default function MerchantProfilPage() {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // QR Code State
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);

  // Billing State
  const [billingStats, setBillingStats] = useState<any>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    commerceName: '',
    phone: '',
    address: '12 Rue de la Paix, 75002 Paris',
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Avatar / Logo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [savedLogo, setSavedLogo] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setEditForm(prev => ({
        ...prev,
        commerceName: (user as any).commerceName || 'Mon Commerce',
        phone: (user as any).phone || '25441177',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'qrcode' && !qrCodeData && !isLoadingQr) {
      setIsLoadingQr(true);
      getMerchantQr().then((res) => {
        setQrCodeData(res);
      }).catch(err => {
        console.error("Error fetching QR Code", err);
      }).finally(() => {
        setIsLoadingQr(false);
      });
    }
  }, [activeTab, qrCodeData, isLoadingQr]);

  useEffect(() => {
    if (activeTab === 'billing' && !billingStats && !isLoadingBilling) {
      setIsLoadingBilling(true);
      getMerchantBillingStats().then((res) => {
        setBillingStats(res);
      }).catch(err => {
        console.error("Error fetching billing stats", err);
      }).finally(() => {
        setIsLoadingBilling(false);
      });
    }
  }, [activeTab, billingStats, isLoadingBilling]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setSavedLogo(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (user) {
      login({
        ...user,
        commerceName: editForm.commerceName,
        phone: editForm.phone,
      } as any);
    }
    
    if (logoPreview) {
      setSavedLogo(logoPreview);
    }
    
    setIsSaving(false);
    setIsEditModalOpen(false);
  };
  
  const openEditDrawer = () => {
    setLogoPreview(savedLogo);
    setIsEditModalOpen(true);
  };

  const commerceName = editForm.commerceName || (user as any)?.commerceName || 'Mon Commerce';
  const initials = commerceName.charAt(0).toUpperCase() || 'M';
  const email = user?.email || 'imen@gmail.com';
  const phone = editForm.phone || (user as any)?.phone || '25441177';
  const responsibleName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || (user as any)?.name || 'cozyy ,';
  const customUrl = `retenza.app/c/${commerceName.toLowerCase().replace(/\s+/g, '') || 'moncommerce'}`;

  const handleCopyQrUrl = () => {
    const urlToCopy = typeof qrCodeData === 'string' ? 'https://retenza.app' : ((qrCodeData as any)?.url || 'https://retenza.app');
    navigator.clipboard.writeText(urlToCopy);
    alert('Lien copié !');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F7F4EF]">
      <PageHeader
        title="Mon Profil & Commerce"
        subtitle="Gérez les informations de votre établissement."
        breadcrumb="Profil"
      />

      <div className="max-w-7xl mx-auto px-6 md:px-8 pb-16 w-full flex flex-col">
        
        {/* Top section (Identity, Tabs, Content) */}
        <div className="flex flex-col gap-5 sm:gap-6">
          {/* ─── 1. CARD D'IDENTITÉ ─── */}
          <div className="bg-white border border-[#E9E4DD] rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              
              {/* Avatar + Main Info */}
              <div className="flex items-center gap-5">
                {/* Avatar circle with overlaid camera button */}
                <div className="relative shrink-0">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-full bg-[#F5D7CD] border border-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-center overflow-hidden cursor-pointer group"
                  >
                    {savedLogo ? (
                      <img src={savedLogo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[#C31F3C] text-3xl font-bold tracking-tight">
                        {initials}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border border-[#E9E4DD] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Changer la photo"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#17151A]" />
                  </button>
                </div>

                {/* Title, Badge, Contacts */}
                <div className="flex flex-col gap-2 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-[#17151A] tracking-tight">
                    {commerceName}
                  </h2>

                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F5D7CD]/70 text-[#C31F3C] text-[11px] font-semibold">
                      <Store className="w-3 h-3" />
                      Commerçant Partenaire
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-[12px] sm:text-[13px] font-medium text-[#17151A] flex-wrap mt-0.5">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-[#736C72]" />
                      <span>{email}</span>
                    </div>
                    <span className="text-[#E9E4DD]">|</span>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-[#736C72]" />
                      <span>{phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modifier les infos Button */}
              <div className="shrink-0 self-start sm:self-center">
                <button
                  onClick={openEditDrawer}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#F5D7CD] bg-white hover:bg-[#F5D7CD]/20 text-[#8A1329] text-[13px] font-semibold transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-[#C31F3C]"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#C31F3C]" />
                  Modifier les infos
                </button>
              </div>
            </div>

            {/* Bottom 3-column metadata strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E9E4DD] border border-[#E9E4DD] rounded-xl bg-white overflow-hidden">
              {/* Adresse */}
              <div className="p-3 sm:px-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg border border-[#E9E4DD] flex items-center justify-center shrink-0 text-[#17151A] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[#736C72] uppercase tracking-wider">Adresse</p>
                  <p className="text-[13px] sm:text-[14px] font-semibold text-[#17151A] truncate">{editForm.address}</p>
                </div>
              </div>

              {/* Secteur d'activité */}
              <div className="p-3 sm:px-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg border border-[#E9E4DD] flex items-center justify-center shrink-0 text-[#17151A] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <Tag className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[#736C72] uppercase tracking-wider">Secteur d&apos;activité</p>
                  <p className="text-[13px] sm:text-[14px] font-semibold text-[#17151A] truncate">Café / Restauration</p>
                </div>
              </div>

              {/* Membre depuis */}
              <div className="p-3 sm:px-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg border border-[#E9E4DD] flex items-center justify-center shrink-0 text-[#17151A] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[#736C72] uppercase tracking-wider">Membre depuis</p>
                  <p className="text-[13px] sm:text-[14px] font-semibold text-[#17151A] truncate">Janvier 2026</p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 2. BARRE D'ONGLETS ─── */}
          <div className="flex gap-6 sm:gap-8 border-b border-[#E9E4DD] overflow-x-auto no-scrollbar pb-0">
            {[
              { id: 'overview', label: 'Informations générales', icon: MapPin },
              { id: 'billing', label: 'Facturation & Plan', icon: FileText },
              { id: 'security', label: 'Sécurité & Accès', icon: Lock },
              { id: 'qrcode', label: 'Code QR & PLV', icon: QrCode },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex items-center gap-2 pb-3.5 text-[14px] font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[#C31F3C] text-[#C31F3C]'
                      : 'border-transparent text-[#736C72] hover:text-[#17151A]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ─── 3. CONTENU ONGLET ACTIF ─── */}
          {activeTab === 'overview' && (
            <div className="bg-white border border-[#E9E4DD] rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] animate-in fade-in duration-300">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 border-b border-[#E9E4DD]">
                <InfoGridCell icon={Building2} label="Nom de l'établissement" value={commerceName} />
                <InfoGridCell icon={User} label="Responsable" value={responsibleName} />
                <InfoGridCell icon={Phone} label="Téléphone de contact" value={phone} />
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 border-b border-[#E9E4DD]">
                <InfoGridCell icon={Mail} label="Adresse e-mail pro" value={email} />
                <InfoGridCell icon={MapPin} label="Adresse postale" value={editForm.address} />
                <InfoGridCell icon={Calendar} label="Date de souscription" value="Janvier 2026" />
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                <InfoGridCell icon={Hash} label="Numéro SIRET" value="123 456 789 00012" />
                <InfoGridCell icon={Briefcase} label="Secteur d'activité" value="Café / Restauration" />
                <InfoGridCell 
                  icon={Link2} 
                  label="Lien personnalisé" 
                  value={customUrl}
                  isLink
                  linkHref={`https://${customUrl}`}
                />
              </div>
            </div>
          )}

          {/* TAB: BILLING */}
          {activeTab === 'billing' && (() => {
            const hasDataThisMonth = billingStats?.hasDataThisMonth || false;
            const revenueGenerated: number | null = billingStats?.revenueThisMonth ?? null;
            const commissionRate: number | null = billingStats?.commissionRate ? Math.round(billingStats.commissionRate * 100) : null;
            const commissionAmount: number | null = billingStats?.commissionThisMonth ?? null;

            // Formatted display values (avoids TS narrowing inside JSX)
            const revenueDisplay = hasDataThisMonth && revenueGenerated != null
              ? `${(revenueGenerated as number).toLocaleString('fr-FR')} €`
              : null;
            const commissionAmountDisplay = hasDataThisMonth && commissionAmount != null
              ? `${(commissionAmount as number).toLocaleString('fr-FR')} €`
              : null;
            const commissionRateDisplay = commissionRate != null
              ? `${commissionRate as number}%`
              : null;

            // Anneau SVG : rayon 38, circonférence ≈ 238.8
            const radius = 38;
            const circumference = 2 * Math.PI * radius;
            const offset = commissionRate != null
              ? circumference * (1 - commissionRate / 100)
              : circumference;


            return (
              <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 animate-in fade-in duration-300">

                {/* ── Colonne principale ── */}
                <div className="bg-white border border-[#E9E4DD] rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-6">
                  <div>
                    <h3 className="text-[16px] font-bold text-[#17151A] mb-2">Plan Résultat</h3>
                    <p className="text-[14px] text-[#736C72] leading-relaxed">
                      Ce plan vous permet de ne payer qu&apos;en fonction de vos performances. Retenza prélève une commission de <strong className="text-[#17151A]">{commissionRateDisplay || '8%'}</strong> uniquement sur le chiffre d&apos;affaires directement généré par nos relances automatiques par e-mail et SMS.
                    </p>
                  </div>

                  <div className="h-px bg-[#E9E4DD] w-full" />

                  <div>
                    <h3 className="text-[15px] font-bold text-[#17151A] mb-4">Moyen de paiement</h3>
                    <div className="flex items-center justify-between border border-[#E9E4DD] rounded-xl p-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-lg bg-[#F7F4EF] flex items-center justify-center text-[#736C72]">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-[#17151A]">Carte Visa terminant par 4242</p>
                          <p className="text-[12.5px] text-[#736C72] mt-0.5">Expire en 12/2028</p>
                        </div>
                      </div>
                      <button className="text-[13px] font-semibold text-[#C31F3C] hover:underline cursor-pointer">
                        Mettre à jour
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Colonne latérale ── */}
                <div className="flex flex-col gap-[14px]">

                  {/* Card 1 : Chiffre d'affaires du mois */}
                  <div className="bg-white border border-[#E9E4DD] rounded-xl p-[18px]">
                    <p className="text-[11.5px] font-semibold uppercase tracking-wider text-[#736C72] mb-2">Chiffre d&apos;affaires du mois</p>
                    <p className={`text-[22px] font-medium leading-none mb-1 ${revenueDisplay ? 'text-[#C31F3C]' : 'text-[#A39C9F]'}`}>
                      {revenueDisplay ?? '—'}
                    </p>
                    <p className="text-[12px] text-[#A39C9F] mt-1.5 leading-snug">
                      {revenueDisplay ? 'Total des achats validés ce mois-ci' : 'Pas encore de données ce mois-ci'}
                    </p>
                  </div>

                  {/* Card 2 : Anneau de commission */}
                  <div className="bg-white border border-[#E9E4DD] rounded-xl p-[18px] flex flex-col items-center gap-3">
                    <p className="text-[11.5px] font-semibold uppercase tracking-wider text-[#736C72] self-start">Commission ce mois</p>
                    <div className="relative w-[90px] h-[90px]">
                      <svg viewBox="0 0 90 90" className="w-full h-full -rotate-90">
                        <circle cx="45" cy="45" r={radius} fill="none" stroke="#E9E4DD" strokeWidth="6" />
                        <circle
                          cx="45" cy="45" r={radius}
                          fill="none"
                          stroke={commissionRateDisplay ? '#C31F3C' : '#E9E4DD'}
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                          className="transition-all duration-700"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[16px] font-bold text-[#17151A]">
                          {commissionRateDisplay ?? '—'}
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className={`text-[12.5px] font-semibold ${commissionAmountDisplay ? 'text-[#17151A]' : 'text-[#A39C9F]'}`}>
                        {commissionAmountDisplay ?? 'Données indisponibles'}
                      </p>
                      <p className="text-[11.5px] text-[#A39C9F] mt-0.5">Taux appliqué au CA généré</p>
                    </div>
                  </div>

                  {/* Card 3 : Aucun engagement */}
                  <div className="bg-[#FBEAE6] border border-[#F0D0C7] rounded-xl p-[18px]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-[22px] h-[22px] rounded-full bg-[#C31F3C] flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 16 16" className="w-3 h-3 text-white fill-current"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/></svg>
                      </div>
                      <h3 className="text-[13.5px] font-bold text-[#17151A]">Aucun engagement</h3>
                    </div>
                    <p className="text-[12.5px] text-[#736C72] leading-relaxed">
                      Vous pouvez changer ou résilier votre plan à tout moment, sans frais ni préavis.
                    </p>
                  </div>


                </div>
              </div>
            );
          })()}

          {/* TAB: SECURITY */}
        {activeTab === 'security' && (() => {
          const lastLoginDisplay = user?.lastLoginAt 
            ? new Date(user.lastLoginAt).toLocaleDateString('fr-FR', { 
                day: 'numeric', month: 'long', year: 'numeric', 
                hour: '2-digit', minute: '2-digit'
              }) 
            : 'Pas encore de données';
          const ipDisplay = user?.lastLoginIp || 'Pas encore de données';

          return (
            <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-5 items-start animate-in fade-in duration-300">
              
              {/* ── Colonne Principale (Gauche) ── */}
              <div className="bg-white border border-[#E9E4DD] rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <h3 className="text-[16px] font-bold text-[#17151A] mb-6">Mettre à jour le mot de passe</h3>
                
                <div className="space-y-5 max-w-md">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-[#736C72]">Mot de passe actuel</label>
                    <input 
                      type="password" 
                      className="w-full px-3 py-2 bg-white border border-[#E9E4DD] rounded-xl focus:border-[#C31F3C] focus:outline-none transition-colors text-[14px]"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-[#736C72]">Nouveau mot de passe</label>
                    <input 
                      type="password" 
                      className="w-full px-3 py-2 bg-white border border-[#E9E4DD] rounded-xl focus:border-[#C31F3C] focus:outline-none transition-colors text-[14px]"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="pt-2">
                    <button className="px-6 py-2.5 bg-[#C31F3C] hover:bg-[#8A1329] text-white text-[13px] font-bold rounded-xl transition-colors shadow-sm cursor-pointer">
                      Sauvegarder
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Colonne Latérale (Droite) ── */}
              <div className="flex flex-col gap-[16px]">
                
                {/* Card 1 : État de la connexion */}
                <div className="bg-white border border-[#E9E4DD] rounded-xl p-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-[8px] h-[8px] rounded-full bg-[#C31F3C] shadow-[0_0_8px_rgba(195,31,60,0.6)] animate-pulse"></div>
                    <h3 className="text-[15px] font-bold text-[#17151A]">État de la connexion</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-[11.5px] font-semibold uppercase tracking-wider text-[#736C72] mb-1">Dernière connexion</p>
                      <p className={`text-[14px] font-medium ${user?.lastLoginAt ? 'text-[#17151A]' : 'text-[#A39C9F] italic'}`}>
                        {lastLoginDisplay}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11.5px] font-semibold uppercase tracking-wider text-[#736C72] mb-1">Adresse IP</p>
                      <p className={`text-[14px] font-medium ${user?.lastLoginIp ? 'text-[#17151A]' : 'text-[#A39C9F] italic'}`}>
                        {ipDisplay}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card 2 : Bonnes pratiques */}
                <div className="bg-white border border-[#E9E4DD] rounded-xl p-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-[16px] h-[16px] text-[#C31F3C]" />
                    <h3 className="text-[14px] font-bold text-[#17151A]">Bonnes pratiques</h3>
                  </div>
                  <ul className="text-[12.5px] text-[#736C72] leading-relaxed space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-[#C31F3C] mt-0.5">•</span>
                      <span>Utilisez un mot de passe unique contenant des chiffres et caractères spéciaux.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#C31F3C] mt-0.5">•</span>
                      <span>Déconnectez-vous toujours des appareils publics après utilisation.</span>
                    </li>
                  </ul>
                </div>

              </div>
            </div>
          );
        })()}

          {/* TAB: QR CODE */}
          {activeTab === 'qrcode' && (
            <div className="bg-white border border-[#E9E4DD] rounded-2xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] animate-in fade-in duration-300 max-w-2xl mx-auto flex flex-col items-center">
              <div className="bg-white p-6 rounded-2xl border border-[#E9E4DD] shadow-sm mb-6 inline-block">
                {isLoadingQr ? (
                  <div className="w-[220px] h-[220px] flex items-center justify-center text-gray-400 text-sm font-medium animate-pulse">Génération...</div>
                ) : (
                  <QRCode 
                    value={(typeof qrCodeData === 'object' && qrCodeData ? (qrCodeData as any).url : qrCodeData) || 'https://retenza.app'} 
                    size={220}
                    fgColor="#17151A"
                    bgColor="#FFFFFF"
                    level="H"
                  />
                )}
              </div>

              <div className="bg-[#F5D7CD]/70 px-6 py-2.5 rounded-full mb-4 border border-[#F5D7CD]">
                <p className="text-[#C31F3C] font-bold tracking-[0.2em] text-lg">
                  {((typeof qrCodeData === 'object' && qrCodeData) ? (qrCodeData as any).merchantCode : null) || 'CODE'}
                </p>
              </div>

              <p className="text-[#736C72] text-sm text-center max-w-sm mb-8">
                Demandez à vos clients de scanner ce QR Code avec leur application Retenza pour s&apos;inscrire à votre programme et cumuler des avantages.
              </p>

              <button 
                onClick={handleCopyQrUrl}
                className="w-full sm:w-auto px-8 py-3 bg-[#C31F3C] hover:bg-[#8A1329] text-white rounded-xl font-bold flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                Copier le lien
              </button>
            </div>
          )}
        </div>

        {/* ─── 4. BANDEAU DE CONFIANCE (3 CARDS) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 mt-6 sm:mt-8">
          {/* Card 1: Compte vérifié */}
          <div className="bg-[#EDE9E1] border border-[#DFD9CD] rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-[18px] h-[18px] text-[#C31F3C]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[14.5px] font-bold text-[#17151A]">Compte vérifié</h3>
              <p className="text-[12.5px] text-[#736C72] mt-0.5 leading-[1.4]">Votre compte est actif et vérifié.</p>
            </div>
          </div>

          {/* Card 2: Données sécurisées */}
          <div className="bg-[#EDE9E1] border border-[#DFD9CD] rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center shrink-0">
              <Lock className="w-[18px] h-[18px] text-[#C31F3C]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[14.5px] font-bold text-[#17151A]">Données sécurisées</h3>
              <p className="text-[12.5px] text-[#736C72] mt-0.5 leading-[1.4]">Vos informations sont protégées.</p>
            </div>
          </div>

          {/* Card 3: Assistance dédiée */}
          <div className="bg-[#EDE9E1] border border-[#DFD9CD] rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center shrink-0">
              <Headphones className="w-[18px] h-[18px] text-[#C31F3C]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[14.5px] font-bold text-[#17151A]">Assistance dédiée</h3>
              <p className="text-[12.5px] text-[#736C72] mt-0.5 leading-[1.4]">Besoin d&apos;aide ? Contactez-nous.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Hidden file input for Logo Upload */}
      <input 
        type="file" 
        accept="image/png, image/jpeg" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />

      {/* Edit Profile Drawer (Right Side) */}
      {isEditModalOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsEditModalOpen(false)}
          />
          
          <div 
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-[#E9E4DD] flex flex-col animate-in slide-in-from-right duration-300"
          >
            <div className="flex items-center justify-between px-8 py-6 border-b border-[#E9E4DD]">
              <div>
                <h2 className="text-[20px] font-bold text-[#17151A]">Modifier le point de vente</h2>
                <p className="text-[13px] text-[#736C72] mt-1">Mettez à jour vos informations publiques.</p>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="space-y-6">
                
                {/* Logo Preview */}
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-16 h-16 rounded-full bg-[#F5D7CD] text-[#C31F3C] flex items-center justify-center text-xl font-bold border-2 border-white shadow-sm overflow-hidden shrink-0">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                   </div>
                   <div>
                     <button 
                       type="button" 
                       onClick={() => fileInputRef.current?.click()}
                       className="text-[13px] font-semibold text-[#C31F3C] hover:underline transition-colors flex items-center gap-1.5 cursor-pointer"
                     >
                       <Upload className="w-3.5 h-3.5" /> Changer le logo
                     </button>
                     <p className="text-[11px] text-gray-400 mt-1">Recommandé : image carrée.</p>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-[#17151A]">Nom du commerce</label>
                  <input 
                    type="text" 
                    required
                    value={editForm.commerceName}
                    onChange={e => setEditForm({...editForm, commerceName: e.target.value})}
                    className="w-full bg-[#F7F4EF] border border-[#E9E4DD] rounded-xl px-4 py-3 text-[14px] focus:bg-white focus:border-[#C31F3C] outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-[#17151A]">Adresse complète</label>
                  <input 
                    type="text" 
                    value={editForm.address}
                    onChange={e => setEditForm({...editForm, address: e.target.value})}
                    placeholder="Ex: 12 Rue de la Paix, 75002 Paris"
                    className="w-full bg-[#F7F4EF] border border-[#E9E4DD] rounded-xl px-4 py-3 text-[14px] focus:bg-white focus:border-[#C31F3C] outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-[#17151A]">Numéro de téléphone</label>
                  <input 
                    type="tel" 
                    value={editForm.phone}
                    onChange={e => setEditForm({...editForm, phone: e.target.value})}
                    placeholder="Ex: 01 23 45 67 89"
                    className="w-full bg-[#F7F4EF] border border-[#E9E4DD] rounded-xl px-4 py-3 text-[14px] focus:bg-white focus:border-[#C31F3C] outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-2 opacity-70">
                  <label className="text-[13px] font-semibold text-[#17151A] flex items-center justify-between">
                    Adresse e-mail pro
                    <span className="text-[11px] font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">Lecture seule</span>
                  </label>
                  <input 
                    type="email" 
                    value={email}
                    disabled
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-[14px] text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#E9E4DD] bg-[#F7F4EF]/50">
              <form onSubmit={handleSaveProfile} className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 rounded-xl text-[14px] font-semibold text-gray-600 bg-white border border-[#E9E4DD] hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#C31F3C] hover:bg-[#8A1329] text-white text-[14px] font-bold shadow-md transition-all disabled:opacity-70 cursor-pointer"
                >
                  {isSaving ? (
                     <Upload className="w-4 h-4 animate-spin" />
                  ) : (
                     <Save className="w-4 h-4" />
                  )}
                  {isSaving ? 'Patientez...' : 'Enregistrer'}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
