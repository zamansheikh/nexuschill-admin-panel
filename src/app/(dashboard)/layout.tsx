'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import Sidebar from '@/components/sidebar';
import { api } from '@/lib/api';
import { authStorage } from '@/lib/auth';
import type { MeResponse } from '@/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const token = authStorage.getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    // Refresh admin/role cache from backend
    api<MeResponse>('/admin/auth/me')
      .then((data) => {
        authStorage.setAdmin(data.admin, data.role);
        setReady(true);
      })
      .catch(() => {
        authStorage.clear();
        router.replace('/login');
      });
  }, [router]);

  // Auto-close mobile drawer whenever the route changes (clicking a link
  // inside the sidebar already calls onClose, but route changes from
  // anywhere else — back button, programmatic redirects — should also
  // collapse the drawer for a clean transition).
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">Loading…</div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar — hidden on lg+ where the sidebar is permanent. */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 shadow-soft backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="-ml-2 rounded-md p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-gradient text-xs font-bold text-white">
              NC
            </div>
            <span className="text-sm font-semibold text-slate-900">NexusChill</span>
          </div>

          {/* Spacer keeps the logo visually centered. */}
          <span className="w-9" aria-hidden="true" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
