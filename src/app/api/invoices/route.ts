import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { convertNumberToIndianWords } from '@/lib/number-to-words';
import { createInvoiceSchema } from '@/lib/validations/invoice';
import { computeInvoiceTotals } from '@/lib/invoice-totals';
import { unauthorized, validationErrorResponse } from '@/lib/api-errors';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const invoices = await prisma.invoice.findMany({
    where: { userId: user.id },
    include: {
      items: true,
      client: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  try {
    const body = await req.json();

    const validationResult = createInvoiceSchema.safeParse(body);
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    const data = validationResult.data;

    // A clientId from the request body must belong to the caller, otherwise an
    // invoice can be linked to another tenant's client and the GET response
    // (which includes the client) leaks their address, GSTIN and contacts.
    if (data.clientId) {
      const ownsClient = await prisma.client.findFirst({
        where: { id: data.clientId, userId: user.id },
        select: { id: true },
      });

      if (!ownsClient) {
        return NextResponse.json(
          {
            error: 'Selected client was not found.',
            details: [{ field: 'clientId', message: 'Unknown client.' }],
          },
          { status: 400 }
        );
      }
    }

    // Friendly duplicate check; the unique constraint below is what actually
    // makes this safe under concurrency.
    const existingNumber = await prisma.invoice.findFirst({
      where: { userId: user.id, invoiceNumber: data.invoiceNumber },
      select: { id: true },
    });

    if (existingNumber) {
      return NextResponse.json(
        {
          error: `Invoice number "${data.invoiceNumber}" already exists. Please use a unique invoice number.`,
          details: [{ field: 'invoiceNumber', message: 'Invoice number must be unique.' }],
        },
        { status: 400 }
      );
    }

    const totals = computeInvoiceTotals(data.items);
    const totalInWords = convertNumberToIndianWords(totals.totalAmount);

    const invoice = await prisma.invoice.create({
      data: {
        userId: user.id,
        clientId: data.clientId || null,
        clientName: data.clientName,
        clientAddress: data.clientAddress,
        clientGstin: data.clientGstin || null,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: new Date(data.invoiceDate),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: data.status,
        subject: data.subject || null,
        subtotal: totals.subtotal,
        cgstRate: totals.cgstRate,
        cgstAmount: totals.cgstAmount,
        sgstRate: totals.sgstRate,
        sgstAmount: totals.sgstAmount,
        igstRate: totals.igstRate,
        igstAmount: totals.igstAmount,
        totalAmount: totals.totalAmount,
        totalInWords,
        bankName: data.bankName || null,
        accountName: data.accountName || null,
        accountNo: data.accountNo || null,
        ifscCode: data.ifscCode || null,
        micrCode: data.micrCode || null,
        branchCode: data.branchCode || null,
        signatory: data.signatory || null,
        notes: data.notes || null,
        items: {
          create: totals.processedItems,
        },
      },
      include: {
        items: true,
        client: true,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    // Uniqueness is enforced by @@unique([userId, invoiceNumber]) in the schema,
    // so concurrent creates collide here rather than both succeeding.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        {
          error: 'That invoice number already exists. Please use a unique invoice number.',
          details: [{ field: 'invoiceNumber', message: 'Invoice number must be unique.' }],
        },
        { status: 409 }
      );
    }

    console.error('Invoice creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error while creating invoice.' },
      { status: 500 }
    );
  }
}
