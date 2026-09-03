'use server';

import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

async function getAuthHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function getPartnershipRequestsAction() {
  try {
    const res = await fetch(`${API_URL}/admin/partnership-requests?limit=100`, {
      method: 'GET',
      headers: await getAuthHeaders(),
      cache: 'no-store',
    });
    const data = await res.json();
    if (!res.ok) return { success: false, message: data.message || 'Erreur API' };
    return { success: true, data: data.data.requests };
  } catch (err) {
    return { success: false, message: 'Erreur réseau' };
  }
}

export async function approvePartnershipRequestAction(id: string) {
  try {
    const res = await fetch(`${API_URL}/admin/partnership-requests/${id}/approve`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      cache: 'no-store',
    });
    const data = await res.json();
    return { success: data.success, message: data.message };
  } catch (err) {
    return { success: false, message: 'Erreur réseau' };
  }
}

export async function rejectPartnershipRequestAction(id: string, reason: string) {
  try {
    const res = await fetch(`${API_URL}/admin/partnership-requests/${id}/reject`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ reason }),
      cache: 'no-store',
    });
    const data = await res.json();
    return { success: data.success, message: data.message };
  } catch (err) {
    return { success: false, message: 'Erreur réseau' };
  }
}
