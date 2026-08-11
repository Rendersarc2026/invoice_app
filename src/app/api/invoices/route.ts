import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { convertNumberToIndianWords } from '@/lib/number-to-words';
import { createInvoiceSchema } from '@/lib/validations/invoice';

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();

    // Zod Schema Validation
    const validationResult = createInvoiceSchema.safeParse(body);
    if (!validationResult.success) {
      const formattedErrors = validationResult.error.issues.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return NextResponse.json(
        { error: 'Validation failed.', details: formattedErrors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check duplicate invoice number for this user
    const existingNumber = await prisma.invoice.findFirst({
      where: {
        userId: user.id,
        invoiceNumber: data.invoiceNumber,
      },
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

    // Process tax & totals
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const processedItems = data.items.map((item, idx) => {
      const qty = item.quantity;
      const rate = item.rate;
      const itemAmount = qty * rate;
      subtotal += itemAmount;

      const cAmt = (itemAmount * item.cgstRate) / 100;
      const sAmt = (itemAmount * item.sgstRate) / 100;
      const iAmt = (itemAmount * item.igstRate) / 100;

      totalCgst += cAmt;
      totalSgst += sAmt;
      totalIgst += iAmt;

      return {
        itemNumber: idx + 1,
        description: item.description,
        hsnSac: item.hsnSac || null,
        quantity: qty,
        rate,
        cgstRate: item.cgstRate,
        cgstAmount: cAmt,
        sgstRate: item.sgstRate,
        sgstAmount: sAmt,
        igstRate: item.igstRate,
        igstAmount: iAmt,
        amount: itemAmount,
      };
    });

    const totalAmount = subtotal + totalCgst + totalSgst + totalIgst;
    const totalInWords = convertNumberToIndianWords(totalAmount);

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
        subtotal,
        cgstRate: data.items[0]?.cgstRate ?? 9,
        cgstAmount: totalCgst,
        sgstRate: data.items[0]?.sgstRate ?? 9,
        sgstAmount: totalSgst,
        igstRate: data.items[0]?.igstRate ?? 0,
        igstAmount: totalIgst,
        totalAmount,
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
          create: processedItems,
        },
      },
      include: {
        items: true,
        client: true,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error('Invoice creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error while creating invoice.' },
      { status: 500 }
    );
  }
}
