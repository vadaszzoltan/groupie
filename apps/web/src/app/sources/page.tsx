'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../components/auth-provider';
import { Card, Field } from '../../components/page';
import { apiFetch } from '../../lib/api';

type Source = {
  id: string;
  name: string;
  platform: string;
  isActive: boolean;
  groupUrl: string;
  actorId: string;
};

export default function SourcesPage() {
  const { token } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!token) return;
    try {
      setError('');
      setSources(await apiFetch<Source[]>('/api/sources', {}, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sources.');
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError('');

    try {
      const form = new FormData(event.currentTarget);
      await apiFetch(
        '/api/sources',
        {
          method: 'POST',
          body: JSON.stringify({
            name: form.get('name'),
            platform: 'facebook_group',
            groupUrl: form.get('groupUrl'),
            groupExternalId: form.get('groupExternalId') || undefined,
            actorId: form.get('actorId'),
            actorInputJson: JSON.parse(String(form.get('actorInputJson') || '{}')),
            isActive: true,
          }),
        },
        token,
      );
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create source.');
    } finally {
      setSubmitting(false);
    }
  }

  const action = async (callback: () => Promise<unknown>) => {
    try {
      setError('');
      await callback();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    }
  };

  return (
    <div>
      <Card title="Add source">
        <form onSubmit={onSubmit}>
          <Field label="Name">
            <input name="name" required />
          </Field>
          <Field label="Group URL">
            <input name="groupUrl" type="url" required />
          </Field>
          <Field label="Group external ID">
            <input name="groupExternalId" />
          </Field>
          <Field label="Actor ID">
            <input name="actorId" required />
          </Field>
          <Field label="Actor input JSON">
            <textarea name="actorInputJson" rows={5} defaultValue={'{}'} />
          </Field>
          <button disabled={submitting}>{submitting ? 'Creating...' : 'Create source'}</button>
        </form>
      </Card>

      <Card title="Watched sources">
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
        {sources.length === 0 ? (
          <p>No sources yet.</p>
        ) : (
          <table width="100%">
            <thead>
              <tr>
                <th align="left">Name</th>
                <th align="left">Platform</th>
                <th align="left">URL</th>
                <th align="left">Active</th>
                <th align="left">Actor</th>
                <th align="left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id}>
                  <td>{source.name}</td>
                  <td>{source.platform}</td>
                  <td>
                    <a href={source.groupUrl} target="_blank" rel="noreferrer">
                      Open group
                    </a>
                  </td>
                  <td>{String(source.isActive)}</td>
                  <td>{source.actorId}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() =>
                        action(() => apiFetch(`/api/sources/${source.id}/toggle`, { method: 'POST' }, token!))
                      }
                    >
                      Toggle
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        action(() =>
                          apiFetch(`/api/scraping/sources/${source.id}/run`, { method: 'POST' }, token!),
                        )
                      }
                    >
                      Run
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        action(() => apiFetch(`/api/sources/${source.id}`, { method: 'DELETE' }, token!))
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
