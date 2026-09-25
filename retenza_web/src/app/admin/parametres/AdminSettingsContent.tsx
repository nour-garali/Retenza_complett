'use client';

import React, { useState } from 'react';
import {
  Target, CheckCircle2, Loader2,
  Bell, ShieldCheck, Users, FileText, Save, RotateCcw,
  ChevronDown, Store, TrendingUp,
  Clock, ChevronRight, Lightbulb, Settings, Zap
} from 'lucide-react';
import { updateAdminSettingsAction, NotificationPreferences } from '@/services/adminDashboardActions';
import { useRouter } from 'next/navigation';

interface AdminSettingsContentProps {
  initialGoal: number;
  initialNotifications: NotificationPreferences;
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${
        enabled ? 'bg-[#DD2C1F]' : 'bg-slate-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function AdminSettingsContent({ initialGoal, initialNotifications }: AdminSettingsContentProps) {
  const router = useRouter();

  // States
  const [goal, setGoal] = useState<string>(initialGoal.toString());
  const [notifs, setNotifs] = useState<NotificationPreferences>(initialNotifications);
  const [isLoadingGoal, setIsLoadingGoal] = useState(false);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const [successGoal, setSuccessGoal] = useState('');
  const [errorGoal, setErrorGoal] = useState('');
  const [successNotifs, setSuccessNotifs] = useState('');
  const [errorNotifs, setErrorNotifs] = useState('');

  // Fonctions utilitaires
  const toggleNotif = (key: keyof NotificationPreferences) => {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const resetGoal = () => {
    setGoal(initialGoal.toString());
    setSuccessGoal('');
    setErrorGoal('');
  };

  // Gestion des formulaires
  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingGoal(true);
    setErrorGoal('');
    setSuccessGoal('');

    const parsedGoal = parseInt(goal, 10);
    if (isNaN(parsedGoal) || parsedGoal <= 0) {
      setErrorGoal('Veuillez entrer un nombre valide supérieur à 0.');
      setIsLoadingGoal(false);
      return;
    }

    const res = await updateAdminSettingsAction({ monthlyAcquisitionGoal: parsedGoal });
    setIsLoadingGoal(false);

    if (res?.success) {
      setSuccessGoal('Objectif mensuel mis à jour avec succès.');
      router.refresh();
      setTimeout(() => setSuccessGoal(''), 5000);
    } else {
      setErrorGoal(res?.message || 'Une erreur est survenue.');
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingNotifs(true);
    setErrorNotifs('');
    setSuccessNotifs('');

    const res = await updateAdminSettingsAction({ notificationPreferences: notifs });
    setIsLoadingNotifs(false);

    if (res?.success) {
      setSuccessNotifs('Préférences de notifications enregistrées.');
      router.refresh();
      setTimeout(() => setSuccessNotifs(''), 5000);
    } else {
      setErrorNotifs(res?.message || 'Une erreur est survenue.');
    }
  };

  // Calculs pour l'aperçu rapide
  const currentGoal = parseInt(goal, 10) || initialGoal;
  const currentPartners = 34; // Simulation
  const progressPercentage = Math.min((currentPartners / currentGoal) * 100, 100);
  const remaining = Math.max(currentGoal - currentPartners, 0);

  const notifItems = [
    {
      key: 'securityAlerts' as keyof NotificationPreferences,
      icon: ShieldCheck,
      title: 'Alertes de sécurité',
      description: "Soyez notifié lors d'une connexion suspecte.",
    },
    {
      key: 'newPartnerNotif' as keyof NotificationPreferences,
      icon: Users,
      title: 'Nouveaux partenaires',
      description: 'Recevoir un e-mail à chaque nouvelle inscription.',
    },
    {
      key: 'weeklyReport' as keyof NotificationPreferences,
      icon: FileText,
      title: 'Rapports hebdomadaires',
      description: 'Recevoir un résumé des statistiques chaque lundi.',
    },
  ];

  return (
    <div className="font-inter w-full">
      <div className="w-full space-y-6">

        {/* STRUCTURE EN 2 COLONNES (haut de page) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

          {/* COLONNE GAUCHE — Carte "Paramètres globaux" */}
          <div className="bg-white rounded-lg border border-slate-200/70 p-6 shadow-sm flex flex-col justify-between h-full">
            <div>
              {/* Header */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#FDF0ED] flex items-center justify-center shrink-0 text-[#DD2C1F]">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-800 leading-tight">
                    Paramètres globaux
                  </h2>
                  <p className="text-[12px] text-slate-400 mt-1">
                    Gérez les configurations générales de la plateforme Retenza.
                  </p>
                </div>
              </div>

              {/* Messages de statut */}
              {successGoal && (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 p-3 rounded-md border border-emerald-200 text-xs font-medium mt-4">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {successGoal}
                </div>
              )}
              {errorGoal && (
                <div className="text-red-600 text-xs font-medium bg-red-50 p-3 rounded-md border border-red-200 mt-4">
                  {errorGoal}
                </div>
              )}

              {/* Bloc encadré "Objectif d'acquisition" */}
              <div className="mt-5 bg-[#FDF6F5] rounded-md border border-[#F8E3DE] p-5">
                <div>
                  <h3 className="text-[13px] font-bold text-slate-800 leading-tight">
                    Objectif d'acquisition
                  </h3>
                  <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                    Définissez le nombre de nouveaux commerces actifs à acquérir durant le mois en cours.
                    Cette valeur est utilisée pour calculer la jauge de progression sur votre tableau de bord.
                  </p>
                </div>

                {/* Champ input */}
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex items-center bg-white border border-slate-200/90 rounded-md px-4 py-2.5 shadow-sm w-44 focus-within:border-[#DD2C1F] focus-within:ring-1 focus-within:ring-[#DD2C1F]">
                    <input
                      type="number"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      min="1"
                      className="w-full font-semibold text-sm text-slate-800 outline-none bg-transparent"
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600">commerces</span>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <form onSubmit={handleSaveGoal} className="mt-5 flex items-center gap-3">
              <button
                type="submit"
                disabled={isLoadingGoal}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#DD2C1F] hover:bg-[#c42519] text-white rounded-md text-xs font-semibold shadow-sm transition-all disabled:opacity-70"
              >
                {isLoadingGoal ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sauvegarde...</>
                ) : (
                  <><Save className="w-3.5 h-3.5" />Enregistrer</>
                )}
              </button>
              <button
                type="button"
                onClick={resetGoal}
                className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-xs font-semibold shadow-sm transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                Réinitialiser
              </button>
            </form>
          </div>

          {/* COLONNE DROITE — Carte "Aperçu rapide" */}
          <div className="bg-white rounded-lg border border-slate-200/70 p-6 shadow-sm flex flex-col justify-between h-full">
            <div>
              {/* Header */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#FDF0ED] flex items-center justify-center shrink-0 text-[#DD2C1F]">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-800 leading-tight">
                    Aperçu rapide
                  </h2>
                  <p className="text-[12px] text-slate-400 mt-1">
                    Suivez vos objectifs et indicateurs clés en un coup d'œil.
                  </p>
                </div>
              </div>

              {/* Contenu : Graphique Donut + 3 Mini Cartes */}
              <div className="mt-5 flex items-center gap-6">
                {/* Donut Chart Gauge */}
                <div className="flex flex-col items-center justify-center shrink-0 w-44">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    {/* Fond circulaire avec bordure */}
                    <div className="absolute inset-4 bg-gradient-to-br from-slate-50 to-white rounded-full border-2 border-slate-100 shadow-inner"></div>
                    
                    <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 120 120">
                      <defs>
                        <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#F1F5F9" />
                          <stop offset="50%" stopColor="#E2E8F0" />
                          <stop offset="100%" stopColor="#F1F5F9" />
                        </linearGradient>
                        <linearGradient id="fillGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#EF4444" />
                          <stop offset="50%" stopColor="#DD2C1F" />
                          <stop offset="100%" stopColor="#DC2626" />
                        </linearGradient>
                      </defs>
                      
                      {/* Track de fond - style moderne épais */}
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        stroke="url(#trackGradient)"
                        strokeWidth="12"
                        fill="none"
                        opacity="0.3"
                      />
                      
                      {/* Barre de progression */}
                      <circle
                        cx="60"
                        cy="60"
                        r="45"
                        stroke="url(#fillGradient)"
                        strokeWidth="12"
                        strokeDasharray={2 * Math.PI * 45}
                        strokeDashoffset={2 * Math.PI * 45 * (1 - progressPercentage / 100)}
                        strokeLinecap="round"
                        fill="none"
                        className="transition-all duration-1200 ease-out"
                        style={{
                          filter: 'drop-shadow(0 0 8px rgba(221, 44, 31, 0.3))'
                        }}
                      />
                    </svg>
                    
                    {/* Centre avec contenu */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                      <div className="text-center">
                        <div className="text-2xl font-black text-slate-800 tracking-tight">
                          {Math.round(progressPercentage)}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center mt-4">
                    <p className="text-xs font-bold text-slate-800 mb-1">Progression de l'objectif</p>
                    <div className="flex items-center justify-center gap-2 text-xs">
                      <span className="font-semibold text-[#DD2C1F]">{currentPartners}</span>
                      <span className="text-slate-300">/</span>
                      <span className="font-medium text-slate-500">{currentGoal}</span>
                      <span className="text-slate-400 text-[11px]">commerces</span>
                    </div>
                  </div>
                </div>

                {/* 3 mini-cartes statistiques */}
                <div className="flex-1 space-y-2">
                  {/* Commerces actifs */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/70 rounded-md border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-slate-400">Commerces actifs</p>
                        <p className="text-[13px] font-bold text-slate-800">{currentPartners}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#DD2C1F] flex items-center gap-0.5">
                      <span className="text-xs">↑</span> +12%
                    </span>
                  </div>

                  {/* En progression */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/70 rounded-md border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-slate-400">En progression</p>
                        <p className="text-[13px] font-bold text-slate-800">+12%</p>
                      </div>
                    </div>
                    <span className="text-[#DD2C1F] font-bold text-sm">↑</span>
                  </div>

                  {/* Reste */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/70 rounded-md border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium text-slate-400">Reste</p>
                        <p className="text-[13px] font-bold text-slate-800">{remaining}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bannière d'astuce en bas */}
            <div className="mt-4 p-3 bg-[#FDF6F5] rounded-md border border-[#F8E3DE] flex items-center justify-between gap-3">
              <div className="w-7 h-7 rounded-full bg-red-100/60 flex items-center justify-center shrink-0">
                <Lightbulb className="w-3.5 h-3.5 text-[#DD2C1F]" />
              </div>
              <span className="text-[11px] text-slate-600 font-medium flex-1">
                Votre objectif vous aide à mesurer la croissance de votre réseau de partenaires.
              </span>
            </div>
          </div>
        </div>

        {/* BLOC PLEINE LARGEUR (bas de page) — Carte "Notifications par e-mail" */}
        <div className="bg-white rounded-lg border border-slate-200/70 p-6 shadow-sm">
          {/* Header */}
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#FDF0ED] flex items-center justify-center shrink-0 text-[#DD2C1F]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-800 leading-tight">
                Notifications par e-mail
              </h2>
              <p className="text-[12px] text-slate-400 mt-1">
                Gérez les notifications et rapports envoyés par e-mail.
              </p>
            </div>
          </div>

          {/* Formulaire notifications */}
          <form onSubmit={handleSaveNotifications} className="mt-5">
            {/* Messages de statut */}
            {successNotifs && (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 p-3 rounded-md border border-emerald-200 text-xs font-medium mb-4">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {successNotifs}
              </div>
            )}
            {errorNotifs && (
              <div className="text-red-600 text-xs font-medium bg-red-50 p-3 rounded-md border border-red-200 mb-4">
                {errorNotifs}
              </div>
            )}

            {/* 3 cartes horizontales en grille */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              {notifItems.map(({ key, icon: Icon, title, description }) => {
                const isEnabled = notifs[key];
                const iconColor = isEnabled ? 'text-[#DD2C1F]' : 'text-slate-400';
                const iconBg = isEnabled ? 'bg-[#FDF0ED]' : 'bg-slate-100';

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3.5 bg-slate-50/70 rounded-md border border-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-md ${iconBg} flex items-center justify-center shrink-0 transition-colors`}>
                        <Icon className={`w-4 h-4 ${iconColor} transition-colors`} />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 leading-tight">{title}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
                      </div>
                    </div>
                    <div className="ml-3 shrink-0">
                      <Toggle
                        enabled={isEnabled}
                        onToggle={() => toggleNotif(key)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bouton enregistrer */}
            <button
              type="submit"
              disabled={isLoadingNotifs}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#DD2C1F] hover:bg-[#c42519] text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-70"
            >
              {isLoadingNotifs ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sauvegarde...</>
              ) : (
                <><Bell className="w-3.5 h-3.5" />Enregistrer les notifications</>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}