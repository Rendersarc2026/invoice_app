'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed.');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: '#f8fafc',
      }}
    >
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '10px',
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#ffffff',
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#0f172a' }}>
            Renders Arc
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>
            High-Security Invoice Portal
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              color: '#991b1b',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }}
              />
              <input
                type="email"
                required
                className="glass-input"
                style={{ paddingLeft: '40px' }}
                placeholder="admin@rendersarc.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '6px',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }}
              />
              <input
                type="password"
                required
                className="glass-input"
                style={{ paddingLeft: '40px' }}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: '4px' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
