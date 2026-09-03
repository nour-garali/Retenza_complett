import React from 'react';
import { getAdminSettingsAction } from '@/services/adminDashboardActions';
import AdminSettingsContent from './AdminSettingsContent';

export default async function AdminSettingsPage() {
  const res = await getAdminSettingsAction();
  const settings = res?.data;

  return (
    <AdminSettingsContent
      initialGoal={settings?.monthlyAcquisitionGoal || 50}
      initialNotifications={{
        securityAlerts: settings?.notificationPreferences?.securityAlerts ?? true,
        newPartnerNotif: settings?.notificationPreferences?.newPartnerNotif ?? true,
        weeklyReport: settings?.notificationPreferences?.weeklyReport ?? false,
      }}
    />
  );
}
