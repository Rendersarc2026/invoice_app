import type { CreateInvoiceInput } from './validations/invoice';

/**
 * Money is stored as Float (see prisma/schema.prisma). Rounding every computed
 * amount to paise keeps `subtotal + taxes` equal to `totalAmount` on the printed
 * document instead of drifting by fractions of a rupee.
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface ProcessedItem {
  itemNumber: number;
  description: string;
  hsnSac: string | null;
  quantity: number;
  rate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  amount: number;
}

export interface InvoiceTotals {
  processedItems: ProcessedItem[];
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
}

/**
 * Effective rate for the invoice header. When every line shares a rate that rate
 * is used verbatim; with mixed rates it is derived from the tax actually charged
 * so the header can never contradict the amounts beneath it.
 */
function effectiveRate(taxTotal: number, subtotal: number, rates: number[], fallback: number): number {
  const unique = new Set(rates);
  if (unique.size === 1) return rates[0] ?? fallback;
  if (subtotal <= 0) return fallback;
  return round2((taxTotal / subtotal) * 100);
}

export function computeInvoiceTotals(items: CreateInvoiceInput['items']): InvoiceTotals {
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const processedItems = items.map((item, idx) => {
    const itemAmount = round2(item.quantity * item.rate);
    const cAmt = round2((itemAmount * item.cgstRate) / 100);
    const sAmt = round2((itemAmount * item.sgstRate) / 100);
    const iAmt = round2((itemAmount * item.igstRate) / 100);

    subtotal += itemAmount;
    totalCgst += cAmt;
    totalSgst += sAmt;
    totalIgst += iAmt;

    return {
      itemNumber: idx + 1,
      description: item.description,
      hsnSac: item.hsnSac || null,
      quantity: item.quantity,
      rate: item.rate,
      cgstRate: item.cgstRate,
      cgstAmount: cAmt,
      sgstRate: item.sgstRate,
      sgstAmount: sAmt,
      igstRate: item.igstRate,
      igstAmount: iAmt,
      amount: itemAmount,
    };
  });

  subtotal = round2(subtotal);
  totalCgst = round2(totalCgst);
  totalSgst = round2(totalSgst);
  totalIgst = round2(totalIgst);

  return {
    processedItems,
    subtotal,
    cgstAmount: totalCgst,
    sgstAmount: totalSgst,
    igstAmount: totalIgst,
    totalAmount: round2(subtotal + totalCgst + totalSgst + totalIgst),
    cgstRate: effectiveRate(totalCgst, subtotal, items.map((i) => i.cgstRate), 9),
    sgstRate: effectiveRate(totalSgst, subtotal, items.map((i) => i.sgstRate), 9),
    igstRate: effectiveRate(totalIgst, subtotal, items.map((i) => i.igstRate), 0),
  };
}
