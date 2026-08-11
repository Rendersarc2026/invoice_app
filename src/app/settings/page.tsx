'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Save, Building, CreditCard, UserCheck, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [name, setName] = useState('RENDERS ARC');
  const [tagline, setTagline] = useState('THE POWER TO MANIFEST');
  const [addressLine1, setAddressLine1] = useState('3rd Flr 60/44 JC Chambers Panampily Nagar');
  const [addressLine2, setAddressLine2] = useState('Opp Kairali Flat, Panampilly Nagar');
  const [city, setCity] = useState('Kochi, Ernakulam');
  const [state, setState] = useState('Kerala');
  const [pincode, setPincode] = useState('682036');
  const [country, setCountry] = useState('India');
  const [gstin, setGstin] = useState('32DLOPR0998L1Z9');
  const [email, setEmail] = useState('contact@rendersarc.com');
  const [phone, setPhone] = useState('+91 98765 43210');

  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountName, setAccountName] = useState('RENDERS ARC');
  const [accountNo, setAccountNo] = useState('50200110640651');
  const [ifscCode, setIfscCode] = useState('HDFC0001218');
  const [micrCode, setMicrCode] = useState('682240018');
  const [branchCode, setBranchCode] = useState('1218');

  const [signatory, setSignatory] = useState('Rajat');
  const [signatoryTitle, setSignatoryTitle] = useState('Renders Arc');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/company');
      if (res.ok) {
        const data = await res.json();
        if (data.name) setName(data.name);
        if (data.tagline) setTagline(data.tagline);
        if (data.addressLine1) setAddressLine1(data.addressLine1);
        if (data.addressLine2) setAddressLine2(data.addressLine2);
        if (data.city) setCity(data.city);
        if (data.state) setState(data.state);
        if (data.pincode) setPincode(data.pincode);
        if (data.country) setCountry(data.country);
        if (data.gstin) setGstin(data.gstin);
        if (data.email) setEmail(data.email);
        if (data.phone) setPhone(data.phone);

        if (data.bankName) setBankName(data.bankName);
        if (data.accountName) setAccountName(data.accountName);
        if (data.accountNo) setAccountNo(data.accountNo);
        if (data.ifscCode) setIfscCode(data.ifscCode);
        if (data.micrCode) setMicrCode(data.micrCode);
        if (data.branchCode) setBranchCode(data.branchCode);

        if (data.signatory) setSignatory(data.signatory);
        if (data.signatoryTitle) setSignatoryTitle(data.signatoryTitle);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          tagline,
          addressLine1,
          addressLine2,
          city,
          state,
          pincode,
          country,
          gstin,
          email,
          phone,
          bankName,
          accountName,
          accountNo,
          ifscCode,
          micrCode,
          branchCode,
          signatory,
          signatoryTitle,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Navigation />
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          Loading company settings...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navigation />

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#0f172a' }}>
              Company & Banking Settings
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '2px' }}>
              These parameters pre-fill invoice headers, payment details, and PDF footers.
            </p>
          </div>

          {savedSuccess && (
            <div
              style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#047857',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={16} />
              <span>Settings saved!</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Company Details */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <Building size={18} color="#0f172a" />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                Company Brand & GSTIN Information
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '4px', display: 'block', fontWeight: 600 }}>
                  Company Name (Invoice Header)
                </label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="glass-input" placeholder="RENDERS ARC" />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '4px', display: 'block', fontWeight: 600 }}>
                  Footer Tagline
                </label>
                <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="glass-input" placeholder="THE POWER TO MANIFEST" />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '4px', display: 'block', fontWeight: 600 }}>
                  GSTIN (Company Tax ID)
                </label>
                <input type="text" value={gstin} onChange={(e) => setGstin(e.target.value)} className="glass-input" placeholder="32DLOPR0998L1Z9" />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '4px', display: 'block', fontWeight: 600 }}>
                  Email Address
                </label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="glass-input" />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '4px', display: 'block', fontWeight: 600 }}>
                  Address Line 1
                </label>
                <input type="text" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className="glass-input" />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '4px', display: 'block', fontWeight: 600 }}>
                  Address Line 2
                </label>
                <input type="text" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} className="glass-input" />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '4px', display: 'block' }}>City</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="glass-input" />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '4px', display: 'block' }}>State</label>
                  <input type="text" value={state} onChange={(e) => setState(e.target.value)} className="glass-input" />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '4px', display: 'block' }}>Pincode</label>
                  <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} className="glass-input" />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '4px', display: 'block' }}>Country</label>
                  <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="glass-input" />
                </div>
              </div>
            </div>
          </div>

          {/* Banking Details */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <CreditCard size={18} color="#0f172a" />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                Payment & Bank Account Details
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '4px', display: 'block', fontWeight: 600 }}>Account Name</label>
                <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} className="glass-input" />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '4px', display: 'block', fontWeight: 600 }}>Account Number</label>
                <input type="text" value={accountNo} onChange={(e) => setAccountNo(e.target.value)} className="glass-input" />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '4px', display: 'block', fontWeight: 600 }}>Bank Name</label>
                <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className="glass-input" />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '4px', display: 'block', fontWeight: 600 }}>IFSC Code</label>
                <input type="text" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} className="glass-input" />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '4px', display: 'block', fontWeight: 600 }}>MICR Code</label>
                <input type="text" value={micrCode} onChange={(e) => setMicrCode(e.target.value)} className="glass-input" />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '4px', display: 'block', fontWeight: 600 }}>Branch Code</label>
                <input type="text" value={branchCode} onChange={(e) => setBranchCode(e.target.value)} className="glass-input" />
              </div>
            </div>
          </div>

          {/* Signatory Details */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <UserCheck size={18} color="#0f172a" />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                Authorized Signatory
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '4px', display: 'block', fontWeight: 600 }}>Signatory Name</label>
                <input type="text" value={signatory} onChange={(e) => setSignatory(e.target.value)} className="glass-input" />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '4px', display: 'block', fontWeight: 600 }}>Signatory Designation / Company</label>
                <input type="text" value={signatoryTitle} onChange={(e) => setSignatoryTitle(e.target.value)} className="glass-input" />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '10px 24px' }}>
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
