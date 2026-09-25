import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require NO auth (redirect to login if no token)
const publicRoutes = [
  '/login',
  '/register',
  '/register/merchant',
  '/register/merchant/demande-envoyee',
  '/activate-account',
  '/forgot-password',
  '/reset-password',
];

// Routes always accessible regardless of auth state — no redirect in either direction
const alwaysPublicRoutes = [
  '/chatbot',     // Standalone client chatbot — accessible by anyone without Retenza account
  '/avantages',   // Public marketing page — accessible whether logged in or not
  '/register/client', // Client registration — must be accessible even during pending verification polling
  '/m',           // QR Code merchant landing pages — must be accessible even when logged in
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Always-public routes: skip all auth logic entirely
  const isAlwaysPublic = alwaysPublicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
  if (isAlwaysPublic) return NextResponse.next();

  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Protect private routes — redirect to login preserving the host/port
  if (!token && !isPublicRoute && pathname !== '/') {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from auth pages back to home
  if (token && isPublicRoute) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}


export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - Static file extensions (.png, .jpg, .jpeg, .gif, .svg, .webp, .ico, .woff, .woff2)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|otf|mp4|mp3|pdf|txt|json|xml|csv|zip|tar|gz|bz2)$).*)',
  ],
};
