'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, PlusCircle, Users, Settings, LogOut, ShieldCheck } from 'lucide-react';

export default function Navigation({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const router = useRouter();

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
          padding: '12px 24px',
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
            <div style={{ fontWeight: 800, fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: '#0f172a', letterSpacing: '0.05em' }}>
              RENDERS ARC
            </div>
            <div style={{ fontSize: '0.625rem', color: '#64748b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Invoice Platform
            </div>
          </div>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
      </div>
    </header>
  );
}
