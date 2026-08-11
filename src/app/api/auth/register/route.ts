import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordStrength, createSession, setAuthCookie } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { validationErrorResponse } from '@/lib/api-errors';

/**
 * Self-service signup is off unless explicitly enabled. The app ships as a
 * private portal (/register redirects to /login), so an open registration
 * endpoint would let anyone create a tenant.
 */
const REGISTRATION_ENABLED = process.env.ALLOW_REGISTRATION === 'true';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100),
  email: z.email('A valid email address is required').max(200),
  password: z.string().min(8, 'Password must be at least 8 characters long').max(200),
});

export async function POST(req: Request) {
  if (!REGISTRATION_ENABLED) {
    // 404 rather than 403: don't advertise a disabled endpoint.
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  try {
    const ip = getClientIp(req);
    const rateCheck = checkRateLimit(`register:${ip}`, 5, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many registration requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const { name, password } = parsed.data;
    const normalizedEmail = parsed.data.email.toLowerCase().trim();

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return NextResponse.json({ error: passwordCheck.message }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        companyProfile: {
          create: {
            name: name.toUpperCase(),
            tagline: 'THE POWER TO MANIFEST',
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    const token = await createSession(user, {
      ipAddress: ip,
      userAgent: req.headers.get('user-agent'),
    });

    const response = NextResponse.json({ success: true, user });
    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error during registration.' }, { status: 500 });
  }
}
