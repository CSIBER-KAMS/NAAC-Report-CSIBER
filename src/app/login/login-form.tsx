'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    let res: Response;
    try {
      res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      setBusy(false);
      setError('Could not reach the server. Check your connection.');
      return;
    }
    setBusy(false);

    if (res.ok) {
      const data = (await res.json()) as { redirectTo?: string };
      // replace, not push: the browser Back button must not return to the
      // sign-in form after a successful sign-in.
      router.replace(data.redirectTo || '/');
      router.refresh();
      return;
    }

    // The server distinguishes wrong credentials from a pending or disabled
    // account, because the user needs to know whether to retry or to call the
    // IQAC office. Show its message rather than a generic one.
    let message = 'Invalid email or password.';
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      /* keep the default */
    }
    setError(message);
    setPassword('');
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          className="input"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          className="input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <button className="btn-primary w-full justify-center" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
