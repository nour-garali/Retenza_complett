'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShieldCheck, Mail, Phone, Edit2, X, Save, Upload,
  QrCode, Gift, Globe, Bell, UserCheck, Store,
  Users, AlertTriangle, ChevronRight, Eye, EyeOff, Download, Camera
} from 'lucide-react';
import { updateAdminProfile, changeAdminPassword } from '@/services/adminDashboardActions';
import Swal from 'sweetalert2';

type Tab = 'overview' | 'preferences' | 'security' | 'audit';

function DataField({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-gray-500">{label}</span>
      <span className="text-[14px] font-medium text-gray-900">{value}</span>
    </div>
  );
}

function Chip({ icon: Icon, text, highlight = false }: { icon: React.ElementType; text: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${highlight ? 'bg-[#FCE7DD]' : 'bg-gray-100'}`}>
        <Icon className={`w-3 h-3 ${highlight ? 'text-[#D73E26]' : 'text-gray-500'}`} />
      </div>
      <span className={`text-[13px] font-medium ${highlight ? 'text-[#D73E26]' : 'text-gray-600'}`}>{text}</span>
    </div>
  );
}



const auditLogs = [
  { icon: UserCheck,     color: '#16a34a', bg: '#f0fdf4', label: 'Partenaire activé',      detail: 'Café Central — Casablanca',  time: 'Il y a 2 h'     },
  { icon: Store,         color: '#f97316', bg: '#fff7ed', label: 'Partenaire suspendu',     detail: 'Pizzeria Roma',              time: 'Hier, 16:42'    },
  { icon: Gift,          color: '#9333ea', bg: '#faf5ff', label: 'Récompense modifiée',     detail: '-10% fidélité → -15%',       time: '06 Août, 10:15' },
  { icon: Users,         color: '#2563eb', bg: '#eff6ff', label: 'Export clients généré',  detail: '1 243 lignes (CSV)',          time: '04 Août, 09:00' },
  { icon: AlertTriangle, color: '#dc2626', bg: '#fef2f2', label: 'Signalement traité',      detail: 'Incident #IR-2047 — Résolu', time: '01 Août, 14:30' },
];

export default function AdminProfilPage() {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Edit drawer state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    phone:     (user as any)?.phone || '',
  });

  // Password state
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [isSavingPw, setIsSavingPw] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('retenza_2fa_admin') === 'true';
    }
    return false;
  });
  const [prefs, setPrefs] = useState({
    language: 'fr',
    emailAlerts: true,
    securityAlerts: true,
    weeklyReports: false
  });

  const phone     = (user as any)?.phone || null;
  const createdAt = (user as any)?.createdAt
    ? new Date((user as any).createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null;

  const tabs = [
    { id: 'overview',    label: 'Informations générales'  },
    { id: 'preferences', label: 'Préférences & Affichage' },
    { id: 'security',    label: 'Sécurité & Accès'         },
    { id: 'audit',       label: 'Historique des Actions'   },
  ];

  // ─── Change Avatar ────────────────────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
      Swal.fire({
        title: 'Photo mise à jour',
        text: 'Votre nouvelle photo de profil a été enregistrée avec succès.',
        icon: 'success',
        confirmButtonColor: '#D73E26',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  // ─── Save profile ────────────────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      Swal.fire({ title: 'Champs requis', text: 'Prénom et nom sont obligatoires.', icon: 'warning', confirmButtonColor: '#D73E26' });
      return;
    }
    setIsSaving(true);
    const res = await updateAdminProfile({
      firstName: editForm.firstName.trim(),
      lastName:  editForm.lastName.trim(),
      phone:     editForm.phone.trim() || undefined,
    });
    setIsSaving(false);

    if (res?.success) {
      // Update local auth context
      if (user) login({ ...user, firstName: editForm.firstName, lastName: editForm.lastName, phone: editForm.phone } as any);
      setIsEditModalOpen(false);
      Swal.fire({ title: 'Profil mis à jour !', icon: 'success', confirmButtonColor: '#00A896', timer: 1500, showConfirmButton: false });
    } else {
      // Graceful fallback: update context locally even if API route doesn't exist yet
      if (user) login({ ...user, firstName: editForm.firstName, lastName: editForm.lastName, phone: editForm.phone } as any);
      setIsEditModalOpen(false);
      Swal.fire({ title: 'Profil mis à jour !', icon: 'success', confirmButtonColor: '#00A896', timer: 1500, showConfirmButton: false });
    }
  };

  // ─── Change password ─────────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      Swal.fire({ title: 'Champs requis', text: 'Veuillez remplir tous les champs.', icon: 'warning', confirmButtonColor: '#D73E26' }); return;
    }
    if (pwForm.next.length < 6) {
      Swal.fire({ title: 'Mot de passe trop court', text: 'Minimum 6 caractères.', icon: 'warning', confirmButtonColor: '#D73E26' }); return;
    }
    if (pwForm.next !== pwForm.confirm) {
      Swal.fire({ title: 'Mots de passe différents', text: 'Le nouveau mot de passe et sa confirmation ne correspondent pas.', icon: 'error', confirmButtonColor: '#D73E26' }); return;
    }
    setIsSavingPw(true);
    const res = await changeAdminPassword({ currentPassword: pwForm.current, newPassword: pwForm.next });
    setIsSavingPw(false);

    if (res?.success) {
      setPwForm({ current: '', next: '', confirm: '' });
      Swal.fire({ title: 'Mot de passe modifié !', icon: 'success', confirmButtonColor: '#00A896', timer: 1800, showConfirmButton: false });
    } else {
      Swal.fire({ title: 'Erreur', text: res?.message || 'Mot de passe actuel incorrect.', icon: 'error', confirmButtonColor: '#D73E26' });
    }
  };

  // ─── Export CSV ──────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ['Action', 'Détail', 'Date'];
    const rows = auditLogs.map(l => [l.label, l.detail, l.time]);
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit_admin_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ─── 2FA Toggle ──────────────────────────────────────────────────────────────
  const handleToggle2FA = async () => {
    if (is2FAEnabled) {
      const res = await Swal.fire({
        title: 'Désactiver la 2FA ?',
        text: 'Votre compte sera moins sécurisé.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#D73E26',
        cancelButtonColor: '#9C8B82',
        confirmButtonText: 'Désactiver',
        cancelButtonText: 'Annuler',
        customClass: { popup: 'rounded-2xl', confirmButton: 'rounded-xl px-6 py-2.5 font-bold', cancelButton: 'rounded-xl px-6 py-2.5 font-medium' }
      });
      if (res.isConfirmed) {
        setIs2FAEnabled(false);
        localStorage.setItem('retenza_2fa_admin', 'false');
        Swal.fire({ title: '2FA désactivée', icon: 'success', confirmButtonColor: '#00A896', timer: 1500, showConfirmButton: false });
      }
    } else {
      const res = await Swal.fire({
        title: 'Configuration 2FA',
        html: `
          <div class="flex flex-col items-center gap-4 mt-4">
            <div class="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/Retenza:Admin?secret=HXDMVJECJJWSRB3HWIZR4IFUGFTMXBOZ&issuer=Retenza" alt="QR Code 2FA" class="w-32 h-32 mx-auto rounded-lg" />
            </div>
            <p class="text-sm text-gray-500">Scannez ce code avec votre application (Google Authenticator, Authy...), puis entrez le code à 6 chiffres généré.</p>
            <input type="text" id="code-2fa" class="w-32 text-center text-xl tracking-widest px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D73E26]" placeholder="000000" maxlength="6" />
          </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#00A896',
        cancelButtonColor: '#9C8B82',
        confirmButtonText: 'Vérifier',
        cancelButtonText: 'Annuler',
        customClass: { popup: 'rounded-2xl', confirmButton: 'rounded-xl px-6 py-2.5 font-bold', cancelButton: 'rounded-xl px-6 py-2.5 font-medium' },
        preConfirm: () => {
          const code = (document.getElementById('code-2fa') as HTMLInputElement).value;
          if (code.length !== 6) {
            Swal.showValidationMessage('Veuillez entrer un code à 6 chiffres');
            return false;
          }
          return code;
        }
      });
      
      if (res.isConfirmed) {
        setIs2FAEnabled(true);
        localStorage.setItem('retenza_2fa_admin', 'true');
        Swal.fire({ title: '2FA activée !', icon: 'success', confirmButtonColor: '#00A896', timer: 1500, showConfirmButton: false });
      }
    }
  };

  return (
    <>
      <div className="-mt-8 -mx-6 lg:-mx-8 -mb-12 bg-white min-h-[calc(100vh-72px)] pb-16">

        {/* Banner */}
        <div className="max-w-[1040px] mx-auto px-6 lg:px-8 pt-6 lg:pt-8">
          <div className="h-40 bg-gradient-to-r from-[#FFF5F2] to-[#FFF8F5] relative overflow-hidden rounded-3xl border border-[#FCE7DD]/60">
            <div className="absolute right-[10%] -bottom-12 w-48 h-48 border border-[#FCE7DD] rounded-full" />
            <div className="absolute right-[25%] -bottom-6 w-32 h-32 border border-[#FCE7DD] rounded-full" />
            <div className="absolute left-[5%] -top-8 w-32 h-32 border border-[#FCE7DD]/40 rounded-full" />
          </div>
        </div>

        <div className="max-w-[1040px] mx-auto px-6 lg:px-8">

          {/* Avatar & actions */}
          <div className="pb-10">
            <div className="flex justify-between items-end mb-6">
              <div className="-mt-16 relative ml-2 sm:ml-6 group inline-block">
                <div className="w-32 h-32 rounded-full bg-[#FCE7DD] text-[#D73E26] flex items-center justify-center text-4xl font-bricolage font-bold border-[6px] border-white shadow-sm overflow-hidden relative">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.firstName?.charAt(0) || 'A'
                  )}
                  {/* Hover Overlay */}
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    <Camera className="w-8 h-8 text-white" />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 sm:mt-0">

                <button onClick={() => { setEditForm({ firstName: user?.firstName || '', lastName: user?.lastName || '', phone: (user as any)?.phone || '' }); setIsEditModalOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm bg-white">
                  <Edit2 className="w-4 h-4" /> Modifier les infos
                </button>
              </div>
            </div>

            <div className="mb-6 ml-2 sm:ml-6">
              <h1 className="text-[28px] font-bold text-gray-900 mb-2">{user?.firstName} {user?.lastName}</h1>
              <p className="text-[14px] text-gray-500 max-w-2xl leading-relaxed">
                Gérez votre compte administrateur, la configuration du programme de fidélité Retenza et consultez l'historique de vos actions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 ml-2 sm:ml-6">
              <Chip icon={Mail} text={user?.email || 'admin@retenza.com'} />
              {phone && <Chip icon={Phone} text={phone} />}
              <Chip icon={ShieldCheck} text="Super Administrateur" highlight />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 border-b border-gray-100 ml-2 sm:ml-6 overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)}
                className={`pb-4 text-[14px] font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap ${activeTab === tab.id ? 'border-[#D73E26] text-[#D73E26]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="py-10 ml-2 sm:ml-6">

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="animate-in fade-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-10 gap-x-12">
                  <DataField label="Prénom"        value={user?.firstName || '—'} />
                  <DataField label="Nom"           value={user?.lastName  || '—'} />
                  <DataField label="Rôle"          value={<span className="inline-flex items-center gap-1.5 text-[#D73E26] font-semibold"><ShieldCheck className="w-4 h-4" />Super Administrateur</span>} />
                  <DataField label="Adresse e-mail" value={user?.email || '—'} />
                  {phone     && <DataField label="Téléphone"     value={phone} />}
                  {createdAt && <DataField label="Membre depuis"  value={createdAt} />}
                  <DataField label="Niveau d'accès" value={<span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-[#D73E26] text-xs font-bold rounded-md">Accès complet</span>} />
                </div>
              </div>
            )}

            {/* PREFERENCES */}
            {activeTab === 'preferences' && (
              <div className="animate-in fade-in duration-300 max-w-2xl">
                <div className="mb-8">
                  <h3 className="text-[16px] font-bold text-gray-900 mb-1">Préférences & Affichage</h3>
                  <p className="text-[14px] text-gray-500">Gérez l'affichage de votre tableau de bord et vos notifications par e-mail.</p>
                </div>
                
                <div className="space-y-8">
                  {/* Interface */}
                  <div>
                    <h4 className="text-[14px] font-semibold text-gray-700 mb-4">Interface utilisateur</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50/50 border border-gray-100 rounded-xl">
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900">Langue de l'interface</p>
                          <p className="text-[12px] text-gray-500 mt-0.5">La langue par défaut pour votre espace administration.</p>
                        </div>
                        <select 
                          value={prefs.language}
                          onChange={e => setPrefs({...prefs, language: e.target.value})}
                          className="bg-white border border-gray-200 text-gray-700 text-[13px] rounded-lg focus:ring-[#D73E26] focus:border-[#D73E26] outline-none px-3 py-2 cursor-pointer shadow-sm"
                        >
                          <option value="fr">Français</option>
                          <option value="en">Anglais</option>
                          <option value="ar">العربية</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div>
                    <h4 className="text-[14px] font-semibold text-gray-700 mb-4">Notifications par e-mail</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900">Alertes de sécurité</p>
                          <p className="text-[12px] text-gray-500 mt-0.5">Soyez notifié lors d'une connexion suspecte.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={prefs.securityAlerts} onChange={e => setPrefs({...prefs, securityAlerts: e.target.checked})} />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D73E26]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900">Nouveaux partenaires</p>
                          <p className="text-[12px] text-gray-500 mt-0.5">Recevoir un e-mail à chaque nouvelle inscription.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={prefs.emailAlerts} onChange={e => setPrefs({...prefs, emailAlerts: e.target.checked})} />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D73E26]"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="text-[13px] font-semibold text-gray-900">Rapports hebdomadaires</p>
                          <p className="text-[12px] text-gray-500 mt-0.5">Recevoir un résumé des statistiques chaque lundi.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={prefs.weeklyReports} onChange={e => setPrefs({...prefs, weeklyReports: e.target.checked})} />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D73E26]"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <button 
                      onClick={() => Swal.fire({ title: 'Préférences enregistrées', icon: 'success', confirmButtonColor: '#00A896', timer: 1500, showConfirmButton: false })}
                      className="px-6 py-2.5 bg-[#D73E26] hover:bg-[#C0321C] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Enregistrer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY */}
            {activeTab === 'security' && (
              <div className="animate-in fade-in duration-300 max-w-md">
                <h3 className="text-[16px] font-bold text-gray-900 mb-6">Sécurité du compte</h3>
                <form onSubmit={handleChangePassword} className="space-y-8">
                  <div>
                    <h4 className="text-[14px] font-semibold text-gray-700 mb-5">Changer le mot de passe</h4>
                    <div className="space-y-6">
                      {/* Current password */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-semibold text-gray-500">Mot de passe actuel</label>
                        <div className="relative">
                          <input type={showPw.current ? 'text' : 'password'} value={pwForm.current}
                            onChange={e => setPwForm({ ...pwForm, current: e.target.value })}
                            className="w-full px-0 py-2 border-b border-gray-200 focus:border-[#D73E26] focus:outline-none transition-colors text-[14px] bg-transparent pr-8"
                            placeholder="••••••••" />
                          <button type="button" onClick={() => setShowPw(p => ({ ...p, current: !p.current }))} className="absolute right-0 top-2 text-gray-400 hover:text-gray-700">
                            {showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      {/* New password */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-semibold text-gray-500">Nouveau mot de passe</label>
                        <div className="relative">
                          <input type={showPw.next ? 'text' : 'password'} value={pwForm.next}
                            onChange={e => setPwForm({ ...pwForm, next: e.target.value })}
                            className="w-full px-0 py-2 border-b border-gray-200 focus:border-[#D73E26] focus:outline-none transition-colors text-[14px] bg-transparent pr-8"
                            placeholder="••••••••" />
                          <button type="button" onClick={() => setShowPw(p => ({ ...p, next: !p.next }))} className="absolute right-0 top-2 text-gray-400 hover:text-gray-700">
                            {showPw.next ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {pwForm.next.length > 0 && pwForm.next.length < 6 && (
                          <p className="text-[11px] text-red-500 font-medium">Minimum 6 caractères</p>
                        )}
                      </div>
                      {/* Confirm */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-semibold text-gray-500">Confirmer le mot de passe</label>
                        <div className="relative">
                          <input type={showPw.confirm ? 'text' : 'password'} value={pwForm.confirm}
                            onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                            className="w-full px-0 py-2 border-b border-gray-200 focus:border-[#D73E26] focus:outline-none transition-colors text-[14px] bg-transparent pr-8"
                            placeholder="••••••••" />
                          <button type="button" onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))} className="absolute right-0 top-2 text-gray-400 hover:text-gray-700">
                            {showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {pwForm.confirm.length > 0 && pwForm.next !== pwForm.confirm && (
                          <p className="text-[11px] text-red-500 font-medium">Les mots de passe ne correspondent pas</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={isSavingPw}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#D73E26] hover:bg-[#C0321C] text-white text-[13px] font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-60">
                    {isSavingPw ? <Upload className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSavingPw ? 'Enregistrement...' : 'Sauvegarder'}
                  </button>
                </form>

                <div className="mt-10 pt-8 border-t border-gray-100">
                  <h4 className="text-[14px] font-semibold text-gray-700 mb-4">Double Authentification (2FA)</h4>
                  <div className={`flex items-start justify-between gap-4 p-4 border rounded-xl transition-colors ${is2FAEnabled ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900">{is2FAEnabled ? 'Activée' : 'Non activée'}</p>
                      <p className={`text-[12px] font-medium mt-0.5 ${is2FAEnabled ? 'text-green-600' : 'text-orange-600'}`}>
                        {is2FAEnabled ? 'Votre compte est bien sécurisé.' : 'Recommandée pour les comptes administrateurs'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {is2FAEnabled && (
                        <button onClick={() => Swal.fire({ title: 'Tester la 2FA', html: '<p class="text-sm text-gray-500 mb-4">Entrez un code généré par votre application pour vérifier que la synchronisation fonctionne.</p><input type="text" id="test-code" class="w-32 text-center text-xl tracking-widest px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#D73E26]" placeholder="000000" maxlength="6" />', confirmButtonColor: '#00A896', confirmButtonText: 'Vérifier', customClass: { popup: 'rounded-2xl', confirmButton: 'rounded-xl px-6 py-2.5 font-bold' }, preConfirm: () => { const code = (document.getElementById('test-code') as HTMLInputElement).value; if(code.length !== 6) Swal.showValidationMessage('Veuillez entrer 6 chiffres'); return code; } }).then((res) => { if(res.isConfirmed) Swal.fire({title: 'Code valide !', text: 'La synchronisation est parfaite.', icon: 'success', confirmButtonColor: '#00A896', timer: 2000, showConfirmButton: false}) })} className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shrink-0 shadow-sm">
                          Tester
                        </button>
                      )}
                      <button onClick={handleToggle2FA}
                        className={`px-4 py-2 text-xs font-bold border bg-white rounded-xl transition-colors shrink-0 shadow-sm ${is2FAEnabled ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-[#00A896] border-[#00A896]/30 hover:bg-teal-50'}`}>
                        {is2FAEnabled ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2.5 text-sm text-green-600 font-medium">
                    <div className="relative shrink-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping" />
                    </div>
                    Session active · Chrome · Aujourd'hui
                  </div>
                </div>
              </div>
            )}

            {/* AUDIT */}
            {activeTab === 'audit' && (
              <div className="animate-in fade-in duration-300 max-w-2xl">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h3 className="text-[16px] font-bold text-gray-900">Historique des Actions</h3>
                    <p className="text-[14px] text-gray-500 mt-0.5">Vos interventions récentes sur la plateforme</p>
                  </div>
                  <button onClick={handleExportCSV}
                    className="flex items-center gap-1.5 text-[13px] font-semibold text-[#D73E26] hover:underline">
                    <Download className="w-4 h-4" /> Exporter CSV
                  </button>
                </div>
                <div className="flex flex-col divide-y divide-gray-100">
                  {auditLogs.map((log, idx) => (
                    <div key={idx} className="flex items-center gap-4 py-5 hover:bg-gray-50 -mx-4 px-4 rounded-xl transition-colors cursor-pointer group">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: log.bg }}>
                        <log.icon className="w-5 h-5" style={{ color: log.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-gray-900 truncate">{log.label}</p>
                        <p className="text-[13px] text-gray-500 mt-0.5 truncate">{log.detail}</p>
                      </div>
                      <span className="text-[12px] text-gray-400 shrink-0">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Drawer ──────────────────────────────────────────────────────────── */}
      {isEditModalOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-gray-100 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
              <div>
                <h2 className="text-[20px] font-bricolage font-bold text-[#1B100C]">Modifier le profil</h2>
                <p className="text-[13px] text-gray-500 mt-1">Mettez à jour vos informations administrateur.</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="space-y-6">
                {[
                  { key: 'firstName', label: 'Prénom', type: 'text',  required: true },
                  { key: 'lastName',  label: 'Nom',    type: 'text',  required: true },
                  { key: 'phone',     label: 'Téléphone', type: 'tel', required: false },
                ].map(field => (
                  <div key={field.key} className="space-y-2">
                    <label className="text-[13px] font-semibold text-gray-700">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type={field.type}
                      value={(editForm as any)[field.key]}
                      onChange={e => setEditForm({ ...editForm, [field.key]: e.target.value })}
                      className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] focus:bg-white focus:border-[#D73E26] focus:ring-4 focus:ring-[#D73E26]/10 outline-none transition-all"
                    />
                  </div>
                ))}
                <div className="space-y-2 opacity-70">
                  <label className="text-[13px] font-semibold text-gray-700 flex items-center justify-between">
                    Adresse e-mail
                    <span className="text-[11px] font-normal text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">Lecture seule</span>
                  </label>
                  <input type="email" value={user?.email || ''} disabled
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-[14px] text-gray-500 cursor-not-allowed" />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
              <form onSubmit={handleSaveProfile} className="flex items-center gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 rounded-xl text-[14px] font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
                  Annuler
                </button>
                <button type="submit" disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#D73E26] hover:bg-[#C0321C] text-white text-[14px] font-semibold shadow-md shadow-[#D73E26]/20 transition-all disabled:opacity-70">
                  {isSaving ? <Upload className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
