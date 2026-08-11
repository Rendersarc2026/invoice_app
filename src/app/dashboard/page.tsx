'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import ConfirmModal from '@/components/ConfirmModal';
import Toast, { ToastMessage } from '@/components/Toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  Clock,
  IndianRupee,
  Eye,
  Trash2,
  Edit,
  Zap,
  Sparkles,
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  clientName: string;
  totalAmount: number;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED';
  subject?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [user, setUser] = useState<{ name?: string } | null>(null);

  // Deletion Modal & Toast States
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; number: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      const res = await fetch('/api/invoices');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSeedDemo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/seed');
      const data = await res.json();
      if (res.ok && data.sampleInvoiceId) {
        addToast('success', 'Renders Arc sample invoice generated!');
        router.push(`/invoices/${data.sampleInvoiceId}`);
      } else {
        await fetchInvoices();
      }
    } catch (err) {
      addToast('error', 'Failed to seed demo invoice.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setInvoices(invoices.filter((inv) => inv.id !== deleteTarget.id));
        addToast('success', `Invoice ${deleteTarget.number} deleted successfully.`);
        setDeleteTarget(null);
      } else {
        addToast('error', `Failed to delete invoice ${deleteTarget.number}.`);
      }
    } catch (err) {
      addToast('error', 'An unexpected error occurred while deleting.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
      (inv.subject && inv.subject.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidRevenue = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const pendingRevenue = invoices
    .filter((inv) => inv.status === 'PENDING')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navigation userName={user?.name} />
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${deleteTarget?.number}? This action cannot be undone.`}
        confirmLabel="Delete Invoice"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Header Title & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#0f172a' }}>
              Invoices
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '2px' }}>
              Manage invoices, tax breakdowns, and PDF exports.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={handleSeedDemo} className="btn-secondary">
              <Zap size={15} />
              <span>Load Renders Arc PDF Demo</span>
            </button>
            <Link href="/invoices/new" className="btn-primary">
              <Plus size={16} />
              <span>Create Invoice</span>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="glass-card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Total Billed</span>
              <IndianRupee size={18} color="#0f172a" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
              ₹{formatCurrency(totalRevenue)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
              Across {invoices.length} invoices
            </div>
          </div>

          <div className="glass-card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Collected</span>
              <CheckCircle size={18} color="#059669" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
              ₹{formatCurrency(paidRevenue)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
              Paid status invoices
            </div>
          </div>

          <div className="glass-card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Pending Amount</span>
              <Clock size={18} color="#d97706" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', marginTop: '6px' }}>
              ₹{formatCurrency(pendingRevenue)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
              Awaiting payment
            </div>
          </div>

          <div className="glass-card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Invoice Count</span>
              <FileText size={18} color="#6366f1" />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
              {invoices.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
              Total invoices generated
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="glass-card" style={{ padding: '14px 18px', marginBottom: '20px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by Invoice # or Client Name..."
              className="glass-input"
              style={{ paddingLeft: '38px', padding: '8px 12px 8px 38px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
            {['ALL', 'PENDING', 'PAID', 'DRAFT', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: statusFilter === st ? '1px solid #0f172a' : '1px solid #e2e8f0',
                  background: statusFilter === st ? '#0f172a' : '#ffffff',
                  color: statusFilter === st ? '#ffffff' : '#64748b',
                  transition: 'all 0.15s ease',
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices List Table */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              Loading invoices...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div style={{ padding: '50px 20px', textAlign: 'center' }}>
              <FileText size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>No Invoices Found</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px', marginBottom: '18px' }}>
                {search ? 'Try adjusting your search criteria.' : 'Get started by creating your first tax invoice or load the demo.'}
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button onClick={handleSeedDemo} className="btn-secondary">
                  <Sparkles size={15} /> Load Demo Invoice
                </button>
                <Link href="/invoices/new" className="btn-primary">
                  <Plus size={15} /> Create Invoice
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: '0.725rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 18px' }}>Invoice No</th>
                    <th style={{ padding: '12px 18px' }}>Client</th>
                    <th style={{ padding: '12px 18px' }}>Date</th>
                    <th style={{ padding: '12px 18px' }}>Amount</th>
                    <th style={{ padding: '12px 18px' }}>Status</th>
                    <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f172a' }}>
                        {inv.invoiceNumber}
                      </td>
                      <td style={{ padding: '14px 18px', color: '#334155' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{inv.clientName}</div>
                        {inv.subject && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1px' }}>{inv.subject}</div>}
                      </td>
                      <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '0.8rem' }}>
                        {new Date(inv.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#0f172a' }}>
                        ₹{formatCurrency(inv.totalAmount)}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span className={`status-badge status-${inv.status}`}>{inv.status}</span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                            title="View & Export PDF"
                          >
                            <Eye size={14} />
                            <span>PDF</span>
                          </Link>

                          <Link
                            href={`/invoices/${inv.id}/edit`}
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                            title="Edit Invoice"
                          >
                            <Edit size={14} />
                          </Link>

                          <button
                            onClick={() => setDeleteTarget({ id: inv.id, number: inv.invoiceNumber })}
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.78rem', color: '#ef4444', borderColor: '#fca5a5' }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
