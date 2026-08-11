import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { convertNumberToIndianWords } from '@/lib/number-to-words';
import { createInvoiceSchema } from '@/lib/validations/invoice';
import { computeInvoiceTotals } from '@/lib/invoice-totals';
import { unauthorized, validationErrorResponse } from '@/lib/api-errors';

const statusSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'PAID', 'CANCELLED']),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: user.id },
    include: {
      items: { orderBy: { itemNumber: 'asc' } },
      client: true,
      // `select` is deliberate: a bare `include` on this relation would return
      // every User scalar, shipping passwordHash and lockout state to the
      // browser. Only the company profile is needed to render the PDF.
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          companyProfile: true,
        },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  return NextResponse.json(invoice);
}

/** Status-only update, so changing status no longer round-trips the whole invoice. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const existingInvoice = await prisma.invoice.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });

  if (!existingInvoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  try {
    const parsed = statusSchema.safeParse(await req.json());
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status: parsed.data.status },
      include: {
        items: { orderBy: { itemNumber: 'asc' } },
        client: true,
        user: {
          select: { id: true, name: true, email: true, companyProfile: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Invoice status update error:', error);
    return NextResponse.json({ error: 'Internal server error while updating status.' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const existingInvoice = await prisma.invoice.findFirst({
    where: { id, userId: user.id },
  });

  if (!existingInvoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  try {
    const body = await req.json();

    const validationResult = createInvoiceSchema.safeParse(body);
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.error);
    }

    const data = validationResult.data;

    // Same ownership rule as create: never link another tenant's client.
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

    if (data.invoiceNumber !== existingInvoice.invoiceNumber) {
      const duplicate = await prisma.invoice.findFirst({
        where: {
          userId: user.id,
          invoiceNumber: data.invoiceNumber,
          NOT: { id },
        },
        select: { id: true },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            error: `Invoice number "${data.invoiceNumber}" already exists. Please use a unique invoice number.`,
            details: [{ field: 'invoiceNumber', message: 'Invoice number must be unique.' }],
          },
          { status: 400 }
        );
      }
    }

    const totals = computeInvoiceTotals(data.items);
    const totalInWords = convertNumberToIndianWords(totals.totalAmount);

    // Delete-then-recreate must be atomic: run as two statements, a failure
    // between them leaves the invoice with no line items and no way back.
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });

      return tx.invoice.update({
        where: { id },
        data: {
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
          items: { orderBy: { itemNumber: 'asc' } },
          client: true,
        },
      });
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        {
          error: 'That invoice number already exists. Please use a unique invoice number.',
          details: [{ field: 'invoiceNumber', message: 'Invoice number must be unique.' }],
        },
        { status: 409 }
      );
    }

    console.error('Invoice update error:', error);
    return NextResponse.json({ error: 'Internal server error while updating invoice.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const { id } = await params;

  const existingInvoice = await prisma.invoice.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });

  if (!existingInvoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  await prisma.invoice.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
