'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Sidebar from '@/components/sidebar';
import { api } from '@/lib/api';
import { authStorage } from '@/lib/auth';
import type { MeResponse } from '@/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

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

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">Loading…</div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-6">{children}</div>
      </main>
    </div>
  );
}
