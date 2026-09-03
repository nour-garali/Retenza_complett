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

export async function getClientDashboardData() {
  try {
    const data = await fetchWithAuth('/clients/dashboard', { cache: 'no-store' });
    if (!data.success) throw new Error(data.message);
    return data.data;
  } catch (error) {
    console.error('Erreur getClientDashboardData:', error);
    return null;
  }
}

export async function getClientBalances() {
  try {
    const data = await fetchWithAuth('/clients/loyalty/balances', { cache: 'no-store' });
    if (!data.success) throw new Error(data.message);
    return data.data.balances; // List of balances by commerce
  } catch (error) {
    console.error('Erreur getClientBalances:', error);
    return [];
  }
}

export async function getClientExploreData() {
  try {
    const data = await fetchWithAuth('/clients/commerces/suggestions', { cache: 'no-store' });
    if (!data.success) throw new Error(data.message);
    return data.data;
  } catch (error) {
    console.error('Erreur getClientExploreData:', error);
    return null;
  }
}
