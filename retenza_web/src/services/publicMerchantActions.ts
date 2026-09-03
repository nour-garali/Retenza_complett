'use server';

/**
 * publicMerchantActions.ts
 *
 * Server Actions for the public QR + OTP Guest Loyalty Card flow.
 */

import type { MerchantPublicProfile, QrScanMetadata } from '@/types/guest';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function publicFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const res = await fetch(`${API_URL}/public${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...options.headers },
    cache: 'no-store',
  });
  return res.json();
}

async function otpFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const res = await fetch(`${API_URL}/otp${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...options.headers },
    cache: 'no-store',
  });
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Merchant Profile
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchPublicMerchant(code: string): Promise<MerchantPublicProfile | null> {
  try {
    const result = await publicFetch<MerchantPublicProfile>(`/merchant/${code}`);
    if (!result.success || !result.data) return null;
    return result.data;
  } catch (err) {
    console.error('[publicMerchantActions] fetchPublicMerchant error:', err);
    return null;
  }
}

export async function recordQrScan(code: string, metadata: QrScanMetadata): Promise<void> {
  try {
    await publicFetch(`/merchant/${code}/scan`, { method: 'POST', body: JSON.stringify(metadata) });
  } catch {
    // fire-and-forget — ne pas bloquer l'expérience utilisateur
  }
}

/**
 * Vérifie si un email est déjà lié à une carte chez ce commerçant.
 * Appelé avant l'envoi de l'OTP pour un feedback immédiat.
 */
export async function checkEmailRegistration(
  email: string,
  merchantCode: string
): Promise<{ registered: boolean }> {
  try {
    const encodedEmail = encodeURIComponent(email.toLowerCase().trim());
    const res = await fetch(
      `${API_URL}/public/merchant/${merchantCode}/check-email?email=${encodedEmail}`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    return { registered: data.registered === true };
  } catch {
    return { registered: false }; // fail-safe
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OTP Flow
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Étape 1 : Envoyer un OTP par email pour la création de carte guest.
 */
export async function sendOtpForCard(
  email: string,
  merchantCode: string
): Promise<{ success: boolean; message: string; expiresInMinutes?: number }> {
  try {
    const result = await otpFetch<{ expiresInMinutes: number }>('/send', {
      method: 'POST',
      body: JSON.stringify({
        identifier: email,
        identifierType: 'email',
        purpose: 'guest_card',
        metadata: { merchantCode },
      }),
    });
    return {
      success: result.success,
      message: result.message || '',
      expiresInMinutes: result.data?.expiresInMinutes,
    };
  } catch (err) {
    console.error('[publicMerchantActions] sendOtpForCard error:', err);
    return { success: false, message: 'Impossible d\'envoyer le code. Vérifiez votre connexion.' };
  }
}

/**
 * Étape 2 : Vérifier le code OTP → retourne un verifiedToken.
 */
export async function verifyOtpCode(
  email: string,
  code: string,
  purpose: 'guest_card' | 'login'
): Promise<{ success: boolean; verifiedToken?: string; message?: string }> {
  try {
    const result = await otpFetch<{ verifiedToken: string; identifier: string }>('/verify', {
      method: 'POST',
      body: JSON.stringify({ identifier: email, code, purpose }),
    });
    return {
      success: result.success,
      verifiedToken: result.data?.verifiedToken,
      message: result.message,
    };
  } catch (err) {
    console.error('[publicMerchantActions] verifyOtpCode error:', err);
    return { success: false, message: 'Erreur lors de la vérification.' };
  }
}

/**
 * Étape 3 : Finaliser la carte — crée compte + LoyaltyAccount + Wallet pass.
 */
export async function finalizeGuestCard(
  verifiedToken: string,
  firstName?: string,
  lastName?: string
): Promise<{
  success: boolean;
  walletUrl?: string;
  sessionToken?: string;
  isNewUser?: boolean;
  isNewCard?: boolean;
  message?: string;
}> {
  try {
    const result = await otpFetch<{
      walletUrl: string;
      sessionToken: string;
      isNewUser: boolean;
      isNewCard: boolean;
      user: { firstName: string; lastName: string; email: string };
      commerce: { name: string };
    }>('/finalize-card', {
      method: 'POST',
      body: JSON.stringify({ verifiedToken, firstName, lastName }),
    });

    if (!result.success) {
      return { success: false, message: result.message };
    }

    // Sauvegarder le token de session dans le cookie httpOnly
    if (result.data?.sessionToken) {
      const cookieStore = await cookies();
      cookieStore.set('auth_token', result.data.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 jours
        path: '/',
      });
    }

    return {
      success: true,
      walletUrl: result.data?.walletUrl || undefined,
      sessionToken: result.data?.sessionToken,
      isNewUser: result.data?.isNewUser,
      isNewCard: result.data?.isNewCard,
    };
  } catch (err) {
    console.error('[publicMerchantActions] finalizeGuestCard error:', err);
    return { success: false, message: 'Erreur lors de la création de la carte.' };
  }
}

/**
 * Connexion client OTP — envoyer un OTP de login.
 */
export async function sendOtpForLogin(
  email: string
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await otpFetch('/send', {
      method: 'POST',
      body: JSON.stringify({ identifier: email, identifierType: 'email', purpose: 'login' }),
    });
    return { success: result.success, message: result.message || '' };
  } catch {
    return { success: false, message: 'Impossible d\'envoyer le code.' };
  }
}

/**
 * Connexion client OTP — vérifier OTP et ouvrir la session.
 */
export async function loginWithOtp(
  email: string,
  code: string
): Promise<{ success: boolean; message?: string }> {
  try {
    // 1. Vérifier l'OTP
    const verifyResult = await verifyOtpCode(email, code, 'login');
    if (!verifyResult.success || !verifyResult.verifiedToken) {
      return { success: false, message: verifyResult.message };
    }

    // 2. Échanger le verifiedToken contre un session token
    const result = await otpFetch<{ token: string; user: object }>('/login', {
      method: 'POST',
      body: JSON.stringify({ verifiedToken: verifyResult.verifiedToken }),
    });

    if (!result.success || !result.data) {
      return { success: false, message: result.message };
    }

    // 3. Sauvegarder dans le cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', (result.data as any).token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return { success: true };
  } catch {
    return { success: false, message: 'Erreur lors de la connexion.' };
  }
}
