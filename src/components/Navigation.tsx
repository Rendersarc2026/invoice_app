'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, PlusCircle, Users, Settings, LogOut, ShieldCheck, Menu, X, User } from 'lucide-react';

export default function Navigation({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navItems = [
    { label: 'Invoices', href: '/dashboard', icon: FileText },
    { label: 'Create Invoice', href: '/invoices/new', icon: PlusCircle },
    { label: 'Clients', href: '/clients', icon: Users },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <header
      className="no-print"
      style={{
        borderBottom: '1px solid #e2e8f0',
        background: '#ffffff',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '6px',
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: '#0f172a', letterSpacing: '0.05em' }}>
              RENDERS ARC
            </div>
            <div style={{ fontSize: '0.6rem', color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Invoice Platform
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 12px',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#0f172a' : '#64748b',
                  background: isActive ? '#f1f5f9' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop User Info & Sign Out */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {userName && (
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
              {userName}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.8rem' }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Mobile Toggle Button */}
        <button
          className="mobile-nav-toggle btn-secondary"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ display: 'none', padding: '6px 10px' }}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Dropdown Drawer */}
      <div className={`mobile-nav-drawer ${mobileOpen ? 'open' : ''}`}>
        {userName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', marginBottom: '4px' }}>
            <User size={16} color="#64748b" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{userName}</span>
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#0f172a' : '#475569',
                background: isActive ? '#f1f5f9' : 'transparent',
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          onClick={handleLogout}
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'center', marginTop: '6px', padding: '9px 14px' }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
