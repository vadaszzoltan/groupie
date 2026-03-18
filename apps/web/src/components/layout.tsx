'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from './auth-provider';

const links = [
  ['Dashboard', '/dashboard'],
  ['Sources', '/sources'],
  ['Posts', '/posts'],
  ['Run history', '/history'],
  ['Settings', '/settings'],
] as const;

const publicRoutes = new Set(['/login', '/register']);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, setToken } = useAuth();
  const isPublicRoute = publicRoutes.has(pathname);

  useEffect(() => {
    if (!token && !isPublicRoute) {
      router.replace('/login');
    }
  }, [isPublicRoute, pathname, router, token]);

  if (!token && !isPublicRoute) {
    return <div style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>Redirecting to login...</div>;
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: token ? '240px 1fr' : '1fr',
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {token ? (
        <aside style={{ background: '#111827', color: 'white', padding: 24 }}>
          <h1 style={{ marginTop: 0 }}>Group Watch</h1>
          <nav style={{ display: 'grid', gap: 8 }}>
            {links.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                style={{ color: pathname === href ? '#93c5fd' : '#fff', textDecoration: 'none' }}
              >
                {label}
              </Link>
            ))}
          </nav>
          <button
            style={{ marginTop: 24 }}
            onClick={() => {
              setToken(null);
              router.replace('/login');
            }}
          >
            Logout
          </button>
        </aside>
      ) : null}
      <main style={{ background: '#f3f4f6', padding: 24 }}>{children}</main>
    </div>
  );
}
