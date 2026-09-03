'use server';

import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const COOKIE_NAME = 'auth_token';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    throw new Error('Non authentifié');
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await res.json();
  return data;
}

export async function getAdminDashboardStats() {
  try {
    const data = await fetchWithAuth('/admin/statistics', { cache: 'no-store' });
    if (!data.success) throw new Error(data.message);
    return data.data;
  } catch (error) {
    console.error('Erreur getAdminDashboardStats:', error);
    return null;
  }
}

export async function getAdminCommerces() {
  try {
    const data = await fetchWithAuth('/admin/commerces', { cache: 'no-store' });
    if (!data.success) throw new Error(data.message);
    return data.data?.commerces || [];
  } catch (error) {
    console.error('Erreur getAdminCommerces:', error);
    return [];
  }
}

export async function getAdminClients() {
  try {
    const data = await fetchWithAuth('/admin/clients', { cache: 'no-store' });
    if (!data.success) throw new Error(data.message);
    return data.data?.clients || [];
  } catch (error) {
    console.error('Erreur getAdminClients:', error);
    return [];
  }
}

export async function updateCommerceStatus(commerceId: string, action: 'activate' | 'suspend') {
  try {
    const data = await fetchWithAuth(`/admin/commerces/${commerceId}/${action}`, {
      method: 'PATCH'
    });
    return data;
  } catch (error: any) {
    console.error('Erreur updateCommerceStatus:', error);
    return { success: false, message: error.message };
  }
}

export async function deleteCommerceAction(commerceId: string) {
  try {
    const data = await fetchWithAuth(`/admin/commerces/${commerceId}`, {
      method: 'DELETE'
    });
    return data;
  } catch (error: any) {
    console.error('Erreur deleteCommerceAction:', error);
    return { success: false, message: error.message };
  }
}

export async function updateAdminProfile(payload: { firstName: string; lastName: string; phone?: string }) {
  try {
    const data = await fetchWithAuth('/auth/me/update', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return data;
  } catch (error: any) {
    console.error('Erreur updateAdminProfile:', error);
    return { success: false, message: error.message };
  }
}

export async function changeAdminPassword(payload: { currentPassword: string; newPassword: string }) {
  try {
    const data = await fetchWithAuth('/auth/me/change-password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return data;
  } catch (error: any) {
    console.error('Erreur changeAdminPassword:', error);
    return { success: false, message: error.message };
  }
}

export interface NotificationPreferences {
  securityAlerts: boolean;
  newPartnerNotif: boolean;
  weeklyReport: boolean;
}

export interface AdminSettingsPayload {
  monthlyAcquisitionGoal?: number;
  notificationPreferences?: Partial<NotificationPreferences>;
}

export async function updateAdminSettingsAction(payload: AdminSettingsPayload) {
  try {
    const data = await fetchWithAuth('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return data;
  } catch (error: any) {
    console.error('Erreur updateAdminSettingsAction:', error);
    return { success: false, message: error.message };
  }
}

export async function getAdminSettingsAction() {
  try {
    const data = await fetchWithAuth('/admin/settings', { method: 'GET' });
    return data;
  } catch (error: any) {
    console.error('Erreur getAdminSettingsAction:', error);
    return null;
  }
}
