import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Renders Arc - Tax Invoice & Billing Platform',
  description: 'High-security GST Tax Invoice management application built with Next.js, Prisma ORM, and Supabase PostgreSQL.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
