import { z } from 'zod';

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const HSN_SAC_REGEX = /^[0-9]{4,8}$/;

export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().trim().min(1, 'Item description is required'),
  hsnSac: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || HSN_SAC_REGEX.test(val), {
      message: 'HSN/SAC code must be 4 to 8 numeric digits',
    }),
  quantity: z
    .number({ message: 'Quantity must be a valid number' })
    .gt(0, 'Quantity must be greater than 0'),
  rate: z
    .number({ message: 'Rate must be a valid number' })
    .gte(0, 'Rate cannot be negative'),
  cgstRate: z
    .number({ message: 'CGST rate must be a valid number' })
    .gte(0, 'CGST rate cannot be negative')
    .lte(100, 'CGST rate cannot exceed 100%')
    .default(9),
  sgstRate: z
    .number({ message: 'SGST rate must be a valid number' })
    .gte(0, 'SGST rate cannot be negative')
    .lte(100, 'SGST rate cannot exceed 100%')
    .default(9),
  igstRate: z
    .number({ message: 'IGST rate must be a valid number' })
    .gte(0, 'IGST rate cannot be negative')
    .lte(100, 'IGST rate cannot exceed 100%')
    .default(0),
});

export const createInvoiceSchema = z
  .object({
    clientId: z.string().nullable().optional(),
    invoiceNumber: z
      .string()
      .trim()
      .min(1, 'Invoice number is required')
      .max(50, 'Invoice number cannot exceed 50 characters'),
    invoiceDate: z.string().min(1, 'Invoice date is required'),
    dueDate: z.string().optional().nullable(),
    status: z.enum(['DRAFT', 'PENDING', 'PAID', 'CANCELLED']).default('PENDING'),
    subject: z.string().trim().optional().nullable(),

    clientName: z
      .string()
      .trim()
      .min(2, 'Client name must be at least 2 characters long'),
    clientAddress: z
      .string()
      .trim()
      .min(5, 'Client address must be at least 5 characters long'),
    clientGstin: z
      .string()
      .trim()
      .toUpperCase()
      .optional()
      .nullable()
      .refine((val) => !val || GSTIN_REGEX.test(val), {
        message: 'Invalid GSTIN format (e.g. 32AAACK8728L2ZA)',
      }),

    items: z
      .array(invoiceItemSchema)
      .min(1, 'At least one line item is required'),

    bankName: z.string().trim().optional().nullable(),
    accountName: z.string().trim().optional().nullable(),
    accountNo: z.string().trim().optional().nullable(),
    ifscCode: z
      .string()
      .trim()
      .toUpperCase()
      .optional()
      .nullable()
      .refine((val) => !val || IFSC_REGEX.test(val), {
        message: 'Invalid IFSC code format (e.g. HDFC0001218)',
      }),
    micrCode: z.string().trim().optional().nullable(),
    branchCode: z.string().trim().optional().nullable(),
    signatory: z.string().trim().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.invoiceDate && data.dueDate) {
        return new Date(data.dueDate) >= new Date(data.invoiceDate);
      }
      return true;
    },
    {
      message: 'Due date cannot be earlier than the invoice date',
      path: ['dueDate'],
    }
  );

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
