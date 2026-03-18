'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Card, Field } from '../../components/page';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../components/auth-provider';

export default function SettingsPage() {
  const { token } = useAuth();
  const [me, setMe] = useState<any>(null);
  const [message, setMessage] = useState('');

  const load = () => token && apiFetch('/api/auth/me', {}, token).then(setMe);
  useEffect(() => { load(); }, [token]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await apiFetch('/api/settings/apify-token', { method: 'PUT', body: JSON.stringify({ token: form.get('token') }) }, token!);
    setMessage('Token saved.');
    load();
  }

  async function test(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await apiFetch<any>('/api/settings/apify-token/test', { method: 'POST', body: JSON.stringify({ token: form.get('token') }) }, token!);
    setMessage(`Token verified for ${result.username}. Preview: ${result.tokenPreview}`);
  }

  return <div><Card title="Apify token">{!me ? <p>Loading settings...</p> : <p>Configured: {String(me.apifyTokenConfigured)}</p>}<form onSubmit={save}><Field label="Save / update token"><input name="token" type="password" minLength={10} required /></Field><button type="submit">Save token</button><button type="button" onClick={() => apiFetch('/api/settings/apify-token', { method: 'DELETE' }, token!).then(() => { setMessage('Token deleted.'); load(); })} style={{ marginLeft: 8 }}>Delete token</button></form><form onSubmit={test} style={{ marginTop: 16 }}><Field label="Test a token without saving"><input name="token" type="password" minLength={10} required /></Field><button type="submit">Test token</button></form>{message ? <p>{message}</p> : null}</Card></div>;
}
