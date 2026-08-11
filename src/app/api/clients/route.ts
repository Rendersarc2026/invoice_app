import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { clientSchema } from '@/lib/validations/company';
import { unauthorized, validationErrorResponse } from '@/lib/api-errors';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const clients = await prisma.client.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  try {
    const parsed = clientSchema.safeParse(await req.json());
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const data = parsed.data;

    const client = await prisma.client.create({
      data: {
        userId: user.id,
        name: data.name,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        country: data.country || 'India',
        gstin: data.gstin,
        email: data.email,
        phone: data.phone,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Client creation error:', error);
    return NextResponse.json({ error: 'Internal server error while creating client.' }, { status: 500 });
  }
}
