import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (token) {
      const payload = await verifySessionToken(token);
      if (payload?.sessionId) {
        await prisma.session.delete({ where: { id: payload.sessionId } }).catch(() => {});
      }
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('auth_token');
    return response;
  } catch (error) {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('auth_token');
    return response;
  }
}
