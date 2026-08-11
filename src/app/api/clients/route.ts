import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clients = await prisma.client.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  if (!body.name) {
    return NextResponse.json({ error: 'Client name is required.' }, { status: 400 });
  }

  const client = await prisma.client.create({
    data: {
      userId: user.id,
      name: body.name,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      country: body.country || 'India',
      gstin: body.gstin,
      email: body.email,
      phone: body.phone,
    },
  });

  return NextResponse.json(client, { status: 201 });
}
