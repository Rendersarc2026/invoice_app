'use client';

import React, { useEffect, useState, use } from 'react';
import Navigation from '@/components/Navigation';
import InvoicePDFView from '@/components/InvoicePDFView';
import ConfirmModal from '@/components/ConfirmModal';
import Toast, { ToastMessage } from '@/components/Toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Printer, ArrowLeft, Edit, Trash2, AlertCircle } from 'lucide-react';

export default function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  // Delete modal & Toast
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      if (!res.ok) {
        setError('Invoice not found or access denied.');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setInvoice(data);
    } catch (err) {
      setError('Failed to fetch invoice details.');
    } finally {
      setLoading(false);
    }
  };

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const toastId = Date.now().toString();
    setToasts((prev) => [...prev, { id: toastId, type, message }]);
  };

  const removeToast = (toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      // PATCH sends only the status, instead of echoing the whole fetched
      // invoice back to the server.
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setInvoice(updated);
        addToast('success', `Status updated to ${newStatus}`);
      }
    } catch (err) {
      addToast('error', 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('success', `Invoice ${invoice.invoiceNumber} deleted successfully.`);
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        addToast('error', 'Failed to delete invoice.');
        setDeleting(false);
        setShowDeleteModal(false);
      }
    } catch (err) {
      addToast('error', 'An unexpected error occurred.');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Navigation />
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading invoice details...
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Navigation />
        <div style={{ maxWidth: '500px', margin: '60px auto', padding: '32px', textAlign: 'center' }} className="glass-card">
          <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 14px' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Invoice Not Found</h2>
          <p style={{ color: '#64748b', marginTop: '6px', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</p>
          <Link href="/dashboard" className="btn-primary">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navigation />
      <Toast toasts={toasts} onDismiss={removeToast} />

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`}
        confirmLabel="Delete Invoice"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Top Action Bar */}
      <div
        className="no-print"
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '12px 24px',
          position: 'sticky',
          top: '59px',
          zIndex: 40,
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link href="/dashboard" className="btn-secondary" style={{ padding: '6px 10px' }}>
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                Invoice #{invoice.invoiceNumber}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                {invoice.clientName}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>Status:</span>
              <select
                value={invoice.status}
                disabled={updating}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <option value="PENDING">PENDING</option>
                <option value="PAID">PAID</option>
                <option value="DRAFT">DRAFT</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <Link href={`/invoices/${id}/edit`} className="btn-secondary">
              <Edit size={15} />
              <span>Edit</span>
            </Link>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn-secondary"
              style={{ color: '#ef4444', borderColor: '#fca5a5' }}
            >
              <Trash2 size={15} />
              <span>Delete</span>
            </button>

            <button onClick={handlePrint} className="btn-primary">
              <Printer size={15} />
              <span>Print / Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoice PDF Wrapper */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <InvoicePDFView invoice={invoice} />
        </div>
      </main>
    </div>
  );
}
