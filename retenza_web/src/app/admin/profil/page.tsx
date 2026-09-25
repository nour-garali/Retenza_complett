'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ShieldCheck, Phone, Mail, MapPin, Pencil, Calendar, Tag, ExternalLink,
  Building2, User, Hash, Briefcase, Lock, 
  Shield, Headphones, Camera, X, Save, Upload, Info, 
  CreditCard, Copy, Zap, TrendingUp, CornerRightDown, Settings, Clock, 
  Check, BarChart3, Cog, ChevronRight
} from 'lucide-react';

type Tab = 'overview' | 'preferences' | 'security' | 'audit';

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

export default function AdminProfilPage() {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  // Security Tab State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: 'Siège Social Retenza, Casablanca',
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Avatar / Logo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savedAvatar, setSavedAvatar] = useState<string | null>(null);

  useEffect(() => {
    // Force les données admin pour cette page
    setEditForm(prev => ({
      ...prev,
      firstName: 'Admin',
      lastName: 'System',
      phone: '0522123456',
    }));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        setSavedAvatar(result);
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
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone,
      } as any);
    }
    
    if (avatarPreview) {
      setSavedAvatar(avatarPreview);
    }
    
    setIsSaving(false);
    setIsEditModalOpen(false);
  };
  
  const openEditDrawer = () => {
    setAvatarPreview(savedAvatar);
    setIsEditModalOpen(true);
  };

  const adminName = "Admin System"; // Force nom admin pour cette page
  const initials = "AS"; // Force initiales admin
  const email = 'admin@retenza.com'; // Force admin email pour cette page
  const phone = '0522123456'; // Force téléphone admin
  const createdAt = (user as any)?.createdAt
    ? new Date((user as any).createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : 'Janvier 2026';
  const customUrl = `retenza.app/admin/${adminName.toLowerCase().replace(/\s+/g, '') || 'adminsystem'}`;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F7F4EF]">
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
                    {savedAvatar ? (
                      <img src={savedAvatar} alt="Avatar" className="w-full h-full object-cover" />
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
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border border-[#E9E4DD] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-[#F5D7CD]/20 transition-colors cursor-pointer"
                    title="Changer la photo"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#17151A]" />
                  </button>
                </div>

                {/* Title, Badge, Contacts */}
                <div className="flex flex-col gap-2 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-[#17151A] tracking-tight">
                    {adminName}
                  </h2>

                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F5D7CD]/70 text-[#C31F3C] text-[11px] font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      Super Administrateur
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
                  <p className="text-[11px] font-medium text-[#736C72] uppercase tracking-wider">Localisation</p>
                  <p className="text-[13px] sm:text-[14px] font-semibold text-[#17151A] truncate">{editForm.address}</p>
                </div>
              </div>
              {/* Rôle */}
              <div className="p-3 sm:px-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg border border-[#E9E4DD] flex items-center justify-center shrink-0 text-[#17151A] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <Tag className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[#736C72] uppercase tracking-wider">Fonction</p>
                  <p className="text-[13px] sm:text-[14px] font-semibold text-[#17151A] truncate">Administrateur Système</p>
                </div>
              </div>

              {/* Membre depuis */}
              <div className="p-3 sm:px-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg border border-[#E9E4DD] flex items-center justify-center shrink-0 text-[#17151A] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[#736C72] uppercase tracking-wider">Membre depuis</p>
                  <p className="text-[13px] sm:text-[14px] font-semibold text-[#17151A] truncate">{createdAt}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── 2. BARRE D'ONGLETS ─── */}
          <div className="flex gap-6 sm:gap-8 border-b border-[#E9E4DD] overflow-x-auto no-scrollbar pb-0">
            {[
              { id: 'overview', label: 'Informations générales', icon: MapPin },
              { id: 'preferences', label: 'Préférences & Système', icon: Settings },
              { id: 'security', label: 'Sécurité & Accès', icon: Lock },
              { id: 'audit', label: 'Journal d\'Audit', icon: ShieldCheck },
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
                <InfoGridCell icon={User} label="Prénom" value={editForm.firstName || user?.firstName || 'Admin'} />
                <InfoGridCell icon={User} label="Nom" value={editForm.lastName || user?.lastName || 'System'} />
                <InfoGridCell icon={Phone} label="Téléphone de contact" value={phone} />
              </div>
              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 border-b border-[#E9E4DD]">
                <InfoGridCell icon={Mail} label="Adresse e-mail" value={email} />
                <InfoGridCell icon={MapPin} label="Localisation" value={editForm.address} />
                <InfoGridCell icon={Calendar} label="Membre depuis" value={createdAt} />
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                <InfoGridCell icon={ShieldCheck} label="Niveau d'accès" value="Accès complet" />
                <InfoGridCell icon={Briefcase} label="Rôle système" value="Super Administrateur" />
                <InfoGridCell 
                  icon={Building2} 
                  label="Espace personnel" 
                  value={customUrl}
                  isLink
                  linkHref={`https://${customUrl}`}
                />
              </div>
            </div>
          )}

          {/* TAB: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 animate-in fade-in duration-300">

              {/* ── Colonne principale ── */}
              <div className="bg-white border border-[#E9E4DD] rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-6">
                <div>
                  <h3 className="text-[16px] font-bold text-[#17151A] mb-2">Paramètres Système</h3>
                  <p className="text-[14px] text-[#736C72] leading-relaxed">
                    Configurez l'interface d'administration et gérez les <strong className="text-[#17151A]">notifications système</strong> pour optimiser votre workflow quotidien et celui de votre équipe.
                  </p>
                </div>

                <div className="h-px bg-[#E9E4DD] w-full" />

                <div>
                  <h3 className="text-[15px] font-bold text-[#17151A] mb-4">Préférences d'affichage</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border border-[#E9E4DD] rounded-xl p-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-lg bg-[#F7F4EF] flex items-center justify-center text-[#736C72]">
                          <Settings className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-[#17151A]">Langue de l'interface</p>
                          <p className="text-[12.5px] text-[#736C72] mt-0.5">Français (France)</p>
                        </div>
                      </div>
                      <button className="text-[13px] font-semibold text-[#C31F3C] hover:underline cursor-pointer">
                        Modifier
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between border border-[#E9E4DD] rounded-xl p-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-lg bg-[#F7F4EF] flex items-center justify-center text-[#736C72]">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-[#17151A]">Notifications par e-mail</p>
                          <p className="text-[12.5px] text-[#736C72] mt-0.5">Alertes activées</p>
                        </div>
                      </div>
                      <button className="text-[13px] font-semibold text-[#C31F3C] hover:underline cursor-pointer">
                        Configurer
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Colonne latérale ── */}
              <div className="flex flex-col gap-[14px]">

                {/* Card 1 : Statistiques du système */}
                <div className="bg-white border border-[#E9E4DD] rounded-xl p-[18px]">
                  <p className="text-[11.5px] font-semibold uppercase tracking-wider text-[#736C72] mb-2">Partenaires actifs</p>
                  <p className="text-[22px] font-medium leading-none mb-1 text-[#C31F3C]">
                    247
                  </p>
                  <p className="text-[12px] text-[#A39C9F] mt-1.5 leading-snug">
                    Commerces connectés ce mois-ci
                  </p>
                </div>

                {/* Card 2 : Activité système */}
                <div className="bg-white border border-[#E9E4DD] rounded-xl p-[18px] flex flex-col items-center gap-3">
                  <p className="text-[11.5px] font-semibold uppercase tracking-wider text-[#736C72] self-start">Charge système</p>
                  <div className="relative w-[90px] h-[90px]">
                    <svg viewBox="0 0 90 90" className="w-full h-full -rotate-90">
                      <circle cx="45" cy="45" r="38" fill="none" stroke="#E9E4DD" strokeWidth="6" />
                      <circle
                        cx="45" cy="45" r="38"
                        fill="none"
                        stroke="#C31F3C"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray="238.8"
                        strokeDashoffset="71.64"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[16px] font-bold text-[#17151A]">
                        70%
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[12.5px] font-semibold text-[#17151A]">
                      Utilisation normale
                    </p>
                    <p className="text-[11.5px] text-[#A39C9F] mt-0.5">Performances optimales</p>
                  </div>
                </div>
                {/* Card 3 : Sécurité */}
                <div className="bg-[#FBEAE6] border border-[#F0D0C7] rounded-xl p-[18px]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-[22px] h-[22px] rounded-full bg-[#C31F3C] flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 16 16" className="w-3 h-3 text-white fill-current"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/></svg>
                    </div>
                    <h3 className="text-[13.5px] font-bold text-[#17151A]">Système sécurisé</h3>
                  </div>
                  <p className="text-[12.5px] text-[#736C72] leading-relaxed">
                    Tous les protocoles de sécurité sont actifs et à jour.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TAB: SECURITY */}
          {activeTab === 'security' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-5 items-start animate-in fade-in duration-300">
              
              {/* ── Colonne Principale (Gauche) ── */}
              <div className="bg-white border border-[#E9E4DD] rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <h3 className="text-[16px] font-bold text-[#17151A] mb-6">Mettre à jour le mot de passe</h3>
                
                <div className="space-y-5">
                  <div className="flex flex-col gap-1.5 w-1/2 pr-2">
                    <label className="text-[13px] font-semibold text-[#736C72]">Mot de passe actuel</label>
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoComplete="new-password"
                      className="w-full px-3 py-2 bg-white border border-[#E9E4DD] rounded-xl focus:border-[#C31F3C] focus:outline-none transition-colors text-[14px]"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  {/* Ligne avec 2 colonnes pour les nouveaux mots de passe */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold text-[#736C72]">Nouveau mot de passe</label>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        className="w-full px-3 py-2 bg-white border border-[#E9E4DD] rounded-xl focus:border-[#C31F3C] focus:outline-none transition-colors text-[14px]"
                        placeholder="••••••••"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[13px] font-semibold text-[#736C72]">Confirmer nouveau mdp</label>
                      <input 
                        type="password" 
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        autoComplete="new-password"
                        className="w-full px-3 py-2 bg-white border border-[#E9E4DD] rounded-xl focus:border-[#C31F3C] focus:outline-none transition-colors text-[14px]"
                        placeholder="••••••••"
                      />
                    </div>
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
                      <p className="text-[14px] font-medium text-[#17151A]">
                        Aujourd'hui à 14:32
                      </p>
                    </div>
                    <div>
                      <p className="text-[11.5px] font-semibold uppercase tracking-wider text-[#736C72] mb-1">Adresse IP</p>
                      <p className="text-[14px] font-medium text-[#17151A]">
                        192.168.1.100
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
                      <span>Utilisez un mot de passe fort et unique.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#C31F3C] mt-0.5">•</span>
                      <span>Activez l'authentification à deux facteurs.</span>
                    </li>
                  </ul>
                </div>

              </div>
            </div>
          )}

          {/* TAB: AUDIT */}
          {activeTab === 'audit' && (
            <div className="bg-white border border-[#E9E4DD] rounded-2xl p-6 lg:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04)] animate-in fade-in duration-300 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-0 lg:divide-x divide-[#E9E4DD]">
                
                {/* ── Colonne 1 : Statistiques d'audit ── */}
                <div className="flex flex-col gap-6 lg:pr-8 justify-center">
                  
                  {/* Stat 1 */}
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-[#FDF0ED] flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-[#DD2C1F]" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-[#17151A] mb-1">Actions sécurisées</h4>
                      <p className="text-[12.5px] text-[#736C72] leading-relaxed">
                        Toutes vos interventions sont enregistrées et sécurisées.
                      </p>
                    </div>
                  </div>

                  {/* Stat 2 */}
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-[#FDF0ED] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-[#DD2C1F]" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-[#17151A] mb-1">Traçabilité complète</h4>
                      <p className="text-[12.5px] text-[#736C72] leading-relaxed">
                        Consultez l'historique détaillé de vos modifications système.
                      </p>
                    </div>
                  </div>

                  {/* Stat 3 */}
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-[#FDF0ED] flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5 text-[#DD2C1F]" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-[#17151A] mb-1">Analyses & rapports</h4>
                      <p className="text-[12.5px] text-[#736C72] leading-relaxed">
                        Exportez et analysez les données d'activité système.
                      </p>
                    </div>
                  </div>

                </div>

                {/* ── Colonne 2 : Actions récentes ── */}
                <div className="flex flex-col justify-center lg:px-6">
                  <div className="bg-white p-5 rounded-2xl border border-[#E9E4DD] shadow-sm w-full">
                    
                    {/* Header avec icône horloge */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-full bg-[#FDF0ED] flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-[#DD2C1F]" />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-[#17151A]">Actions récentes</h4>
                        <p className="text-[11px] text-[#736C72] mt-0.5">Dernières modifications de votre système</p>
                      </div>
                    </div>

                    {/* Timeline verticale */}
                    <div className="relative mt-4">
                      {/* Ligne verticale */}
                      <div className="absolute left-[3px] top-4 bottom-4 w-px bg-[#E9E4DD]"></div>
                      
                      <div className="space-y-3">
                        {/* Action 1 - Partenaire activé */}
                        <div className="relative pl-5 flex items-center">
                          {/* Point timeline */}
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white z-10" />
                          
                          <div className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-50 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                <Check className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[12.5px] font-bold text-[#17151A] truncate">Partenaire activé</p>
                                <div className="flex items-center gap-1 mt-0.5 text-[10.5px] text-[#736C72]">
                                  <Clock className="w-3 h-3 text-[#736C72] shrink-0" />
                                  <span>Il y a 2h</span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#736C72] group-hover:text-[#17151A] transition-colors shrink-0 ml-2" />
                          </div>
                        </div>
                        
                        {/* Action 2 - Export généré */}
                        <div className="relative pl-5 flex items-center">
                          {/* Point timeline */}
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#DD2C1F] ring-2 ring-white z-10" />
                          
                          <div className="w-full flex items-center justify-between p-3 rounded-xl bg-[#FFF5F4] border border-[#FEE2E2] hover:bg-[#FEE2E2]/60 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[#DD2C1F] shrink-0">
                                <BarChart3 className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[12.5px] font-bold text-[#17151A] truncate">Export généré</p>
                                <div className="flex items-center gap-1 mt-0.5 text-[10.5px] text-[#736C72]">
                                  <Clock className="w-3 h-3 text-[#736C72] shrink-0" />
                                  <span>Hier, 16h42</span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#736C72] group-hover:text-[#17151A] transition-colors shrink-0 ml-2" />
                          </div>
                        </div>
                        
                        {/* Action 3 - Paramètre modifié */}
                        <div className="relative pl-5 flex items-center">
                          {/* Point timeline */}
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#736C72] ring-2 ring-white z-10" />
                          
                          <div className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/70 hover:bg-gray-100/60 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-gray-200/80 flex items-center justify-center text-gray-600 shrink-0">
                                <Cog className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[12.5px] font-bold text-[#17151A] truncate">Paramètre modifié</p>
                                <div className="flex items-center gap-1 mt-0.5 text-[10.5px] text-[#736C72]">
                                  <Clock className="w-3 h-3 text-[#736C72] shrink-0" />
                                  <span>06 Sept, 10h15</span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#736C72] group-hover:text-[#17151A] transition-colors shrink-0 ml-2" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bouton Voir tout l'historique */}
                    <button className="w-full mt-4 py-2.5 px-4 bg-[#FFF5F4] hover:bg-[#FEE2E2] text-[#DD2C1F] rounded-xl font-bold flex items-center justify-center gap-1.5 border border-[#FEE2E2] text-[12px] transition-all cursor-pointer">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Voir tout l'historique</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* ── Colonne 3 : Illustration ── */}
                <div className="hidden lg:flex flex-col items-center justify-center lg:pl-8 relative min-h-[300px]">
                  
                  {/* Decorative Background */}
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                    <div className="absolute w-20 h-20 bg-[#F5D7CD]/30 rounded-[40px] blur-xl top-8 right-4"></div>
                    <div className="absolute w-32 h-24 bg-[#F5D7CD]/20 rounded-[50px] blur-2xl bottom-4 left-4"></div>
                    {/* SVG Sparks */}
                    <svg className="absolute w-full h-full text-[#F5D7CD]" viewBox="0 0 200 200" fill="none">
                      <path d="M20 70 Q 30 60 40 70" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      <path d="M160 120 Q 170 110 180 120" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="150" cy="50" r="3" fill="currentColor" />
                      <circle cx="40" cy="140" r="4" fill="currentColor" />
                    </svg>
                  </div>

                  {/* Text & Arrow */}
                  <div className="absolute top-2 right-4 transform rotate-[-8deg] flex flex-col items-end z-20">
                    <p className="font-fraunces italic font-bold text-[#C31F3C] text-[20px] leading-[1.1] text-right w-[180px]">
                      Contrôle total et sécurisé
                    </p>
                    <CornerRightDown className="w-5 h-5 text-[#C31F3C] mt-1 mr-8 opacity-80" strokeWidth={2.5} />
                  </div>
                  {/* Admin Dashboard Mockup */}
                  <div className="w-[130px] h-[260px] bg-white rounded-[24px] border-[5px] border-[#FBEAE6] shadow-[12px_24px_40px_rgba(195,31,60,0.06)] transform rotate-12 flex flex-col items-center pt-8 px-4 relative z-10 mt-14">
                    {/* Screen inner content */}
                    <div className="w-full h-full border border-[#E9E4DD] rounded-[14px] bg-[#F7F4EF]/40 flex flex-col items-center pt-6 gap-5">
                      {/* Fake Admin Icon */}
                      <div className="w-14 h-14 bg-[#F5D7CD]/50 rounded-xl flex items-center justify-center shadow-sm">
                        <ShieldCheck className="w-7 h-7 text-[#C31F3C]" />
                      </div>
                      {/* Fake text lines */}
                      <div className="flex flex-col gap-2.5 w-full items-center mt-2">
                        <div className="w-12 h-1.5 bg-[#E9E4DD] rounded-full"></div>
                        <div className="w-16 h-1.5 bg-[#E9E4DD] rounded-full"></div>
                        <div className="w-14 h-1.5 bg-[#E9E4DD] rounded-full"></div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}
        </div>

        {/* ─── 4. BANDEAU DE CONFIANCE (3 CARDS) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 mt-6 sm:mt-8">
          {/* Card 1: Accès sécurisé */}
          <div className="bg-[#EDE9E1] border border-[#DFD9CD] rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-[18px] h-[18px] text-[#C31F3C]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[14.5px] font-bold text-[#17151A]">Accès sécurisé</h3>
              <p className="text-[12.5px] text-[#736C72] mt-0.5 leading-[1.4]">Compte administrateur vérifié.</p>
            </div>
          </div>

          {/* Card 2: Contrôle système */}
          <div className="bg-[#EDE9E1] border border-[#DFD9CD] rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center shrink-0">
              <Settings className="w-[18px] h-[18px] text-[#C31F3C]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[14.5px] font-bold text-[#17151A]">Contrôle système</h3>
              <p className="text-[12.5px] text-[#736C72] mt-0.5 leading-[1.4]">Accès complet aux paramètres.</p>
            </div>
          </div>

          {/* Card 3: Support prioritaire */}
          <div className="bg-[#EDE9E1] border border-[#DFD9CD] rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center shrink-0">
              <Headphones className="w-[18px] h-[18px] text-[#C31F3C]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[14.5px] font-bold text-[#17151A]">Support prioritaire</h3>
              <p className="text-[12.5px] text-[#736C72] mt-0.5 leading-[1.4]">Assistance technique dédiée.</p>
            </div>
          </div>
        </div>

      </div>
      {/* Hidden file input for Avatar Upload */}
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
                <h2 className="text-[20px] font-bold text-[#17151A]">Modifier le profil</h2>
                <p className="text-[13px] text-[#736C72] mt-1">Mettez à jour vos informations administrateur.</p>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="w-10 h-10 rounded-full bg-[#F7F4EF] flex items-center justify-center text-[#736C72] hover:bg-[#F5D7CD]/20 hover:text-[#17151A] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="space-y-6">
                
                {/* Avatar Preview */}
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-16 h-16 rounded-full bg-[#F5D7CD] text-[#C31F3C] flex items-center justify-center text-xl font-bold border-2 border-white shadow-sm overflow-hidden shrink-0">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
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
                       <Upload className="w-3.5 h-3.5" /> Changer l'avatar
                     </button>
                     <p className="text-[11px] text-gray-400 mt-1">Recommandé : image carrée.</p>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-[#17151A]">Prénom</label>
                  <input 
                    type="text" 
                    required
                    value={editForm.firstName}
                    onChange={e => setEditForm({...editForm, firstName: e.target.value})}
                    className="w-full bg-[#F7F4EF] border border-[#E9E4DD] rounded-xl px-4 py-3 text-[14px] focus:bg-white focus:border-[#C31F3C] outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-[#17151A]">Nom</label>
                  <input 
                    type="text" 
                    required
                    value={editForm.lastName}
                    onChange={e => setEditForm({...editForm, lastName: e.target.value})}
                    className="w-full bg-[#F7F4EF] border border-[#E9E4DD] rounded-xl px-4 py-3 text-[14px] focus:bg-white focus:border-[#C31F3C] outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-[#17151A]">Localisation</label>
                  <input 
                    type="text" 
                    value={editForm.address}
                    onChange={e => setEditForm({...editForm, address: e.target.value})}
                    placeholder="Ex: Siège Social Retenza, Casablanca"
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
                    Adresse e-mail
                    <span className="text-[11px] font-normal text-[#736C72] bg-[#F7F4EF] px-2 py-0.5 rounded-full">Lecture seule</span>
                  </label>
                  <input 
                    type="email" 
                    value={email}
                    disabled
                    className="w-full bg-[#F7F4EF]/70 border border-[#E9E4DD] rounded-xl px-4 py-3 text-[14px] text-[#736C72] cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#E9E4DD] bg-[#F7F4EF]/50">
              <form onSubmit={handleSaveProfile} className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 rounded-xl text-[14px] font-semibold text-[#736C72] bg-white border border-[#E9E4DD] hover:bg-[#F7F4EF] transition-colors shadow-sm cursor-pointer"
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