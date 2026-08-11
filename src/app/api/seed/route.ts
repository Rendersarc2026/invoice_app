import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordStrength } from '@/lib/auth';
import { convertNumberToIndianWords } from '@/lib/number-to-words';

/**
 * Seeding is an administrative action, not a login.
 *
 * This route previously answered unauthenticated GETs by creating a session and
 * setting an auth cookie on the caller, which made it a one-click admin login
 * (and, via a cross-site <img>, a session-fixation vector). It now requires a
 * POST carrying a shared secret, never issues a cookie, and never echoes
 * credentials back.
 */
function isAuthorized(req: Request): boolean {
  const expected = process.env.SEED_SECRET;
  // No secret configured => the route is inert.
  if (!expected) return false;

  const provided = req.headers.get('x-seed-secret') || '';
  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);

  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed an admin user.' },
        { status: 400 }
      );
    }

    // No 'admin'/'admin' fallback: a seeded account must satisfy the same
    // password policy as any registered one.
    const passwordCheck = validatePasswordStrength(adminPassword);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: `ADMIN_PASSWORD is too weak: ${passwordCheck.message}` },
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { email: adminEmail.toLowerCase().trim() },
      include: { companyProfile: true },
    });

    if (!user) {
      const passwordHash = await hashPassword(adminPassword);
      user = await prisma.user.create({
        data: {
          email: adminEmail.toLowerCase().trim(),
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
          clientAddress:
            'No-46/1914/A, AKG Vayanasala CrossRoad, Chakkaraparambu,\nThammanam\nErnakulam\n682032 Kerala\nIndia',
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

    // Deliberately returns no credentials and sets no session cookie.
    return NextResponse.json({
      success: true,
      message: 'Database seeded. Sign in normally at /login.',
      sampleInvoiceId: invoice.id,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Seed failed.' }, { status: 500 });
  }
}
