import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-super-secret-jwt-key-min-32-chars-long'
);

export async function proxy(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const { pathname } = req.nextUrl;

  let isAuthenticated = false;
  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET_KEY);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  // If authenticated user visits login, register, or root -> redirect to dashboard
  if (isAuthenticated && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If unauthenticated user visits protected routes -> redirect to login
  if (!isAuthenticated && (pathname.startsWith('/dashboard') || pathname.startsWith('/invoices') || pathname.startsWith('/clients') || pathname.startsWith('/settings'))) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register', '/dashboard/:path*', '/invoices/:path*', '/clients/:path*', '/settings/:path*'],
};
