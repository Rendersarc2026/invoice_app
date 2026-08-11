import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signSessionToken } from '@/lib/auth';
import { convertNumberToIndianWords } from '@/lib/number-to-words';

export async function GET() {
  try {
    const demoEmail = 'admin@rendersarc.com';
    const demoPassword = 'Password123!';

    let user = await prisma.user.findUnique({
      where: { email: demoEmail },
      include: { companyProfile: true },
    });

    if (!user) {
      const passwordHash = await hashPassword(demoPassword);
      user = await prisma.user.create({
        data: {
          email: demoEmail,
          name: 'Rajat',
          passwordHash,
          companyProfile: {
            create: {
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
          },
        },
        include: { companyProfile: true },
      });
    }

    // Check if client Kreem Foods exists
    let client = await prisma.client.findFirst({
      where: { userId: user.id, name: 'KREEM FOODS PRIVATE LIMITED' },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          userId: user.id,
          name: 'KREEM FOODS PRIVATE LIMITED',
          addressLine1: 'No-46/1914/A, AKG Vayanasala CrossRoad, Chakkaraparambu,',
          addressLine2: 'Thammanam',
          city: 'Ernakulam',
          state: 'Kerala',
          pincode: '682032',
          country: 'India',
          gstin: '32AAACK8728L2ZA',
          email: 'accounts@kreemfoods.com',
          phone: '+91 98765 43210',
        },
      });
    }

    // Check if sample invoice exists
    let invoice = await prisma.invoice.findFirst({
      where: { userId: user.id, invoiceNumber: 'RA/SKEI/001' },
    });

    if (!invoice) {
      const subtotal = 50000.0;
      const cgstAmt = 4500.0;
      const sgstAmt = 4500.0;
      const totalAmt = 59000.0;

      invoice = await prisma.invoice.create({
        data: {
          userId: user.id,
          clientId: client.id,
          clientName: client.name,
          clientAddress: 'No-46/1914/A, AKG Vayanasala CrossRoad, Chakkaraparambu,\nThammanam\nErnakulam\n682032 Kerala\nIndia',
          clientGstin: client.gstin,
          invoiceNumber: 'RA/SKEI/001',
          invoiceDate: new Date('2026-07-30'),
          dueDate: new Date('2026-08-30'),
          status: 'PENDING',
          subject: 'Tax Invoice - SKEI Hidden Locations Platform',
          subtotal,
          cgstRate: 9.0,
          cgstAmount: cgstAmt,
          sgstRate: 9.0,
          sgstAmount: sgstAmt,
          totalAmount: totalAmt,
          totalInWords: convertNumberToIndianWords(totalAmt),
          bankName: 'HDFC Bank',
          accountName: 'RENDERS ARC',
          accountNo: '50200110640651',
          ifscCode: 'HDFC0001218',
          micrCode: '682240018',
          branchCode: '1218',
          signatory: 'Rajat',
          notes: 'Looking forward for your business.',
          items: {
            create: [
              {
                itemNumber: 1,
                description:
                  'Custom Development of the Skei Hidden Locations Platform Including Interactive Map, Admin Portal, Security Enhancements, Deployment and Training',
                hsnSac: '998314',
                quantity: 1.0,
                rate: 50000.0,
                cgstRate: 9.0,
                cgstAmount: 4500.0,
                sgstRate: 9.0,
                sgstAmount: 4500.0,
                amount: 50000.0,
              },
            ],
          },
        },
      });
    }

    // Create session & set cookie so user is logged in automatically when seeding
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: Math.random().toString(36).substring(2) + Date.now().toString(36),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
      message: 'Database seeded successfully with sample user and Renders Arc invoice!',
      credentials: {
        email: demoEmail,
        password: demoPassword,
      },
      sampleInvoiceId: invoice.id,
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
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message || 'Seed error' }, { status: 500 });
  }
}
