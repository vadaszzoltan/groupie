'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Card, Field } from '../../components/page';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../components/auth-provider';

export default function PostsPage() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<any>(null);
  const [filters, setFilters] = useState({ search: '', label: '', sourceId: '' });

  const load = () => {
    if (!token) return;
    const params = new URLSearchParams({ page: '1', pageSize: '20' });
    if (filters.search) params.set('search', filters.search);
    if (filters.label) params.set('label', filters.label);
    if (filters.sourceId) params.set('sourceId', filters.sourceId);
    apiFetch(`/api/posts?${params.toString()}`, {}, token).then(setPosts);
  };
  useEffect(() => { load(); }, [token, filters.search, filters.label, filters.sourceId]);

  async function updateLabel(postId: string, label: string) {
    await apiFetch(`/api/posts/${postId}/label`, { method: 'PUT', body: JSON.stringify({ label }) }, token!);
    load();
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>, postId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await apiFetch(`/api/posts/${postId}/draft`, { method: 'PUT', body: JSON.stringify({ content: form.get('content') }) }, token!);
    load();
  }

  return <div><Card title="Filters"><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}><Field label="Search"><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></Field><Field label="Label"><select value={filters.label} onChange={(e) => setFilters({ ...filters, label: e.target.value })}><option value="">All</option><option value="unreviewed">Unreviewed</option><option value="relevant">Relevant</option><option value="not_relevant">Not relevant</option></select></Field><Field label="Source ID"><input value={filters.sourceId} onChange={(e) => setFilters({ ...filters, sourceId: e.target.value })} /></Field></div></Card><Card title="Posts">{!posts ? <p>Loading posts...</p> : posts.items.length === 0 ? <p>No posts found.</p> : posts.items.map((post: any) => <div key={post.id} style={{ borderTop: '1px solid #e5e7eb', padding: '16px 0' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}><div><strong>{post.source.name}</strong><p>{post.contentText || 'No text available.'}</p><small>Published: {post.publishedAt ? new Date(post.publishedAt).toLocaleString() : 'Unknown'} · Scraped: {new Date(post.createdAt).toLocaleString()}</small></div><div><a href={post.postUrl} target="_blank">Open original</a><div><select value={post.label?.label ?? 'unreviewed'} onChange={(e) => updateLabel(post.id, e.target.value)}><option value="unreviewed">Unreviewed</option><option value="relevant">Relevant</option><option value="not_relevant">Not relevant</option></select></div></div></div><form onSubmit={(e) => saveDraft(e, post.id)}><Field label="Internal draft/note"><textarea name="content" defaultValue={post.draft?.content ?? ''} rows={3} /></Field><button type="submit">Save draft</button><button type="button" onClick={() => apiFetch(`/api/posts/${post.id}/draft`, { method: 'DELETE' }, token!).then(load)} style={{ marginLeft: 8 }}>Delete draft</button></form></div>)}</Card></div>;
}
