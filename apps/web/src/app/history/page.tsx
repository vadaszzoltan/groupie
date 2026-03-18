'use client';

import { useEffect, useState } from 'react';
import { Card } from '../../components/page';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../components/auth-provider';

type Run = {
  id: string;
  status: string;
  fetchedCount: number;
  insertedCount: number;
  startedAt: string;
  source?: { name: string } | null;
};

export default function HistoryPage() {
  const { token } = useAuth();
  const [runs, setRuns] = useState<Run[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    apiFetch<Run[]>('/api/scraping/runs', {}, token)
      .then(setRuns)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load runs.'));
  }, [token]);

  return (
    <Card title="Scrape run history">
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      {runs.length === 0 ? (
        <p>No runs yet.</p>
      ) : (
        <table width="100%">
          <thead>
            <tr>
              <th align="left">Status</th>
              <th align="left">Source</th>
              <th align="left">Fetched</th>
              <th align="left">Inserted</th>
              <th align="left">Started</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id}>
                <td>{run.status}</td>
                <td>{run.source?.name ?? 'All sources'}</td>
                <td>{run.fetchedCount}</td>
                <td>{run.insertedCount}</td>
                <td>{new Date(run.startedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
