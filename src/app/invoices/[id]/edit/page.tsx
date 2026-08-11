'use client';

import React, { useState, useEffect, use } from 'react';
import Navigation from '@/components/Navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { convertNumberToIndianWords } from '@/lib/number-to-words';
import { GSTIN_REGEX, IFSC_REGEX, HSN_SAC_REGEX } from '@/lib/validations/invoice';

interface ItemRow {
  id?: string;
  description: string;
  hsnSac: string;
  quantity: number;
  rate: number;
  cgstRate: number;
  sgstRate: number;
}

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientGstin, setClientGstin] = useState('');

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [subject, setSubject] = useState('');

  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [micrCode, setMicrCode] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [signatory, setSignatory] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<ItemRow[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorSummary, setErrorSummary] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInvoiceData();
  }, [id]);

  const fetchInvoiceData = async () => {
    try {
      const clientRes = await fetch('/api/clients');
      if (clientRes.ok) {
        setClients(await clientRes.json());
      }

      const invRes = await fetch(`/api/invoices/${id}`);
      if (!invRes.ok) {
        setErrorSummary(['Invoice not found']);
        setLoading(false);
        return;
      }

      const inv = await invRes.json();
      setSelectedClientId(inv.clientId || '');
      setClientName(inv.clientName || '');
      setClientAddress(inv.clientAddress || '');
      setClientGstin(inv.clientGstin || '');

      setInvoiceNumber(inv.invoiceNumber);
      setInvoiceDate(inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : '');
      setDueDate(inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '');
      setStatus(inv.status);
      setSubject(inv.subject || '');

      setBankName(inv.bankName || '');
      setAccountName(inv.accountName || '');
      setAccountNo(inv.accountNo || '');
      setIfscCode(inv.ifscCode || '');
      setMicrCode(inv.micrCode || '');
      setBranchCode(inv.branchCode || '');
      setSignatory(inv.signatory || '');
      setNotes(inv.notes || '');

      if (inv.items && inv.items.length > 0) {
        setItems(
          inv.items.map((it: any) => ({
            id: it.id,
            description: it.description,
            hsnSac: it.hsnSac || '',
            quantity: it.quantity,
            rate: it.rate,
            cgstRate: it.cgstRate,
            sgstRate: it.sgstRate,
          }))
        );
      }
    } catch (err) {
      setErrorSummary(['Error loading invoice']);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        description: '',
        hsnSac: '998314',
        quantity: 1,
        rate: 0,
        cgstRate: 9,
        sgstRate: 9,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ItemRow, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const summary: string[] = [];

    if (!invoiceNumber.trim()) {
      errors.invoiceNumber = 'Invoice number is required.';
      summary.push('Invoice number cannot be empty.');
    }

    if (!invoiceDate) {
      errors.invoiceDate = 'Invoice date is required.';
      summary.push('Invoice date cannot be empty.');
    }

    if (dueDate && new Date(dueDate) < new Date(invoiceDate)) {
      errors.dueDate = 'Due date cannot be earlier than invoice date.';
      summary.push('Due date must be on or after invoice date.');
    }

    if (!clientName.trim() || clientName.trim().length < 2) {
      errors.clientName = 'Client name must be at least 2 characters long.';
      summary.push('Client name must be at least 2 characters long.');
    }

    if (!clientAddress.trim() || clientAddress.trim().length < 5) {
      errors.clientAddress = 'Client address must be at least 5 characters long.';
      summary.push('Client address must be at least 5 characters long.');
    }

    if (clientGstin.trim() && !GSTIN_REGEX.test(clientGstin.trim().toUpperCase())) {
      errors.clientGstin = 'Invalid GSTIN format (e.g. 32AAACK8728L2ZA).';
      summary.push('Client GSTIN must be a valid 15-character GSTIN string.');
    }

    if (ifscCode.trim() && !IFSC_REGEX.test(ifscCode.trim().toUpperCase())) {
      errors.ifscCode = 'Invalid IFSC code format (e.g. HDFC0001218).';
      summary.push('IFSC Code must be valid (4 letters + 0 + 6 alphanumeric).');
    }

    if (!items || items.length === 0) {
      summary.push('At least one line item is required.');
    } else {
      items.forEach((item, idx) => {
        if (!item.description.trim()) {
          errors[`item_${idx}_description`] = `Item #${idx + 1} description is required.`;
          summary.push(`Item #${idx + 1} description is required.`);
        }

        if (item.hsnSac.trim() && !HSN_SAC_REGEX.test(item.hsnSac.trim())) {
          errors[`item_${idx}_hsnSac`] = `Item #${idx + 1} HSN/SAC must be 4 to 8 digits.`;
          summary.push(`Item #${idx + 1} HSN/SAC must be 4 to 8 numeric digits.`);
        }

        if (item.quantity <= 0) {
          errors[`item_${idx}_quantity`] = `Item #${idx + 1} quantity must be > 0.`;
          summary.push(`Item #${idx + 1} quantity must be greater than 0.`);
        }

        if (item.rate < 0) {
          errors[`item_${idx}_rate`] = `Item #${idx + 1} rate cannot be negative.`;
          summary.push(`Item #${idx + 1} rate cannot be negative.`);
        }

        if (item.cgstRate < 0 || item.cgstRate > 100) {
          errors[`item_${idx}_cgstRate`] = `Item #${idx + 1} CGST % must be 0 - 100.`;
          summary.push(`Item #${idx + 1} CGST % must be between 0 and 100.`);
        }

        if (item.sgstRate < 0 || item.sgstRate > 100) {
          errors[`item_${idx}_sgstRate`] = `Item #${idx + 1} SGST % must be 0 - 100.`;
          summary.push(`Item #${idx + 1} SGST % must be between 0 and 100.`);
        }
      });
    }

    setFieldErrors(errors);
    setErrorSummary(summary);
    return summary.length === 0;
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0), 0);
  const totalCgst = items.reduce((sum, item) => {
    const amt = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
    return sum + (amt * (Number(item.cgstRate) || 0)) / 100;
  }, 0);
  const totalSgst = items.reduce((sum, item) => {
    const amt = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
    return sum + (amt * (Number(item.sgstRate) || 0)) / 100;
  }, 0);
  const totalAmount = subtotal + totalCgst + totalSgst;
  const wordsPreview = convertNumberToIndianWords(totalAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        clientId: selectedClientId || null,
        clientName: clientName.trim(),
        clientAddress: clientAddress.trim(),
        clientGstin: clientGstin.trim().toUpperCase() || null,
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        dueDate: dueDate || null,
        status,
        subject: subject.trim() || null,
        items,
        bankName: bankName.trim() || null,
        accountName: accountName.trim() || null,
        accountNo: accountNo.trim() || null,
        ifscCode: ifscCode.trim().toUpperCase() || null,
        micrCode: micrCode.trim() || null,
        branchCode: branchCode.trim() || null,
        signatory: signatory.trim() || null,
        notes: notes.trim() || null,
      };

      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setSaving(false);
        if (data.details && Array.isArray(data.details)) {
          const apiErrors: Record<string, string> = {};
          const apiSummary: string[] = [data.error || 'Validation failed on server.'];
          data.details.forEach((d: any) => {
            apiErrors[d.field] = d.message;
            apiSummary.push(d.message);
          });
          setFieldErrors(apiErrors);
          setErrorSummary(apiSummary);
        } else {
          setErrorSummary([data.error || 'Failed to update invoice.']);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      router.push(`/invoices/${id}`);
    } catch (err) {
      setErrorSummary(['An unexpected error occurred while updating invoice.']);
      setSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getFieldErrorStyle = (fieldName: string) => {
    if (fieldErrors[fieldName]) {
      return { borderColor: '#ef4444', backgroundColor: '#fef2f2' };
    }
    return {};
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Navigation />
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading invoice for editing...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navigation />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <Link href={`/invoices/${id}`} className="btn-secondary" style={{ padding: '6px 10px' }}>
            <ArrowLeft size={16} /> Back
          </Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#0f172a' }}>
            Edit Invoice #{invoiceNumber}
          </h1>
        </div>

        {errorSummary.length > 0 && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '24px',
              color: '#991b1b',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, fontSize: '0.95rem', marginBottom: '8px' }}>
              <AlertCircle size={20} color="#dc2626" />
              <span>Please fix the following validation errors:</span>
            </div>
            <ul style={{ paddingLeft: '28px', margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>
              {errorSummary.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
              Invoice Metadata & Client Details
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>
                  Invoice Number *
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="glass-input"
                  style={getFieldErrorStyle('invoiceNumber')}
                />
                {fieldErrors.invoiceNumber && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{fieldErrors.invoiceNumber}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>
                  Invoice Date *
                </label>
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="glass-input"
                  style={getFieldErrorStyle('invoiceDate')}
                />
                {fieldErrors.invoiceDate && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{fieldErrors.invoiceDate}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>
                  Status
                </label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="glass-input">
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>
                  Subject / Project Title
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="glass-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>
                  Client Name (BILL TO) *
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="glass-input"
                  style={getFieldErrorStyle('clientName')}
                />
                {fieldErrors.clientName && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{fieldErrors.clientName}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>
                  Client GSTIN
                </label>
                <input
                  type="text"
                  value={clientGstin}
                  onChange={(e) => setClientGstin(e.target.value.toUpperCase())}
                  className="glass-input"
                  style={getFieldErrorStyle('clientGstin')}
                />
                {fieldErrors.clientGstin && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{fieldErrors.clientGstin}</span>}
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#475569', marginBottom: '4px', fontWeight: 600 }}>
                  Client Full Address *
                </label>
                <textarea
                  rows={3}
                  required
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="glass-input"
                  style={getFieldErrorStyle('clientAddress')}
                />
                {fieldErrors.clientAddress && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{fieldErrors.clientAddress}</span>}
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Line Items *</h2>
              <button type="button" onClick={handleAddItem} className="btn-secondary" style={{ padding: '5px 10px', fontSize: '0.8rem' }}>
                <Plus size={14} /> Add Item
              </button>
            </div>

            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '14px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ gridColumn: '1 / span 7' }}>
                    <label style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '3px', display: 'block' }}>Description *</label>
                    <textarea
                      rows={2}
                      required
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="glass-input"
                      style={getFieldErrorStyle(`item_${idx}_description`)}
                    />
                    {fieldErrors[`item_${idx}_description`] && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{fieldErrors[`item_${idx}_description`]}</span>}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '3px', display: 'block' }}>HSN/SAC</label>
                    <input
                      type="text"
                      value={item.hsnSac}
                      onChange={(e) => handleItemChange(idx, 'hsnSac', e.target.value)}
                      className="glass-input"
                      style={getFieldErrorStyle(`item_${idx}_hsnSac`)}
                    />
                    {fieldErrors[`item_${idx}_hsnSac`] && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{fieldErrors[`item_${idx}_hsnSac`]}</span>}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '3px', display: 'block' }}>Qty *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="glass-input"
                      style={getFieldErrorStyle(`item_${idx}_quantity`)}
                    />
                    {fieldErrors[`item_${idx}_quantity`] && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{fieldErrors[`item_${idx}_quantity`]}</span>}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '3px', display: 'block' }}>Rate (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={item.rate}
                      onChange={(e) => handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                      className="glass-input"
                      style={getFieldErrorStyle(`item_${idx}_rate`)}
                    />
                    {fieldErrors[`item_${idx}_rate`] && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{fieldErrors[`item_${idx}_rate`]}</span>}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '3px', display: 'block' }}>CGST %</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={item.cgstRate}
                      onChange={(e) => handleItemChange(idx, 'cgstRate', parseFloat(e.target.value) || 0)}
                      className="glass-input"
                      style={getFieldErrorStyle(`item_${idx}_cgstRate`)}
                    />
                    {fieldErrors[`item_${idx}_cgstRate`] && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{fieldErrors[`item_${idx}_cgstRate`]}</span>}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '3px', display: 'block' }}>SGST %</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={item.sgstRate}
                      onChange={(e) => handleItemChange(idx, 'sgstRate', parseFloat(e.target.value) || 0)}
                      className="glass-input"
                      style={getFieldErrorStyle(`item_${idx}_sgstRate`)}
                    />
                    {fieldErrors[`item_${idx}_sgstRate`] && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>{fieldErrors[`item_${idx}_sgstRate`]}</span>}
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', paddingTop: '18px' }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={items.length === 1}
                      style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '16px', marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                <span>Total Amount Due</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#475569', marginTop: '6px' }}>
                Total in Words: {wordsPreview}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Link href={`/invoices/${id}`} className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '10px 24px' }}>
              <Save size={16} />
              <span>{saving ? 'Validating & Saving...' : 'Update Invoice'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
