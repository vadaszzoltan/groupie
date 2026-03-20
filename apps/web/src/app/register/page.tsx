'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Card, Field } from '../../components/page';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../components/auth-provider';

export default function RegisterPage() {
  const router = useRouter();
  const { setToken } = useAuth();
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiFetch<{ accessToken: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
        }),
      });
      setToken(result.accessToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  }

  return (
    <Card title="Register">
      <form onSubmit={onSubmit}>
        <Field label="Email">
          <input name="email" type="email" required />
        </Field>
        <Field label="Password">
          <input name="password" type="password" minLength={8} required />
        </Field>
        <button>Create account</button>
        <p>
          Already have an account? <Link href="/login">Login</Link>
        </p>
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      </form>
    </Card>
  );
}
