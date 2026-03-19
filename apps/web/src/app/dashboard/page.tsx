'use client';

import { useEffect, useState } from 'react';
import { Card } from '../../components/page';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../components/auth-provider';

type DashboardData = {
  me: { email: string };
  sources: unknown[];
  posts: { total: number };
  runs: unknown[];
};

export default function DashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiFetch<{ email: string }>('/api/auth/me', {}, token),
      apiFetch<unknown[]>('/api/sources', {}, token),
      apiFetch<{ total: number }>('/api/posts?page=1&pageSize=5', {}, token),
      apiFetch<unknown[]>('/api/scraping/runs', {}, token),
    ])
      .then(([me, sources, posts, runs]) => setData({ me, sources, posts, runs }))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard.'));
  }, [token]);

  return (
    <div>
      <Card title="Overview">
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
        {!data ? (
          <p>Loading dashboard...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div>
              <strong>User</strong>
              <div>{data.me.email}</div>
            </div>
            <div>
              <strong>Sources</strong>
              <div>{data.sources.length}</div>
            </div>
            <div>
              <strong>Recent posts</strong>
              <div>{data.posts.total}</div>
            </div>
            <div>
              <strong>Runs</strong>
              <div>{data.runs.length}</div>
            </div>
          </div>
        )}
      </Card>
      <Card title="Quick start">
        <ol>
          <li>Save your Apify token in Settings.</li>
          <li>Create one or more watched sources.</li>
          <li>Run a scrape and review posts on the Posts page.</li>
        </ol>
      </Card>
    </div>
  );
}
