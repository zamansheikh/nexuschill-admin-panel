'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ApiError, api } from '@/lib/api';
import { authStorage } from '@/lib/auth';
import type { Admin, AdminRole, AdminTokens } from '@/types';

interface LoginResponse {
  admin: Admin;
  role: AdminRole;
  tokens: AdminTokens;
}

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api<LoginResponse>('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
        skipAuth: true,
      });
      authStorage.setTokens(data.tokens);
      authStorage.setAdmin(data.admin, data.role);
      router.replace('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to reach the server. Check your connection or contact an administrator.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 p-4">
      {/* Layered backdrop — gradient + soft mesh blobs. Decorative only. */}
      <div className="absolute inset-0 bg-brand-gradient" aria-hidden />
      <div
        className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-brand-400/30 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -right-32 bottom-10 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl"
        aria-hidden
      />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <div className="mb-7 text-center">
          <Link
            href="/"
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-xl font-bold text-white shadow-soft transition hover:scale-105"
            aria-label="NexusChill home"
          >
            NC
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">NexusChill Admin</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to the admin console</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email or Username
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              placeholder="admin@partyapp.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-700 px-4 py-2.5 font-medium text-white shadow-soft transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-xs">
          <Link
            href="/"
            className="text-slate-500 transition hover:text-brand-700"
          >
            ← Back to home
          </Link>
          <span className="text-slate-400">
            Default creds seeded from backend <code>.env</code>
          </span>
        </div>
      </div>
    </div>
  );
}
