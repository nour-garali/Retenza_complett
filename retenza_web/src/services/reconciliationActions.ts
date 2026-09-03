'use server';

import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

export interface ReconciliationResult {
  mergedCount: number;
  message: string;
  mergedCards: { cardPublicId: string; merchantPublicCode: string }[];
}

/**
 * Calls the protected /api/public/loyalty-card/reconcile endpoint.
 * Reads the JWT from the session cookie automatically (server-side).
 */
export async function triggerReconciliation(): Promise<ReconciliationResult | { error: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return { error: 'Vous devez être connecté pour importer vos cartes.' };
    }

    const res = await fetch(`${API_URL}/public/loyalty-card/reconcile`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const json = await res.json();

    if (!json.success) {
      return { error: json.message || 'Erreur lors de la réconciliation.' };
    }

    return {
      mergedCount: json.data.mergedCount,
      message: json.data.message,
      mergedCards: json.data.mergedCards ?? [],
    };
  } catch (err) {
    console.error('[reconciliationActions] triggerReconciliation error:', err);
    return { error: 'Impossible de contacter le serveur. Vérifiez votre connexion.' };
  }
}
