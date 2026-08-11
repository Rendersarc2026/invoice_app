import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/auth';

/**
 * First gate in front of the app shell: unauthenticated requests to app pages
 * are redirected to /login instead of rendering a shell that then 401s on its
 * own data fetches.
 *
 * This checks the JWT signature only — no database round-trip. Route handlers
 * still call getAuthenticatedUser(), which additionally verifies the session row
 * (revocation, expiry, lockout). Treat this as UX-level gating, not the
 * authorization boundary.
 */
const PROTECTED_PREFIXES = ['/dashboard', '/invoices', '/clients', '/settings'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;
  const payload = token ? await verifySessionToken(token) : null;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !payload) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/login' && payload) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/invoices/:path*', '/clients/:path*', '/settings/:path*', '/login'],
};
