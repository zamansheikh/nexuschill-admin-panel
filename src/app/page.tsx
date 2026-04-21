'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { authStorage } from '@/lib/auth';

export default function IndexPage() {
  const router = useRouter();
  useEffect(() => {
    const token = authStorage.getAccessToken();
    router.replace(token ? '/dashboard' : '/login');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center text-slate-500">Loading…</div>
  );
}
