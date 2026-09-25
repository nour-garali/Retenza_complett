'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { triggerReconciliation } from '@/services/reconciliationActions';
import { 
  User, Phone, Mail, MapPin, Pencil, Calendar, Tag, ExternalLink,
  Building2, Hash, Briefcase, Link2, FileText, Lock, QrCode,
  ShieldCheck, Shield, Headphones, Camera, X, Save, Upload, Info, 
  CreditCard, Copy, Zap, TrendingUp, CornerRightDown, RefreshCw,
  CheckCircle, AlertCircle, Star
} from 'lucide-react';

type Tab = 'overview' | 'wallet' | 'security' | 'support';

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

export default function ClientProfilPage() {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  // Security Tab State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Reconciliation state
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<any>(null);
  const [reconcileError, setReconcileError] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '12 Rue de la Paix, 75002 Paris',
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Avatar upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savedAvatar, setSavedAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setEditForm(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: (user as any).phone || '',
      }));
    }
  }, [user]);

  const handleReconcile = async () => {
    setReconciling(true); setReconcileResult(null); setReconcileError(null);
    try {
      const result = await triggerReconciliation();
      if ('error' in result) setReconcileError(result.error);
      else setReconcileResult(result);
    } catch {
      setReconcileError('Une erreur est survenue.');
    } finally {
      setReconciling(false);
    }
  };

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

  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Client Retenza';
  const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`.toUpperCase() || 'CL';
  const email = user?.email || 'client@gmail.com';
  const phone = editForm.phone || (user as any)?.phone || 'Non renseigné';

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F7F4EF]">
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-6 pb-16 w-full flex flex-col">
        
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
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border border-[#E9E4DD] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
                    title="Changer la photo"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#17151A]" />
                  </button>
                </div>
                {/* Title, Badge, Contacts */}
                <div className="flex flex-col gap-2 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-[#17151A] tracking-tight">
                    {fullName}
                  </h2>

                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F5D7CD]/70 text-[#C31F3C] text-[11px] font-semibold">
                      <User className="w-3 h-3" />
                      Client System
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
              {/* Statut */}
              <div className="p-3 sm:px-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg border border-[#E9E4DD] flex items-center justify-center shrink-0 text-[#17151A] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <Star className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[#736C72] uppercase tracking-wider">Statut</p>
                  <p className="text-[13px] sm:text-[14px] font-semibold text-[#17151A] truncate">Membre Vérifié</p>
                </div>
              </div>
              {/* Points cumulés */}
              <div className="p-3 sm:px-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg border border-[#E9E4DD] flex items-center justify-center shrink-0 text-[#17151A] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <Tag className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[#736C72] uppercase tracking-wider">Points cumulés</p>
                  <p className="text-[13px] sm:text-[14px] font-semibold text-[#17151A] truncate">0 points</p>
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
              { id: 'overview', label: 'Informations personnelles', icon: User },
              { id: 'wallet', label: 'Synchronisation Wallet', icon: RefreshCw },
              { id: 'security', label: 'Sécurité & Accès', icon: Lock },
              { id: 'support', label: 'Support & Aide', icon: Headphones },
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
                <InfoGridCell icon={User} label="Prénom" value={user?.firstName || 'Non renseigné'} />
                <InfoGridCell icon={User} label="Nom de famille" value={user?.lastName || 'Non renseigné'} />
                <InfoGridCell icon={Phone} label="Téléphone" value={phone} />
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 border-b border-[#E9E4DD]">
                <InfoGridCell icon={Mail} label="Adresse e-mail" value={email} />
                <InfoGridCell icon={Star} label="Statut du compte" value="Actif - Membre Vérifié" />
                <InfoGridCell icon={Calendar} label="Date d'inscription" value="Janvier 2026" />
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                <InfoGridCell icon={Tag} label="Points cumulés" value="0 points" />
                <InfoGridCell icon={CreditCard} label="Cartes synchronisées" value="0 carte" />
                <InfoGridCell icon={Info} label="Préférences" value="Notifications activées" />
              </div>
            </div>
          )}

          {/* TAB: WALLET */}
          {activeTab === 'wallet' && (
            <div className="bg-white border border-[#E9E4DD] rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] animate-in fade-in duration-300">
              
              {/* ── Content Grid ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                
                {/* Main content (7 columns) */}
                <div className="lg:col-span-7">
                  <div className="flex flex-col gap-6">
                    <div>
                      <h3 className="text-[16px] font-bold text-[#17151A] mb-2">Synchroniser vos cartes de fidélité</h3>
                      <p className="text-[14px] text-[#736C72] leading-relaxed">
                        Si vous avez utilisé des cartes de fidélité chez nos commerçants partenaires avant de finaliser 
                        votre compte, vous pouvez les synchroniser ici. Notre système retrouvera automatiquement vos points.
                      </p>
                    </div>

                    {reconcileResult && (
                      <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                        reconcileResult.mergedCount > 0 
                          ? 'bg-[#F0F8F0] border-[#C8E6C8] text-[#2D5A2D]' 
                          : 'bg-[#F7F4EF] border-[#E9E4DD] text-[#736C72]'
                      }`}>
                        {reconcileResult.mergedCount > 0 ? 
                          <CheckCircle className="w-5 h-5 text-[#2D5A2D] shrink-0" /> : 
                          <AlertCircle className="w-5 h-5 text-[#736C72] shrink-0" />
                        }
                        <p className="text-[13px] font-medium mt-0.5">{reconcileResult.message}</p>
                      </div>
                    )}

                    {reconcileError && (
                      <div className="p-4 rounded-xl bg-[#FDF2F2] border border-[#F5C6C6] text-[#C31F3C] flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-[#C31F3C] shrink-0" />
                        <p className="text-[13px] font-medium">{reconcileError}</p>
                      </div>
                    )}

                    <div>
                      <button 
                        onClick={handleReconcile}
                        disabled={reconciling}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#C31F3C] hover:bg-[#8A1329] text-white text-[13px] font-bold rounded-xl transition-colors disabled:opacity-70 shadow-sm"
                      >
                        <RefreshCw className={`w-4 h-4 ${reconciling ? 'animate-spin' : ''}`} />
                        {reconciling ? 'Synchronisation...' : 'Lancer la synchronisation'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Illustration (5 columns) */}
                <div className="lg:col-span-5 hidden sm:flex items-center justify-end relative min-h-[160px] overflow-visible py-1 pr-0">
                  {/* Sync Illustration Image */}
                  <div className="relative w-full h-full flex items-center justify-end ml-32 mr-[-150px]">
                    <img 
                      src="/sync-illustration.png" 
                      alt="Synchronisation illustration" 
                      className="w-full h-auto max-w-[450px] object-contain"
                    />
                  </div>
                </div>

              </div>
            </div>
          )}
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
                    <div className="grid grid-cols-2 gap-4 w-full">
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
                        <span>Utilisez un mot de passe fort et unique.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#C31F3C] mt-0.5">•</span>
                        <span>Déconnectez-vous des appareils publics.</span>
                      </li>
                    </ul>
                  </div>

                </div>
              </div>
            );
          })()}

          {/* TAB: SUPPORT */}
          {activeTab === 'support' && (
            <div className="bg-white border border-[#F0EBE6] rounded-[28px] p-4 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] animate-in fade-in duration-300 w-full">
              
              {/* ── Header ── */}
              <div className="mb-4">
                <h3 className="text-[16px] sm:text-[18px] font-bold text-[#17151A] tracking-tight leading-tight">
                  Centre d&apos;aide
                </h3>
                <p className="text-[11px] sm:text-[12px] text-[#736C72] mt-1">
                  Consultez notre FAQ ou contactez directement notre équipe support.
                </p>
              </div>

              {/* ── Content Grid ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                
                {/* Actions list (7 columns) */}
                <div className="lg:col-span-7 space-y-3">
                  {/* FAQ */}
                  <div className="flex items-center justify-between p-3 sm:p-4 border border-[#F0EBE6] rounded-2xl bg-white hover:border-[#FEE2E2] hover:shadow-sm transition-all cursor-pointer group">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#FFF5F4] flex items-center justify-center shrink-0 transition-colors">
                        <FileText className="w-4 h-4 text-[#DD2C1F]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-[#17151A] truncate">Questions fréquentes</p>
                        <p className="text-[11.5px] text-[#736C72] mt-0.5 truncate">Trouvez rapidement vos réponses</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0 ml-3" />
                  </div>

                  {/* Contact Support */}
                  <div className="flex items-center justify-between p-3 sm:p-4 border border-[#F0EBE6] rounded-2xl bg-white hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer group">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 transition-colors">
                        <Headphones className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-[#17151A] truncate">Contacter le support</p>
                        <p className="text-[11.5px] text-[#736C72] mt-0.5 truncate">Assistance personnalisée</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0 ml-3" />
                  </div>
                </div>

                {/* Illustration (5 columns) */}
                <div className="lg:col-span-5 hidden sm:flex items-start justify-end relative min-h-[200px] overflow-visible py-0 pr-4">
                  {/* Support Illustration Image */}
                  <div className="relative w-full h-full flex items-start justify-end mt-[-40px] ml-4">
                    <img 
                      src="/support-illustration.png" 
                      alt="Support illustration with phone and headset" 
                      className="w-full h-auto max-w-[320px] object-contain"
                    />
                  </div>
                </div>

              </div>

              {/* ── Footer ── */}
              <div className="mt-2 pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[12px] text-[#736C72]">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">support@retenza.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium">Réponse sous 24h</span>
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
              <Shield className="w-5 h-5 text-[#C31F3C]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[14.5px] font-bold text-[#17151A]">Accès sécurisé</h3>
              <p className="text-[12.5px] text-[#736C72] mt-0.5 leading-[1.4]">Compte administrateur vérifié.</p>
            </div>
          </div>

          {/* Card 2: Contrôle système */}
          <div className="bg-[#EDE9E1] border border-[#DFD9CD] rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#C31F3C]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[14.5px] font-bold text-[#17151A]">Contrôle système</h3>
              <p className="text-[12.5px] text-[#736C72] mt-0.5 leading-[1.4]">Accès complet aux paramètres.</p>
            </div>
          </div>

          {/* Card 3: Support prioritaire */}
          <div className="bg-[#EDE9E1] border border-[#DFD9CD] rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5 text-[#C31F3C]" />
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
        accept="image/png, image/jpeg, image/gif, image/webp" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />

      {/* Edit Profile Drawer (Right Side) */}
      {isEditModalOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsEditModalOpen(false)}
          />
          
          {/* Drawer */}
          <div 
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-[#E9E4DD] flex flex-col animate-in slide-in-from-right duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-[#E9E4DD]">
              <div>
                <h2 className="text-[20px] font-bold text-[#17151A]">Modifier le profil</h2>
                <p className="text-[13px] text-[#736C72] mt-1">Mettez à jour vos informations personnelles.</p>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="w-10 h-10 rounded-full bg-[#F7F4EF] flex items-center justify-center text-[#736C72] hover:bg-[#E9E4DD] hover:text-[#17151A] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="space-y-6">
                
                {/* Avatar Preview */}
                <div className="flex items-center gap-4 mb-8">
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
                       className="text-[13px] font-semibold text-[#C31F3C] hover:text-[#8A1329] transition-colors flex items-center gap-1.5"
                     >
                       <Upload className="w-3.5 h-3.5" /> Changer la photo
                     </button>
                     <p className="text-[11px] text-[#A39C9F] mt-1">JPG, GIF ou PNG. Max 2MB.</p>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-[#736C72]">Prénom</label>
                    <input 
                      type="text" 
                      required
                      value={editForm.firstName}
                      onChange={e => setEditForm({...editForm, firstName: e.target.value})}
                      className="w-full bg-[#F7F4EF] border border-[#E9E4DD] rounded-xl px-4 py-3 text-[14px] focus:bg-white focus:border-[#C31F3C] focus:ring-4 focus:ring-[#C31F3C]/10 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-[#736C72]">Nom</label>
                    <input 
                      type="text" 
                      required
                      value={editForm.lastName}
                      onChange={e => setEditForm({...editForm, lastName: e.target.value})}
                      className="w-full bg-[#F7F4EF] border border-[#E9E4DD] rounded-xl px-4 py-3 text-[14px] focus:bg-white focus:border-[#C31F3C] focus:ring-4 focus:ring-[#C31F3C]/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-[#736C72]">Numéro de téléphone</label>
                  <input 
                    type="tel" 
                    value={editForm.phone}
                    onChange={e => setEditForm({...editForm, phone: e.target.value})}
                    placeholder="Ex: +33 6 12 34 56 78"
                    className="w-full bg-[#F7F4EF] border border-[#E9E4DD] rounded-xl px-4 py-3 text-[14px] focus:bg-white focus:border-[#C31F3C] focus:ring-4 focus:ring-[#C31F3C]/10 outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-2 opacity-70">
                  <label className="text-[13px] font-semibold text-[#736C72] flex items-center justify-between">
                    Adresse e-mail 
                    <span className="text-[11px] font-normal text-[#A39C9F] bg-[#E9E4DD] px-2 py-0.5 rounded-full">Lecture seule</span>
                  </label>
                  <input 
                    type="email" 
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-[#E9E4DD] border border-[#E9E4DD] rounded-xl px-4 py-3 text-[14px] text-[#A39C9F] cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#E9E4DD] bg-[#F7F4EF]">
              <form onSubmit={handleSaveProfile} className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 rounded-xl text-[14px] font-semibold text-[#736C72] bg-white border border-[#E9E4DD] hover:bg-[#F7F4EF] transition-colors shadow-sm"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#C31F3C] hover:bg-[#8A1329] text-white text-[14px] font-semibold shadow-md shadow-[#C31F3C]/20 transition-all disabled:opacity-70 disabled:shadow-none"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
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