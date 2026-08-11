import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let profile = await prisma.companyProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    profile = await prisma.companyProfile.create({
      data: {
        userId: user.id,
        name: 'RENDERS ARC',
        tagline: 'THE POWER TO MANIFEST',
        addressLine1: '3rd Flr 60/44 JC Chambers Panampily Nagar',
        addressLine2: 'Opp Kairali Flat, Panampilly Nagar',
        city: 'Kochi, Ernakulam',
        state: 'Kerala',
        pincode: '682036',
        country: 'India',
        gstin: '32DLOPR0998L1Z9',
        bankName: 'HDFC Bank',
        accountName: 'RENDERS ARC',
        accountNo: '50200110640651',
        ifscCode: 'HDFC0001218',
        micrCode: '682240018',
        branchCode: '1218',
        signatory: 'Rajat',
        signatoryTitle: 'Renders Arc',
      },
    });
  }

  return NextResponse.json(profile);
}

export async function PUT(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const profile = await prisma.companyProfile.upsert({
    where: { userId: user.id },
    update: {
      name: body.name,
      tagline: body.tagline,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      country: body.country,
      gstin: body.gstin,
      email: body.email,
      phone: body.phone,
      bankName: body.bankName,
      accountName: body.accountName,
      accountNo: body.accountNo,
      ifscCode: body.ifscCode,
      micrCode: body.micrCode,
      branchCode: body.branchCode,
      signatory: body.signatory,
      signatoryTitle: body.signatoryTitle,
      logoUrl: body.logoUrl,
    },
    create: {
      userId: user.id,
      name: body.name || 'RENDERS ARC',
      tagline: body.tagline || 'THE POWER TO MANIFEST',
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      country: body.country,
      gstin: body.gstin,
      email: body.email,
      phone: body.phone,
      bankName: body.bankName,
      accountName: body.accountName,
      accountNo: body.accountNo,
      ifscCode: body.ifscCode,
      micrCode: body.micrCode,
      branchCode: body.branchCode,
      signatory: body.signatory,
      signatoryTitle: body.signatoryTitle,
      logoUrl: body.logoUrl,
    },
  });

  return NextResponse.json(profile);
}
