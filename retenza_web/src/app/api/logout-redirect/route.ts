import { NextResponse } from 'next/server';

/**
 * GET /api/logout-redirect?to=/register/client
 *
 * Efface le cookie auth_token côté serveur et redirige vers l'URL demandée.
 * Utilisé depuis les pages publiques (ex: landing page commerçant) pour
 * déconnecter proprement un client OTP et l'envoyer vers l'inscription.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get('to') || '/login';

  const response = NextResponse.redirect(new URL(destination, request.url));

  // Supprimer le cookie httpOnly côté serveur
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
