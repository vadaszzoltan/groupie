'use client';

import { useEffect, useState } from 'react';
import { Card } from '../../components/page';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../components/auth-provider';

export default function DashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiFetch('/api/auth/me', {}, token),
      apiFetch('/api/sources', {}, token),
      apiFetch('/api/posts?page=1&pageSize=5', {}, token),
      apiFetch('/api/scraping/runs', {}, token),
    ]).then(([me, sources, posts, runs]) => setData({ me, sources, posts, runs }));
  }, [token]);

  return (
    <div>
      <Card title="Overview">
        {!data ? <p>Loading dashboard...</p> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <div><strong>User</strong><div>{data.me.email}</div></div>
          <div><strong>Sources</strong><div>{data.sources.length}</div></div>
          <div><strong>Recent posts</strong><div>{data.posts.total}</div></div>
          <div><strong>Runs</strong><div>{data.runs.length}</div></div>
        </div>}
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
