'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Card, Field } from '../../components/page';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../components/auth-provider';

type MeResponse = {
  apifyTokenConfigured: boolean;
};

export default function SettingsPage() {
  const { token } = useAuth();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    if (!token) return;
    try {
      setMe(await apiFetch<MeResponse>('/api/auth/me', {}, token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings.');
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      await apiFetch(
        '/api/settings/apify-token',
        { method: 'PUT', body: JSON.stringify({ token: form.get('token') }) },
        token!,
      );
      setMessage('Token saved.');
      await load();
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save token.');
    }
  }

  async function test(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiFetch<{ username: string; tokenPreview: string }>(
        '/api/settings/apify-token/test',
        { method: 'POST', body: JSON.stringify({ token: form.get('token') }) },
        token!,
      );
      setMessage(`Token verified for ${result.username}. Preview: ${result.tokenPreview}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Token test failed.');
    }
  }

  async function remove() {
    setError('');
    try {
      await apiFetch('/api/settings/apify-token', { method: 'DELETE' }, token!);
      setMessage('Token deleted.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete token.');
    }
  }

  return (
    <div>
      <Card title="Apify token">
        {!me ? <p>Loading settings...</p> : <p>Configured: {String(me.apifyTokenConfigured)}</p>}
        <form onSubmit={save}>
          <Field label="Save / update token">
            <input name="token" type="password" minLength={10} required />
          </Field>
          <button type="submit">Save token</button>
          <button type="button" onClick={() => void remove()} style={{ marginLeft: 8 }}>
            Delete token
          </button>
        </form>
        <form onSubmit={test} style={{ marginTop: 16 }}>
          <Field label="Test a token without saving">
            <input name="token" type="password" minLength={10} required />
          </Field>
          <button type="submit">Test token</button>
        </form>
        {message ? <p>{message}</p> : null}
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      </Card>
    </div>
  );
}
