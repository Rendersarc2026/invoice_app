'use client';

import React from 'react';

interface InvoiceItem {
  id?: string;
  itemNumber: number;
  description: string;
  hsnSac?: string | null;
  quantity: number;
  rate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  amount: number;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string | Date;
  subject?: string | null;
  clientName: string;
  clientAddress: string;
  clientGstin?: string | null;
  subtotal: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  totalAmount: number;
  totalInWords?: string | null;
  bankName?: string | null;
  accountName?: string | null;
  accountNo?: string | null;
  ifscCode?: string | null;
  micrCode?: string | null;
  branchCode?: string | null;
  signatory?: string | null;
  notes?: string | null;
  items: InvoiceItem[];
  user?: {
    companyProfile?: {
      name?: string | null;
      tagline?: string | null;
      addressLine1?: string | null;
      addressLine2?: string | null;
      city?: string | null;
      state?: string | null;
      pincode?: string | null;
      country?: string | null;
      gstin?: string | null;
      bankName?: string | null;
      accountName?: string | null;
      accountNo?: string | null;
      ifscCode?: string | null;
      micrCode?: string | null;
      branchCode?: string | null;
      signatory?: string | null;
      signatoryTitle?: string | null;
    } | null;
  } | null;
}

export default function InvoicePDFView({ invoice }: { invoice: InvoiceData }) {
  const company = invoice.user?.companyProfile || {
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
  };

  const formattedDate = new Date(invoice.invoiceDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div id="invoice-pdf-document" className="pdf-container">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div className="invoice-header-brand" style={{ letterSpacing: '0.45em', fontWeight: 800 }}>
            {(company.name || 'RENDERS ARC').split('').join(' ')}
          </div>
        </div>

        <div style={{ textAlign: 'right', fontSize: '11px', color: '#4b5563', lineHeight: '1.4' }}>
          <div style={{ fontWeight: 600, color: '#111827', fontSize: '12px' }}>{company.name || 'RENDERS ARC'}</div>
          {company.addressLine1 && <div>{company.addressLine1}</div>}
          {company.addressLine2 && <div>{company.addressLine2}</div>}
          {(company.city || company.state || company.pincode) && (
            <div>
              {company.city}
              {company.city && company.state ? ', ' : ''}
              {company.state} {company.pincode}
            </div>
          )}
          {company.country && <div>{company.country}</div>}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0' }} />

      {/* Invoice Meta Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24, fontSize: '12px' }}>
        <div>
          <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: 4 }}>Invoice No.</div>
          <div style={{ fontWeight: 600, color: '#111827' }}>{invoice.invoiceNumber}</div>
        </div>
        <div>
          <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: 4 }}>Date</div>
          <div style={{ fontWeight: 600, color: '#111827' }}>{formattedDate}</div>
        </div>
        <div>
          <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: 4 }}>GSTIN ({company.name || 'Renders Arc'})</div>
          <div style={{ fontWeight: 600, color: '#111827' }}>{company.gstin || '32DLOPR0998L1Z9'}</div>
        </div>
      </div>

      {/* BILL TO Box */}
      <div className="invoice-bill-box" style={{ marginBottom: 24, maxWidth: '440px' }}>
        <div style={{ color: '#6b7280', fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 8 }}>
          BILL TO
        </div>
        <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827', marginBottom: 6 }}>
          {invoice.clientName}
        </div>
        <div style={{ whiteSpace: 'pre-line', color: '#374151', fontSize: '11.5px', lineHeight: '1.4' }}>
          {invoice.clientAddress}
        </div>
        {invoice.clientGstin && (
          <div style={{ color: '#374151', fontSize: '11.5px', marginTop: 6 }}>
            GSTIN {invoice.clientGstin}
          </div>
        )}
      </div>

      {/* Subject Line */}
      {invoice.subject && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: 2 }}>Subject</div>
          <div style={{ fontWeight: 700, fontSize: '13px', color: '#111827' }}>{invoice.subject}</div>
        </div>
      )}

      {/* Tax Invoice Table */}
      <table className="invoice-table">
        <thead>
          <tr>
            <th style={{ width: '4%' }}>#</th>
            <th style={{ width: '32%' }}>Item & Description</th>
            <th style={{ width: '10%', textAlign: 'center' }}>HSN/SAC</th>
            <th style={{ width: '6%', textAlign: 'right' }}>Qty</th>
            <th style={{ width: '12%', textAlign: 'right' }}>Rate</th>
            <th style={{ width: '6%', textAlign: 'right' }}>CGST %</th>
            <th style={{ width: '10%', textAlign: 'right' }}>CGST Amt</th>
            <th style={{ width: '6%', textAlign: 'right' }}>SGST %</th>
            <th style={{ width: '10%', textAlign: 'right' }}>SGST Amt</th>
            <th style={{ width: '12%', textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, idx) => (
            <tr key={idx}>
              <td style={{ verticalAlign: 'top', color: '#4b5563' }}>{item.itemNumber || idx + 1}</td>
              <td style={{ verticalAlign: 'top', fontWeight: 500, color: '#111827', whiteSpace: 'pre-line' }}>
                {item.description}
              </td>
              <td style={{ verticalAlign: 'top', textAlign: 'center', color: '#374151' }}>{item.hsnSac || '-'}</td>
              <td style={{ verticalAlign: 'top', textAlign: 'right', color: '#374151' }}>{item.quantity.toFixed(2)}</td>
              <td style={{ verticalAlign: 'top', textAlign: 'right', color: '#374151' }}>{formatCurrency(item.rate)}</td>
              <td style={{ verticalAlign: 'top', textAlign: 'right', color: '#374151' }}>{item.cgstRate}%</td>
              <td style={{ verticalAlign: 'top', textAlign: 'right', color: '#374151' }}>{formatCurrency(item.cgstAmount)}</td>
              <td style={{ verticalAlign: 'top', textAlign: 'right', color: '#374151' }}>{item.sgstRate}%</td>
              <td style={{ verticalAlign: 'top', textAlign: 'right', color: '#374151' }}>{formatCurrency(item.sgstAmount)}</td>
              <td style={{ verticalAlign: 'top', textAlign: 'right', fontWeight: 600, color: '#111827' }}>
                {formatCurrency(item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Summary */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, marginBottom: 24 }}>
        <div style={{ width: '320px', fontSize: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#374151' }}>
            <span>Subtotal</span>
            <span>Rs. {formatCurrency(invoice.subtotal)}</span>
          </div>

          {invoice.cgstAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#374151' }}>
              <span>CGST9 ({invoice.cgstRate}%)</span>
              <span>Rs. {formatCurrency(invoice.cgstAmount)}</span>
            </div>
          )}

          {invoice.sgstAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: '#374151' }}>
              <span>SGST9 ({invoice.sgstRate}%)</span>
              <span>Rs. {formatCurrency(invoice.sgstAmount)}</span>
            </div>
          )}

          <div style={{ borderTop: '2px solid #111827', margin: '10px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '15px', fontWeight: 800, color: '#111827' }}>
            <span>Total Due</span>
            <span>Rs. {formatCurrency(invoice.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Total In Words */}
      {invoice.totalInWords && (
        <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#1f2937', marginBottom: 30 }}>
          Total In Words: {invoice.totalInWords}
        </div>
      )}

      {/* Payment Details */}
      <div style={{ marginTop: 20 }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.25em',
            color: '#111827',
            marginBottom: 12,
            textTransform: 'uppercase',
          }}
        >
          P A Y M E N T &nbsp; D E T A I L S
        </div>

        <div style={{ fontSize: '11.5px', color: '#374151', lineHeight: '1.7', marginBottom: 24 }}>
          <div>Name: {invoice.accountName || company.accountName || company.name || 'RENDERS ARC'}</div>
          <div>A/C No: {invoice.accountNo || company.accountNo || '50200110640651'}</div>
          <div>Bank: {invoice.bankName || company.bankName || 'HDFC Bank'}</div>
          <div>IFSC Code: {invoice.ifscCode || company.ifscCode || 'HDFC0001218'}</div>
          <div>MICR: {invoice.micrCode || company.micrCode || '682240018'}</div>
          <div>Branch Code: {invoice.branchCode || company.branchCode || '1218'}</div>
        </div>

        <div style={{ fontSize: '11.5px', color: '#374151', lineHeight: '1.6' }}>
          <div>{invoice.notes || 'Looking forward for your business.'}</div>
          <div style={{ marginTop: 4 }}>GSTIN: {company.gstin || '32DLOPR0998L1Z9'}</div>

          <div style={{ marginTop: 16 }}>Warm regards,</div>
          <div style={{ fontWeight: 700, color: '#111827', marginTop: 8 }}>
            {invoice.signatory || company.signatory || 'Rajat'}
          </div>
          <div style={{ color: '#4b5563' }}>{company.signatoryTitle || company.name || 'Renders Arc'}</div>
        </div>
      </div>

      {/* Bottom Black Footer Bar */}
      <div className="invoice-footer-banner">
        <div style={{ letterSpacing: '0.45em', fontWeight: 800, fontSize: '15px', color: '#ffffff' }}>
          {(company.name || 'RENDERS ARC').split('').join(' ')}
        </div>
        <div style={{ letterSpacing: '0.3em', fontSize: '9.5px', marginTop: 4, color: '#9ca3af', textTransform: 'uppercase' }}>
          {company.tagline || 'THE POWER TO MANIFEST'}
        </div>
      </div>
    </div>
  );
}
