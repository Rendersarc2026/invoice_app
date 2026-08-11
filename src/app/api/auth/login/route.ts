import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signSessionToken, checkLoginLockout, handleFailedLogin, resetLoginLockout } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`login:${ip}`, 5, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again in 1 minute.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Check account lockout
    const lockout = await checkLoginLockout(user);
    if (lockout.isLocked) {
      return NextResponse.json(
        {
          error: `Account is temporarily locked due to multiple failed attempts. Please try again in ${lockout.remainingMinutes} minutes.`,
        },
        { status: 423 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);

    if (!isMatch) {
      const failedResult = await handleFailedLogin(user.id, user.failedLoginAttempts);
      if (failedResult.isLocked) {
        return NextResponse.json(
          { error: 'Account locked due to 5 consecutive failed login attempts. Try again in 15 minutes.' },
          { status: 423 }
        );
      }
      return NextResponse.json(
        { error: `Invalid email or password. ${failedResult.attemptsLeft} attempts remaining before temporary lockout.` },
        { status: 401 }
      );
    }

    // Successful login -> Reset lockout
    await resetLoginLockout(user.id);

    // Create session in DB
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: Math.random().toString(36).substring(2) + Date.now().toString(36),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        ipAddress: ip,
        userAgent: req.headers.get('user-agent'),
      },
    });

    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
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

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error during login.' }, { status: 500 });
  }
}
