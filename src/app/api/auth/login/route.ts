import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyPassword,
  verifyPasswordAgainstDummy,
  checkLoginLockout,
  handleFailedLogin,
  resetLoginLockout,
  createSession,
  setAuthCookie,
  sweepExpiredSessions,
} from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * One message for every credential failure. Distinguishing "no such account"
 * from "wrong password" (or leaking a remaining-attempts counter) lets an
 * attacker enumerate valid accounts before ever guessing a password.
 */
const GENERIC_FAILURE = 'Invalid username/email or password.';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateCheckIp = checkRateLimit(`login:ip:${ip}`, 5, 60000);
    if (!rateCheckIp.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts from this IP. Please try again in 1 minute.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const loginInput = (body.email || body.username || '').toLowerCase().trim();
    const password = typeof body.password === 'string' ? body.password : '';

    if (!loginInput || !password) {
      return NextResponse.json({ error: 'Username/Email and password are required.' }, { status: 400 });
    }

    const rateCheckUser = checkRateLimit(`login:account:${loginInput}`, 5, 60000);
    if (!rateCheckUser.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts for this account. Please try again in 1 minute.' },
        { status: 429 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginInput },
          ...(loginInput === 'admin' ? [{ email: 'admin@rendersarc.com' }] : []),
          ...(loginInput === 'admin@rendersarc.com' ? [{ email: 'admin' }] : []),
        ],
      },
    });

    if (!user) {
      // Spend the same time a real bcrypt verification would, so response
      // latency does not disclose whether the account exists.
      await verifyPasswordAgainstDummy(password);
      return NextResponse.json({ error: GENERIC_FAILURE }, { status: 401 });
    }

    const lockout = await checkLoginLockout(user);
    const isMatch = await verifyPassword(password, user.passwordHash);

    if (!isMatch) {
      // Don't extend an active lockout on further guesses, and don't reveal
      // that the account is locked to someone who lacks the password.
      if (!lockout.isLocked) {
        await handleFailedLogin(user.id, user.failedLoginAttempts);
      }
      return NextResponse.json({ error: GENERIC_FAILURE }, { status: 401 });
    }

    // Password is correct. Only now is it safe to explain the lockout: the
    // caller already holds the credentials, so nothing extra is disclosed.
    if (lockout.isLocked) {
      const remainingMins = lockout.remainingMinutes || 5;
      const timeStr =
        remainingMins >= 60 ? `${Math.ceil(remainingMins / 60)} hour(s)` : `${remainingMins} minute(s)`;
      return NextResponse.json(
        {
          error: `Account is temporarily locked after repeated failed login attempts. Please try again in ${timeStr}.`,
        },
        { status: 423 }
      );
    }

    await resetLoginLockout(user.id);
    await sweepExpiredSessions();

    const token = await createSession(user, {
      ipAddress: ip,
      userAgent: req.headers.get('user-agent'),
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error during login.' }, { status: 500 });
  }
}
