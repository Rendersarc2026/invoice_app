import { z } from 'zod';
import { GSTIN_REGEX, IFSC_REGEX } from './invoice';

/** Bounded string: trims, treats '' as absent, and caps stored length. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Cannot exceed ${max} characters`)
    .optional()
    .nullable()
    .transform((val) => (val ? val : null));

const optionalGstin = z
  .string()
  .trim()
  .toUpperCase()
  .max(15)
  .optional()
  .nullable()
  .transform((val) => (val ? val : null))
  .refine((val) => !val || GSTIN_REGEX.test(val), {
    message: 'Invalid GSTIN format (e.g. 32AAACK8728L2ZA)',
  });

const optionalIfsc = z
  .string()
  .trim()
  .toUpperCase()
  .max(11)
  .optional()
  .nullable()
  .transform((val) => (val ? val : null))
  .refine((val) => !val || IFSC_REGEX.test(val), {
    message: 'Invalid IFSC code format (e.g. HDFC0001218)',
  });

const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .optional()
  .nullable()
  .transform((val) => (val ? val : null))
  .refine((val) => !val || z.email().safeParse(val).success, {
    message: 'Invalid email address',
  });

/** Only same-origin paths or https URLs — never javascript:/data: payloads. */
const optionalLogoUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .transform((val) => (val ? val : null))
  .refine((val) => !val || val.startsWith('/') || val.startsWith('https://'), {
    message: 'Logo URL must be a relative path or an https:// URL',
  });

export const clientSchema = z.object({
  name: z.string().trim().min(2, 'Client name must be at least 2 characters long').max(200),
  addressLine1: optionalText(200),
  addressLine2: optionalText(200),
  city: optionalText(100),
  state: optionalText(100),
  pincode: optionalText(20),
  country: optionalText(100),
  gstin: optionalGstin,
  email: optionalEmail,
  phone: optionalText(30),
});

export const companyProfileSchema = z.object({
  name: z.string().trim().min(2, 'Company name must be at least 2 characters long').max(200),
  tagline: optionalText(200),
  addressLine1: optionalText(200),
  addressLine2: optionalText(200),
  city: optionalText(100),
  state: optionalText(100),
  pincode: optionalText(20),
  country: optionalText(100),
  gstin: optionalGstin,
  email: optionalEmail,
  phone: optionalText(30),
  bankName: optionalText(100),
  accountName: optionalText(100),
  accountNo: optionalText(50),
  ifscCode: optionalIfsc,
  micrCode: optionalText(20),
  branchCode: optionalText(20),
  signatory: optionalText(100),
  signatoryTitle: optionalText(100),
  logoUrl: optionalLogoUrl,
});

export type ClientInput = z.infer<typeof clientSchema>;
export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;
