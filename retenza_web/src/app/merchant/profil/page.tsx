'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getMerchantQr } from '@/services/merchantDashboardActions';
import QRCode from 'react-qr-code';
import { 
  Store, Phone, Mail, MapPin, Edit2, Shield, CreditCard, 
  Camera, Settings, X, Save, Upload, Info, QrCode, Copy
} from 'lucide-react';

type Tab = 'overview' | 'billing' | 'security' | 'qrcode';

function DataField({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-gray-500">{label}</span>
      <span className="text-[14px] font-medium text-gray-900">{value}</span>
    </div>
  );
}

function Chip({ icon: Icon, text, highlight = false }: { icon: React.ElementType, text: string, highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${highlight ? 'bg-[#FCE7DD]' : 'bg-gray-100'}`}>
        <Icon className={`w-3 h-3 ${highlight ? 'text-[#D73E26]' : 'text-gray-500'}`} />
      </div>
      <span className={`text-[13px] font-medium ${highlight ? 'text-[#D73E26]' : 'text-gray-600'}`}>{text}</span>
    </div>
  );
}

export default function MerchantProfilPage() {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // QR Code State
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    commerceName: '',
    phone: '',
    address: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Avatar / Logo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [savedLogo, setSavedLogo] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setEditForm({
        commerceName: (user as any).commerceName || 'Mon Commerce',
        phone: (user as any).phone || '',
        address: '12 Rue de la Paix, 75002 Paris', // mock address
      });
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        
        if (!isEditModalOpen) {
          setSavedLogo(result);
        }
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

  const commerceName = (user as any)?.commerceName || 'Mon Commerce';
  const initials = commerceName.charAt(0).toUpperCase() || 'M';
  const email = user?.email || 'contact@commerce.com';
  const phone = (user as any)?.phone || 'Non renseigné';

  const handleCopyQrUrl = () => {
    const urlToCopy = typeof qrCodeData === 'string' ? 'https://retenza.app' : ((qrCodeData as any)?.url || 'https://retenza.app');
    navigator.clipboard.writeText(urlToCopy);
    alert('Lien copié !');
  };

  return (
    <>
      {/* Full bleed white background like client profile */}
      <div className="-mt-8 -mx-6 lg:-mx-8 -mb-12 bg-white min-h-[calc(100vh-72px)] pb-16">
        
        {/* 1. Cover Banner */}
        <div className="max-w-[1040px] mx-auto px-6 lg:px-8 pt-6 lg:pt-8">
          <div className="h-40 bg-gradient-to-r from-[#FFF5F2] to-[#FFF8F5] relative overflow-hidden rounded-3xl border border-[#FCE7DD]/60">
            <div className="absolute right-[10%] -bottom-12 w-48 h-48 border border-[#FCE7DD] rounded-full" />
            <div className="absolute right-[25%] -bottom-6 w-32 h-32 border border-[#FCE7DD] rounded-full" />
          </div>
        </div>

        {/* 2. Content Container */}
        <div className="max-w-[1040px] mx-auto px-6 lg:px-8">
          
          {/* Avatar & Header Info */}
          <div className="pb-10">
            
            <div className="flex justify-between items-end mb-6">
              <div className="-mt-16 relative ml-2 sm:ml-6">
                <div className="w-32 h-32 rounded-full bg-[#FCE7DD] text-[#D73E26] flex items-center justify-center text-4xl font-bricolage font-bold border-[6px] border-white shadow-sm overflow-hidden relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  {savedLogo ? (
                    <img src={savedLogo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white mb-1" />
                    <span className="text-white text-[11px] font-semibold">Changer</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={openEditDrawer}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm bg-white mt-4 sm:mt-0"
              >
                <Edit2 className="w-4 h-4" /> Modifier les infos
              </button>
            </div>

            {/* Name & Bio */}
            <div className="mb-6 ml-2 sm:ml-6">
              <h1 className="text-[28px] font-bold text-gray-900 mb-2">{commerceName}</h1>
              <p className="text-[14px] text-gray-500 max-w-2xl leading-relaxed">
                Gérez les informations de votre point de vente, vos coordonnées de facturation et vos paramètres de sécurité. 
                Ces informations garantissent le bon fonctionnement de votre programme de fidélité Retenza.
              </p>
            </div>

            {/* Information Chips */}
            <div className="flex flex-wrap items-center gap-6 ml-2 sm:ml-6">
              <Chip icon={Mail} text={email} />
              <Chip icon={Phone} text={phone} />
              <Chip icon={Store} text="Commerçant Partenaire" highlight />
            </div>

          </div>

          {/* 3. Subtle Inner Tabs */}
          <div className="flex gap-8 border-b border-gray-100 ml-2 sm:ml-6 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Informations générales' },
              { id: 'billing', label: 'Facturation & Plan' },
              { id: 'security', label: 'Sécurité & Accès' },
              { id: 'qrcode', label: 'Code QR & PLV' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`pb-4 text-[14px] font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-[#D73E26] text-[#D73E26]' 
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 4. Tab Content Area */}
          <div className="py-10 ml-2 sm:ml-6">
            
            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="animate-in fade-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-10 gap-x-12">
                  <DataField label="Nom de l'établissement" value={commerceName} />
                  <DataField label="Responsable" value={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || '—'} />
                  <DataField label="Téléphone de contact" value={phone} />
                  
                  <DataField label="Adresse e-mail pro" value={email} />
                  <DataField label="Adresse postale" value={editForm.address} />
                  <DataField label="Date de souscription" value="Janvier 2026" />

                  <DataField label="Numéro SIRET" value="123 456 789 00012" />
                  <DataField label="Secteur d'activité" value="Café / Restauration" />
                  <DataField label="Lien personnalisé" value={<span className="text-[#D73E26] hover:underline cursor-pointer">retenza.app/c/{commerceName.toLowerCase().replace(/\s+/g, '')}</span>} />
                </div>
              </div>
            )}

            {/* TAB: BILLING */}
            {activeTab === 'billing' && (
              <div className="animate-in fade-in duration-300 max-w-3xl">
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-[16px] font-bold text-gray-900 mb-2">Plan Résultat</h3>
                    <p className="text-[14px] text-gray-500 leading-relaxed">
                      Vous êtes actuellement sur la tarification à la performance. Vous ne payez que lorsque Retenza vous fait gagner de l'argent de manière prouvée.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 text-gray-700 flex items-start gap-3">
                    <Info className="w-5 h-5 text-gray-400 shrink-0" />
                    <p className="text-[13px] font-medium mt-0.5">Les commissions sont prélevées mensuellement sur le chiffre d'affaires généré par les relances automatiques.</p>
                  </div>

                  <div>
                    <h3 className="text-[16px] font-bold text-gray-900 mb-6 mt-4">Moyen de paiement</h3>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-[14px] font-medium text-gray-900">Visa terminant par 4242</p>
                            <p className="text-[12px] text-gray-500">Expire en 12/2028</p>
                          </div>
                        </div>
                        <button className="text-[13px] font-semibold text-gray-500 hover:text-gray-900">Modifier</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SECURITY */}
            {activeTab === 'security' && (
              <div className="animate-in fade-in duration-300 max-w-md">
                <h3 className="text-[16px] font-bold text-gray-900 mb-6">Mettre à jour le mot de passe</h3>
                
                <div className="space-y-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-gray-500">Mot de passe actuel</label>
                    <input 
                      type="password" 
                      className="w-full px-0 py-2 border-b border-gray-200 focus:border-[#D73E26] focus:outline-none transition-colors text-[14px] bg-transparent"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[13px] font-semibold text-gray-500">Nouveau mot de passe</label>
                    <input 
                      type="password" 
                      className="w-full px-0 py-2 border-b border-gray-200 focus:border-[#D73E26] focus:outline-none transition-colors text-[14px] bg-transparent"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="pt-4">
                    <button className="px-6 py-2.5 bg-[#D73E26] hover:bg-[#C0321C] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-sm">
                      Sauvegarder
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: QR CODE */}
            {activeTab === 'qrcode' && (
              <div className="animate-in fade-in duration-300 max-w-2xl mx-auto">
                <div className="bg-white rounded-[32px] border border-[#EDE5DF] p-8 sm:p-12 shadow-sm flex flex-col items-center">
                  {/* QR Code Area */}
                  <div className="bg-white p-6 rounded-3xl border border-[#EDE5DF] shadow-[0_8px_24px_rgba(24,16,11,0.04)] mb-8 inline-block">
                    {isLoadingQr ? (
                      <div className="w-[240px] h-[240px] flex items-center justify-center text-gray-400 text-sm font-medium animate-pulse">Génération...</div>
                    ) : (
                      <QRCode 
                        value={(typeof qrCodeData === 'object' && qrCodeData ? (qrCodeData as any).url : qrCodeData) || 'https://retenza.app'} 
                        size={240}
                        fgColor="#18100B"
                        bgColor="#FFFFFF"
                        level="H"
                      />
                    )}
                  </div>

                  <div className="bg-[#FBE9E7] px-6 py-3 rounded-full mb-6">
                    <p className="text-[#D0392A] font-space font-bold tracking-[0.2em] text-xl">
                      {((typeof qrCodeData === 'object' && qrCodeData) ? (qrCodeData as any).merchantCode : null) || 'CODE'}
                    </p>
                  </div>

                  <p className="text-[#6B5B52] text-sm text-center max-w-sm mb-10">
                    Demandez à vos clients de scanner ce QR Code avec leur application Retenza pour s'inscrire à votre programme et cumuler des avantages.
                  </p>

                  <button 
                    onClick={handleCopyQrUrl}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-br from-[#E04030] to-[#9E2B1E] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-[0_8px_20px_rgba(208,57,42,0.25)] hover:scale-[1.02] transition-transform"
                  >
                    <Copy className="w-5 h-5" />
                    Copier le lien
                  </button>
                </div>
              </div>
            )}


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
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-gray-100 flex flex-col animate-in slide-in-from-right duration-300"
          >
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
              <div>
                <h2 className="text-[20px] font-bricolage font-bold text-[#1B100C]">Modifier le point de vente</h2>
                <p className="text-[13px] text-gray-500 mt-1">Mettez à jour vos informations publiques.</p>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="space-y-6">
                
                {/* Logo Preview */}
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-16 h-16 rounded-full bg-[#FCE7DD] text-[#D73E26] flex items-center justify-center text-xl font-bricolage font-bold border-2 border-white shadow-sm overflow-hidden shrink-0">
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
                       className="text-[13px] font-semibold text-[#D73E26] hover:text-[#C0321C] transition-colors flex items-center gap-1.5"
                     >
                       <Upload className="w-3.5 h-3.5" /> Changer le logo
                     </button>
                     <p className="text-[11px] text-gray-400 mt-1">Recommandé : image carrée.</p>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-700">Nom du commerce</label>
                  <input 
                    type="text" 
                    required
                    value={editForm.commerceName}
                    onChange={e => setEditForm({...editForm, commerceName: e.target.value})}
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] focus:bg-white focus:border-[#D73E26] focus:ring-4 focus:ring-[#D73E26]/10 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-700">Adresse complète</label>
                  <input 
                    type="text" 
                    value={editForm.address}
                    onChange={e => setEditForm({...editForm, address: e.target.value})}
                    placeholder="Ex: 12 Rue de la Paix, 75002 Paris"
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] focus:bg-white focus:border-[#D73E26] focus:ring-4 focus:ring-[#D73E26]/10 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-700">Numéro de téléphone</label>
                  <input 
                    type="tel" 
                    value={editForm.phone}
                    onChange={e => setEditForm({...editForm, phone: e.target.value})}
                    placeholder="Ex: 01 23 45 67 89"
                    className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] focus:bg-white focus:border-[#D73E26] focus:ring-4 focus:ring-[#D73E26]/10 outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-2 opacity-70">
                  <label className="text-[13px] font-semibold text-gray-700 flex items-center justify-between">
                    Adresse e-mail pro
                    <span className="text-[11px] font-normal text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">Lecture seule</span>
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

            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
              <form onSubmit={handleSaveProfile} className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 rounded-xl text-[14px] font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#D73E26] hover:bg-[#C0321C] text-white text-[14px] font-semibold shadow-md shadow-[#D73E26]/20 transition-all disabled:opacity-70 disabled:shadow-none"
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
    </>
  );
}
