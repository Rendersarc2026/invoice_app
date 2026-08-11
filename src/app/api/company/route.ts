import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { companyProfileSchema } from '@/lib/validations/company';
import { unauthorized, validationErrorResponse } from '@/lib/api-errors';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  let profile = await prisma.companyProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    // A new profile starts from the account's own name rather than another
    // company's bank details.
    profile = await prisma.companyProfile.create({
      data: {
        userId: user.id,
        name: user.name?.toUpperCase() || 'MY COMPANY',
        country: 'India',
      },
    });
  }

  return NextResponse.json(profile);
}

export async function PUT(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  try {
    const parsed = companyProfileSchema.safeParse(await req.json());
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const data = parsed.data;

    const fields = {
      name: data.name,
      tagline: data.tagline,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      country: data.country,
      gstin: data.gstin,
      email: data.email,
      phone: data.phone,
      bankName: data.bankName,
      accountName: data.accountName,
      accountNo: data.accountNo,
      ifscCode: data.ifscCode,
      micrCode: data.micrCode,
      branchCode: data.branchCode,
      signatory: data.signatory,
      signatoryTitle: data.signatoryTitle,
      logoUrl: data.logoUrl,
    };

    const profile = await prisma.companyProfile.upsert({
      where: { userId: user.id },
      update: fields,
      create: { userId: user.id, ...fields },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Company profile update error:', error);
    return NextResponse.json({ error: 'Internal server error while saving profile.' }, { status: 500 });
  }
}
