'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Users, Plus, Building, MapPin, Mail, Phone, Hash } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [name, setName] = useState('');
  const [gstin, setGstin] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        setClients(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          gstin,
          addressLine1,
          city,
          state,
          pincode,
          email,
          phone,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setName('');
        setGstin('');
        setAddressLine1('');
        setCity('');
        setState('');
        setPincode('');
        setEmail('');
        setPhone('');
        fetchClients();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navigation />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#0f172a' }}>
              Client Directory
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '2px' }}>
              Manage clients and pre-fill details on tax invoices.
            </p>
          </div>

          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus size={16} />
            <span>Add Client</span>
          </button>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '24px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '18px' }}>
                Add New Client
              </h2>

              <form onSubmit={handleCreateClient} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '4px', display: 'block', fontWeight: 600 }}>
                    Company / Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="glass-input"
                    placeholder="KREEM FOODS PRIVATE LIMITED"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '4px', display: 'block', fontWeight: 600 }}>
                    GSTIN Number
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="glass-input"
                    placeholder="32AAACK8728L2ZA"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '4px', display: 'block', fontWeight: 600 }}>
                    Address
                  </label>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    className="glass-input"
                    placeholder="No-46/1914/A, AKG Vayanasala CrossRoad"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '4px', display: 'block' }}>City</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="glass-input" placeholder="Ernakulam" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '4px', display: 'block' }}>State</label>
                    <input type="text" value={state} onChange={(e) => setState(e.target.value)} className="glass-input" placeholder="Kerala" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '4px', display: 'block' }}>Pincode</label>
                    <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} className="glass-input" placeholder="682032" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '4px', display: 'block' }}>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="glass-input" placeholder="accounts@client.com" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '4px', display: 'block' }}>Phone</label>
                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="glass-input" placeholder="+91 98765 43210" />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Client
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Clients Grid */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading client directory...</div>
        ) : clients.length === 0 ? (
          <div className="glass-card" style={{ padding: '50px', textAlign: 'center' }}>
            <Users size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>No Clients Yet</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px', marginBottom: '18px' }}>
              Add client details to quickly generate invoices.
            </p>
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <Plus size={15} /> Add First Client
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {clients.map((client) => (
              <div key={client.id} className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0f172a',
                      flexShrink: 0,
                    }}
                  >
                    <Building size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', lineHeight: '1.3' }}>
                      {client.name}
                    </h3>
                    {client.gstin && (
                      <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Hash size={12} /> GSTIN: {client.gstin}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '0.825rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(client.addressLine1 || client.city) && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <MapPin size={15} style={{ color: '#64748b', flexShrink: 0, marginTop: '2px' }} />
                      <span>
                        {[client.addressLine1, client.city, client.state, client.pincode, client.country]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}

                  {client.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={15} style={{ color: '#64748b', flexShrink: 0 }} />
                      <span>{client.email}</span>
                    </div>
                  )}

                  {client.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={15} style={{ color: '#64748b', flexShrink: 0 }} />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
