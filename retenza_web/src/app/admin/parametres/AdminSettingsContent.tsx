'use client';

import React, { useState } from 'react';
import {
  Settings, Target, CheckCircle2, Loader2, ArrowRight,
  Bell, ShieldCheck, Users, FileText
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
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        enabled ? 'bg-[#D73E26]' : 'bg-gray-200'
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

  // Objectif mensuel
  const [goal, setGoal] = useState<string>(initialGoal.toString());

  // Notifications
  const [notifs, setNotifs] = useState<NotificationPreferences>(initialNotifications);

  // UI states
  const [isLoadingGoal, setIsLoadingGoal] = useState(false);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const [successGoal, setSuccessGoal] = useState('');
  const [errorGoal, setErrorGoal] = useState('');
  const [successNotifs, setSuccessNotifs] = useState('');
  const [errorNotifs, setErrorNotifs] = useState('');

  const toggleNotif = (key: keyof NotificationPreferences) => {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#D73E26]" />
          Paramètres Globaux
        </h1>
        <p className="text-[13px] text-gray-500 mt-1">
          Gérez les configurations générales de la plateforme Retenza.
        </p>
      </div>

      {/* ── Section 1 : Objectif d'acquisition ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 p-5 bg-gray-50/50">
          <h2 className="text-[16px] font-semibold text-gray-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-gray-400" />
            Objectif d'Acquisition
          </h2>
        </div>

        <form onSubmit={handleSaveGoal} className="p-5 sm:p-6 space-y-6">
          {successGoal && (
            <div className="flex items-center gap-2 bg-[#EEF3E8] text-[#7D9B4E] p-3 rounded-xl border border-[#c9dbb2] text-[13px] font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successGoal}
            </div>
          )}
          {errorGoal && (
            <div className="text-red-500 text-[13px] font-medium bg-red-50 p-3 rounded-xl border border-red-100">
              {errorGoal}
            </div>
          )}

          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Objectif mensuel de nouveaux partenaires
            </label>
            <p className="text-[13px] text-gray-400 mb-4 leading-relaxed">
              Définit le nombre de nouveaux commerces actifs à acquérir durant le mois en cours. Cette valeur est utilisée pour calculer la jauge de progression sur votre tableau de bord.
            </p>
            <div className="max-w-xs relative">
              <input
                type="number"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                min="1"
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 text-gray-800 font-semibold focus:border-[#D73E26] focus:ring-2 focus:ring-[#D73E26]/20 transition-all outline-none"
                placeholder="Ex: 50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-medium text-gray-400">
                commerces
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center gap-4">
            <button
              type="submit"
              disabled={isLoadingGoal}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#D73E26] hover:bg-[#C0321C] text-white rounded-xl text-[14px] font-semibold transition-all disabled:opacity-70 shadow-sm"
            >
              {isLoadingGoal ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Sauvegarde...</>
              ) : (
                'Enregistrer'
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="text-[13px] font-medium text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1"
            >
              Retour au tableau de bord <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* ── Section 2 : Notifications ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 p-5 bg-gray-50/50">
          <h2 className="text-[16px] font-semibold text-gray-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-400" />
            Notifications par e-mail
          </h2>
        </div>

        <form onSubmit={handleSaveNotifications} className="p-5 sm:p-6 space-y-4">
          {successNotifs && (
            <div className="flex items-center gap-2 bg-[#EEF3E8] text-[#7D9B4E] p-3 rounded-xl border border-[#c9dbb2] text-[13px] font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successNotifs}
            </div>
          )}
          {errorNotifs && (
            <div className="text-red-500 text-[13px] font-medium bg-red-50 p-3 rounded-xl border border-red-100">
              {errorNotifs}
            </div>
          )}

          <div className="space-y-3">
            {notifItems.map(({ key, icon: Icon, title, description }) => (
              <div
                key={key}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-[#D73E26]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800">{title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{description}</p>
                  </div>
                </div>
                <Toggle
                  enabled={notifs[key]}
                  onToggle={() => toggleNotif(key)}
                />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isLoadingNotifs}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#D73E26] hover:bg-[#C0321C] text-white rounded-xl text-[14px] font-semibold transition-all disabled:opacity-70 shadow-sm"
            >
              {isLoadingNotifs ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Sauvegarde...</>
              ) : (
                'Enregistrer les notifications'
              )}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
