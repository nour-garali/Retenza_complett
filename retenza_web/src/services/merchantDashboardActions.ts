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

export async function getMerchantDashboardStats() {
  try {
    const data = await fetchWithAuth('/merchant/dashboard', { cache: 'no-store' });
    if (!data.success) throw new Error(data.message);
    return data.data;
  } catch (error) {
    console.error('Erreur getMerchantDashboardStats:', error);
    return null;
  }
}

export async function getMerchantClients() {
  try {
    const data = await fetchWithAuth('/merchant/clients', { cache: 'no-store' });
    if (!data.success) throw new Error(data.message);
    return data.data?.clients || [];
  } catch (error) {
    console.error('Erreur getMerchantClients:', error);
    return [];
  }
}

export async function getMerchantQr() {
  try {
    const data = await fetchWithAuth('/merchant/qrcode', { 
      method: 'POST',
      cache: 'no-store' 
    });
    if (!data.success) throw new Error(data.message);
    return data.data?.qrCode;
  } catch (error) {
    console.error('Erreur getMerchantQr:', error);
    return null;
  }
}

export async function getMerchantLoyaltyProgram() {
  try {
    const data = await fetchWithAuth('/merchant/loyalty', { cache: 'no-store' });
    if (!data.success) throw new Error(data.message);
    return data.data?.program;
  } catch (error) {
    console.error('Erreur getMerchantLoyaltyProgram:', error);
    return null;
  }
}

export async function updateMerchantLoyaltyProgram(type: 'points' | 'stamps' | 'cashback', payload: any) {
  try {
    const data = await fetchWithAuth(`/merchant/loyalty/${type}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return data;
  } catch (error: any) {
    console.error('Erreur updateMerchantLoyaltyProgram:', error);
    return { success: false, message: error.message };
  }
}

export async function getMerchantCampaigns() {
  try {
    // Mock data for UI demonstration
    return [
      { id: 1, title: 'Promotion d\'été', type: 'sms', target: 'Tous les clients', status: 'terminée', date: '12 Jui 2026', sent: 1250, opened: 840, clicked: 320 },
      { id: 2, title: 'Nouveau menu', type: 'push', target: 'Clients VIP', status: 'en_cours', date: '05 Aoû 2026', sent: 450, opened: 310, clicked: 120 },
      { id: 3, title: 'Offre Anniversaire', type: 'email', target: 'Anniversaires du mois', status: 'planifiée', date: '10 Aoû 2026', sent: 0, opened: 0, clicked: 0 },
    ];
  } catch (error) {
    console.error('Erreur getMerchantCampaigns:', error);
    return [];
  }
}

export async function createMerchantCampaign(payload: any) {
  try {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'Campagne créée avec succès' };
  } catch (error: any) {
    console.error('Erreur createMerchantCampaign:', error);
    return { success: false, message: error.message };
  }
}
