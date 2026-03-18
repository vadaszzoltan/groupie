'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';

const links = [
  ['Dashboard', '/dashboard'],
  ['Sources', '/sources'],
  ['Posts', '/posts'],
  ['Run history', '/history'],
  ['Settings', '/settings'],
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, setToken } = useAuth();

  if (!token && pathname !== '/login' && pathname !== '/register') {
    if (typeof window !== 'undefined') router.push('/login');
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <aside style={{ background: '#111827', color: 'white', padding: 24 }}>
        <h1 style={{ marginTop: 0 }}>Group Watch</h1>
        <nav style={{ display: 'grid', gap: 8 }}>
          {links.map(([label, href]) => (
            <Link key={href} href={href} style={{ color: pathname === href ? '#93c5fd' : '#fff', textDecoration: 'none' }}>{label}</Link>
          ))}
        </nav>
        {token ? <button style={{ marginTop: 24 }} onClick={() => { setToken(null); router.push('/login'); }}>Logout</button> : null}
      </aside>
      <main style={{ background: '#f3f4f6', padding: 24 }}>{children}</main>
    </div>
  );
}
