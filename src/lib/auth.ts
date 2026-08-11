import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { prisma } from './prisma';

let cachedSecretKey: Uint8Array | null = null;

/**
 * Resolved lazily (not at module load) so that `next build` does not require the
 * secret to be present. Any request that needs a session fails loudly instead of
 * silently falling back to a shared, guessable key.
 */
function getSecretKey(): Uint8Array {
  if (cachedSecretKey) return cachedSecretKey;

  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET is missing or shorter than 32 characters. Set it in the environment before serving requests.'
    );
  }

  cachedSecretKey = new TextEncoder().encode(secret);
  return cachedSecretKey;
}

const MAX_FAILED_ATTEMPTS = 5;

/**
 * Progressive lockout instead of a flat 1 hour: an attacker who knows an email
 * can still trip the lock, but a legitimate user is not shut out for an hour on
 * their first bad run. Index is (attempts - MAX_FAILED_ATTEMPTS), clamped.
 */
const LOCKOUT_SCHEDULE_MINUTES = [5, 15, 60];

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * A real bcrypt hash of a random value, compared against when the submitted
 * email does not exist so that login timing does not reveal account existence.
 */
const DUMMY_PASSWORD_HASH = '$2b$12$oGZ7qp1SZPmfqi0.Gg4RCeK9WKQPWwFHW2o53onU.ozxNhvBkYyBe';

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character.' };
  }
  return { valid: true };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Burns the same time as a real verification so unknown emails are indistinguishable. */
export async function verifyPasswordAgainstDummy(password: string): Promise<void> {
  await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Session cookies are Secure everywhere except local development. This reads
 * NODE_ENV only to detect local dev, so a stray NODE_ENV value in a deployed
 * .env cannot silently drop the flag on a production host.
 */
export function setAuthCookie(response: NextResponse, token: string) {
  const isLocalDev = process.env.NODE_ENV === 'development' && !process.env.VERCEL;

  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: !isLocalDev,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function createSession(
  user: { id: string; email: string; role: string },
  meta: { ipAddress?: string | null; userAgent?: string | null } = {}
): Promise<string> {
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
    },
  });

  return signSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId: session.id,
  });
}

export async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload || !payload.userId || !payload.sessionId) return null;

  // Verify session in database
  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          failedLoginAttempts: true,
          lockedUntil: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  // The session must belong to the user named in the token, so a token that
  // points at someone else's session is rejected rather than honoured.
  if (session.userId !== payload.userId) {
    return null;
  }

  // Check if account is currently locked
  if (session.user.lockedUntil && session.user.lockedUntil > new Date()) {
    return null;
  }

  return session.user;
}

export async function checkLoginLockout(user: {
  id: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
}): Promise<{ isLocked: boolean; remainingMinutes?: number }> {
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingMs = user.lockedUntil.getTime() - Date.now();
    const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
    return { isLocked: true, remainingMinutes };
  }
  return { isLocked: false };
}

export async function handleFailedLogin(userId: string, currentFailedAttempts: number) {
  const newAttempts = currentFailedAttempts + 1;
  let lockedUntil: Date | null = null;

  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    const step = Math.min(newAttempts - MAX_FAILED_ATTEMPTS, LOCKOUT_SCHEDULE_MINUTES.length - 1);
    lockedUntil = new Date(Date.now() + LOCKOUT_SCHEDULE_MINUTES[step] * 60 * 1000);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: newAttempts,
      lockedUntil,
    },
  });

  return { attemptsLeft: Math.max(0, MAX_FAILED_ATTEMPTS - newAttempts), isLocked: !!lockedUntil };
}

export async function resetLoginLockout(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  });
}

/** Opportunistic cleanup so the session table does not grow without bound. */
export async function sweepExpiredSessions() {
  try {
    await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  } catch {
    // Cleanup is best-effort and must never fail a login.
  }
}
