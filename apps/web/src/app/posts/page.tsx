'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Card, Field } from '../../components/page';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../components/auth-provider';

type PostItem = {
  id: string;
  postUrl: string;
  contentText: string;
  publishedAt: string | null;
  createdAt: string;
  source: { id: string; name: string };
  label?: { label: string } | null;
  draft?: { content: string } | null;
};

type SourceOption = { id: string; name: string };

type PostsResponse = {
  items: PostItem[];
  total: number;
};

export default function PostsPage() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<PostsResponse | null>(null);
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', label: '', sourceId: '' });

  const load = async () => {
    if (!token) return;
    try {
      setError('');
      const params = new URLSearchParams({ page: '1', pageSize: '20' });
      if (filters.search) params.set('search', filters.search);
      if (filters.label) params.set('label', filters.label);
      if (filters.sourceId) params.set('sourceId', filters.sourceId);
      const [postsResponse, sourceResponse] = await Promise.all([
        apiFetch<PostsResponse>(`/api/posts?${params.toString()}`, {}, token),
        apiFetch<SourceOption[]>('/api/sources', {}, token),
      ]);
      setPosts(postsResponse);
      setSources(sourceResponse.map((source) => ({ id: source.id, name: source.name })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts.');
    }
  };

  useEffect(() => {
    void load();
  }, [token, filters.search, filters.label, filters.sourceId]);

  async function updateLabel(postId: string, label: string) {
    await apiFetch(`/api/posts/${postId}/label`, {
      method: 'PUT',
      body: JSON.stringify({ label }),
    }, token!);
    await load();
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>, postId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await apiFetch(`/api/posts/${postId}/draft`, {
      method: 'PUT',
      body: JSON.stringify({ content: form.get('content') }),
    }, token!);
    await load();
  }

  async function deleteDraft(postId: string) {
    await apiFetch(`/api/posts/${postId}/draft`, { method: 'DELETE' }, token!);
    await load();
  }

  return (
    <div>
      <Card title="Filters">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <Field label="Search">
            <input
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            />
          </Field>
          <Field label="Label">
            <select
              value={filters.label}
              onChange={(event) => setFilters({ ...filters, label: event.target.value })}
            >
              <option value="">All</option>
              <option value="unreviewed">Unreviewed</option>
              <option value="relevant">Relevant</option>
              <option value="not_relevant">Not relevant</option>
            </select>
          </Field>
          <Field label="Source">
            <select
              value={filters.sourceId}
              onChange={(event) => setFilters({ ...filters, sourceId: event.target.value })}
            >
              <option value="">All sources</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      <Card title="Posts">
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
        {!posts ? (
          <p>Loading posts...</p>
        ) : posts.items.length === 0 ? (
          <p>No posts found.</p>
        ) : (
          posts.items.map((post) => (
            <div key={post.id} style={{ borderTop: '1px solid #e5e7eb', padding: '16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <strong>{post.source.name}</strong>
                  <p>{post.contentText || 'No text available.'}</p>
                  <small>
                    Published:{' '}
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleString() : 'Unknown'} ·
                    Scraped: {new Date(post.createdAt).toLocaleString()}
                  </small>
                </div>
                <div>
                  <a href={post.postUrl} target="_blank" rel="noreferrer">
                    Open original
                  </a>
                  <div>
                    <select
                      value={post.label?.label ?? 'unreviewed'}
                      onChange={(event) => void updateLabel(post.id, event.target.value)}
                    >
                      <option value="unreviewed">Unreviewed</option>
                      <option value="relevant">Relevant</option>
                      <option value="not_relevant">Not relevant</option>
                    </select>
                  </div>
                </div>
              </div>
              <form onSubmit={(event) => void saveDraft(event, post.id)}>
                <Field label="Internal draft/note">
                  <textarea name="content" defaultValue={post.draft?.content ?? ''} rows={3} />
                </Field>
                <button type="submit">Save draft</button>
                <button
                  type="button"
                  onClick={() => void deleteDraft(post.id)}
                  style={{ marginLeft: 8 }}
                >
                  Delete draft
                </button>
              </form>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
