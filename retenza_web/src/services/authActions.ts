'use server';

import { cookies } from 'next/headers';
import { ActionResponse, AuthResponse } from '../types/auth';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const COOKIE_NAME = 'auth_token';

// --- HELPER FUNCTION FOR SESSION SETTING ---
async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

// --- LOGIN ---
export async function loginAction(email: string, password: string): Promise<ActionResponse> {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });

    const data: AuthResponse = await res.json();

    if (!res.ok || !data.success) {
      return { success: false, message: data.message || 'Identifiants incorrects' };
    }

    if (data.data?.token) {
      await setSessionCookie(data.data.token);
      return {
        success: true,
        message: 'Connexion réussie',
        role: data.data?.user?.role,
        isOnboardingComplete: data.data?.user?.isOnboardingComplete,
      };
    }

    return { success: false, message: 'Erreur inattendue lors de la connexion' };
  } catch (error) {
    return { success: false, message: 'Impossible de joindre le serveur' };
  }
}

// --- REGISTER CLIENT ---
export async function registerClientAction(payload: any): Promise<ActionResponse> {
  try {
    const res = await fetch(`${API_URL}/auth/register/client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return { success: false, message: data.message || 'Erreur lors de l\'inscription' };
    }

    if (data.data?.token) {
      await setSessionCookie(data.data.token);
      return { success: true, message: 'Inscription réussie' };
    }

    return { success: false, message: 'Erreur inattendue lors de l\'inscription' };
  } catch (error) {
    return { success: false, message: 'Impossible de joindre le serveur' };
  }
}

// --- REGISTER MERCHANT ---
export async function registerMerchantAction(payload: any): Promise<ActionResponse> {
  try {
    const res = await fetch(`${API_URL}/auth/register/merchant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return { success: false, message: data.message || 'Erreur lors de l\'inscription' };
    }

    if (data.data?.token) {
      await setSessionCookie(data.data.token);
      return { success: true, message: 'Inscription réussie' };
    }

    return { success: false, message: 'Erreur inattendue lors de l\'inscription' };
  } catch (error) {
    return { success: false, message: 'Impossible de joindre le serveur' };
  }
}

// --- NEW PARTNERSHIP WORKFLOW ---
export async function checkPartnershipEmailAction(email: string): Promise<ActionResponse & { available?: boolean }> {
  try {
    const res = await fetch(
      `${API_URL}/partnership-requests/check-email?email=${encodeURIComponent(email)}`,
      { method: 'GET', cache: 'no-store' }
    );
    const data = await res.json();
    return {
      success: true,
      available: data.available,
      code: data.code,
      message: data.message,
    };
  } catch {
    // En cas d'erreur réseau, on laisse passer (fail open) — le backend rebloquera au submit
    return { success: true, available: true, message: '' };
  }
}

export async function submitPartnershipRequestAction(payload: any): Promise<ActionResponse> {
  try {
    const res = await fetch(`${API_URL}/partnership-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.message || 'Erreur lors de l\'envoi de la demande',
        code: data.code,   // ALREADY_PENDING | PENDING_ACTIVATION | ALREADY_ACTIVE
      };
    }

    return { success: true, message: 'Demande envoyée avec succès' };
  } catch (error) {
    return { success: false, message: 'Impossible de joindre le serveur' };
  }
}

export async function activateAccountAction(payload: { token: string; password: string; confirmPassword: string }): Promise<ActionResponse> {
  try {
    const res = await fetch(`${API_URL}/auth/activate-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return { success: false, message: data.message || 'Erreur lors de l\'activation' };
    }

    if (data.data?.token) {
      await setSessionCookie(data.data.token);
      return { success: true, message: 'Compte activé avec succès', role: data.data?.user?.role };
    }

    return { success: false, message: 'Erreur inattendue' };
  } catch (error) {
    return { success: false, message: 'Impossible de joindre le serveur' };
  }
}

export async function resendActivationAction(email: string): Promise<ActionResponse> {
  try {
    const res = await fetch(`${API_URL}/auth/resend-activation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      cache: 'no-store',
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, message: data.message || 'Erreur lors de l\'envoi' };
    }

    return { success: true, message: 'Email de renvoi envoyé' };
  } catch (error) {
    return { success: false, message: 'Impossible de joindre le serveur' };
  }
}

// --- LOGOUT ---
export async function logoutAction(): Promise<ActionResponse> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return { success: true, message: 'Déconnexion réussie' };
}

// --- GET TOKEN ---
export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

// --- FORGOT PASSWORD ---
export async function forgotPasswordAction(email: string): Promise<ActionResponse> {
  try {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      cache: 'no-store',
    });
    const data = await res.json();
    return { success: data.success, message: data.message };
  } catch {
    return { success: false, message: 'Erreur réseau. Veuillez réessayer.' };
  }
}

// --- RESET PASSWORD ---
export async function resetPasswordAction(token: string, newPassword: string): Promise<ActionResponse> {
  try {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
      cache: 'no-store',
    });
    const data = await res.json();
    if (data.success && data.data?.token) {
      await setSessionCookie(data.data.token);
    }
    return { success: data.success, message: data.message };
  } catch {
    return { success: false, message: 'Erreur réseau. Veuillez réessayer.' };
  }
}

// --- COMPLETE ONBOARDING ---
export async function completeOnboardingAction(payload: Record<string, unknown>): Promise<ActionResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  try {
    const res = await fetch(`${API_URL}/merchant/onboarding`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const data = await res.json();
    return { success: data.success, message: data.message };
  } catch {
    return { success: false, message: 'Erreur réseau. Veuillez réessayer.' };
  }
}
