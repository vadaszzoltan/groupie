'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../components/auth-provider';
import { Card, Field } from '../../components/page';
import { apiFetch } from '../../lib/api';

export default function SourcesPage() {
  const { token } = useAuth();
  const [sources, setSources] = useState<any[]>([]);
  const [error, setError] = useState('');

  const load = () => token && apiFetch<any[]>('/api/sources', {}, token).then(setSources).catch((err) => setError(String(err)));
  useEffect(() => { load(); }, [token]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const form = new FormData(event.currentTarget);
    await apiFetch('/api/sources', { method: 'POST', body: JSON.stringify({
      name: form.get('name'),
      platform: 'facebook_group',
      groupUrl: form.get('groupUrl'),
      groupExternalId: form.get('groupExternalId') || undefined,
      actorId: form.get('actorId'),
      actorInputJson: JSON.parse(String(form.get('actorInputJson') || '{}')),
      isActive: true,
    }) }, token);
    event.currentTarget.reset();
    load();
  }

  return <div><Card title="Add source"><form onSubmit={onSubmit}><Field label="Name"><input name="name" required /></Field><Field label="Group URL"><input name="groupUrl" type="url" required /></Field><Field label="Group external ID"><input name="groupExternalId" /></Field><Field label="Actor ID"><input name="actorId" required /></Field><Field label="Actor input JSON"><textarea name="actorInputJson" rows={5} defaultValue={'{}'} /></Field><button>Create source</button></form></Card><Card title="Watched sources">{error ? <p style={{color:'crimson'}}>{error}</p> : null}{sources.length === 0 ? <p>No sources yet.</p> : <table width="100%"><thead><tr><th align="left">Name</th><th align="left">Platform</th><th align="left">Active</th><th /></tr></thead><tbody>{sources.map((source) => <tr key={source.id}><td>{source.name}</td><td>{source.platform}</td><td>{String(source.isActive)}</td><td style={{ display: 'flex', gap: 8 }}><button onClick={() => apiFetch(`/api/sources/${source.id}/toggle`, { method: 'POST' }, token!).then(load)}>Toggle</button><button onClick={() => apiFetch(`/api/scraping/sources/${source.id}/run`, { method: 'POST' }, token!).then(load)}>Run</button><button onClick={() => apiFetch(`/api/sources/${source.id}`, { method: 'DELETE' }, token!).then(load)}>Delete</button></td></tr>)}</tbody></table>}</Card></div>;
}
