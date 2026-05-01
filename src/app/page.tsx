'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { authStorage } from '@/lib/auth';

const FEATURES = [
  {
    icon: '◯',
    title: 'Users & Agencies',
    body: 'Search, scope, and moderate app users, agencies, and resellers with role-based access.',
  },
  {
    icon: '✿',
    title: 'Gifts & Cosmetics',
    body: 'Manage the live monetization catalog — assets, pricing, deactivation, all in one place.',
  },
  {
    icon: '$',
    title: 'Transactions',
    body: 'Audit recharges, withdrawals, and exchanges with searchable, paginated transaction history.',
  },
  {
    icon: '✉',
    title: 'Push & Engagement',
    body: 'Compose push notifications, schedule banners, and run daily-reward campaigns from the same console.',
  },
  {
    icon: '⚡',
    title: 'Live Moderation',
    body: 'Review user moments, manage Agora rooms, and keep the platform safe in real time.',
  },
  {
    icon: '✦',
    title: 'Granular Permissions',
    body: 'Custom roles with per-feature permissions — give every team member exactly what they need.',
  },
];

export default function LandingPage() {
  // Auth-aware CTA: shows "Open Console" if signed in, "Sign in" otherwise.
  // Initialised to null so SSR and the first client render match (no
  // hydration mismatch); resolves on mount via the localStorage check.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    setSignedIn(!!authStorage.getAccessToken());
  }, []);

  const ctaHref = signedIn ? '/dashboard' : '/login';
  const ctaLabel = signedIn ? 'Open console' : 'Sign in';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-sm font-bold text-white shadow-soft">
              NC
            </div>
            <span className="text-base font-semibold text-slate-900">NexusChill</span>
          </Link>

          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-brand-800"
          >
            {ctaLabel}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Soft mesh background — purely decorative, doesn't grab events. */}
        <div className="pointer-events-none absolute inset-0 bg-mesh-gradient opacity-70" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-medium text-brand-700 shadow-soft backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-600" aria-hidden />
              Admin Console
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Run the party app from{' '}
              <span className="bg-brand-gradient bg-clip-text text-transparent">one console</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Manage gifts, users, agencies, transactions, push notifications, and live moderation —
              all backed by granular role-based access.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href={ctaHref}
                className="inline-flex w-full items-center justify-center rounded-xl bg-brand-700 px-6 py-3 text-base font-medium text-white shadow-card transition hover:bg-brand-800 sm:w-auto"
              >
                {ctaLabel}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="ml-2 h-4 w-4"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <a
                href="#features"
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
              >
                What's inside
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Everything you need to operate
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Six modules. One sign-in. Designed for fast triage on desktop and quick checks on mobile.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-xl text-brand-700 transition group-hover:bg-brand-100">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-t border-slate-200 bg-brand-gradient">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 text-center sm:flex-row sm:px-6 sm:text-left">
          <div>
            <h3 className="text-xl font-semibold text-white sm:text-2xl">
              Ready when you are.
            </h3>
            <p className="mt-1 text-sm text-brand-100">
              Sign in with your admin credentials to access the console.
            </p>
          </div>
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-base font-medium text-brand-800 shadow-card transition hover:bg-brand-50"
          >
            {ctaLabel}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-gradient text-[10px] font-bold text-white">
              NC
            </div>
            <span>NexusChill Admin Console</span>
          </div>
          <div>© {new Date().getFullYear()} NexusChill</div>
        </div>
      </footer>
    </div>
  );
}
