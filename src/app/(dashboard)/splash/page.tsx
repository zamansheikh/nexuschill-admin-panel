'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Badge,
  Button,
  EmptyState,
  ErrorAlert,
  PageHeader,
  Pagination,
  Select,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { api } from '@/lib/api';
import { authStorage, hasPermission } from '@/lib/auth';
import type { PaginatedList, SplashBanner } from '@/types';

export default function SplashBannersPage() {
  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canManage = hasPermission(permissions, 'banners.manage');

  const [page, setPage] = useState(1);
  const [active, setActive] = useState('');
  const [data, setData] = useState<PaginatedList<SplashBanner> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (active) params.set('active', active);
      const res = await api<PaginatedList<SplashBanner>>(
        `/admin/banners/splash?${params.toString()}`,
      );
      setData(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, active]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Splash Banners"
        subtitle="Custom splash screen images. The mobile app prefetches the highest-priority active splash and uses it on the user's next cold launch."
        actions={canManage && <Button href="/splash/new">+ New Splash</Button>}
      />

      <div className="mb-4 flex gap-3">
        <Select
          value={active}
          onChange={(e) => {
            setActive(e.target.value);
            setPage(1);
          }}
          className="w-44"
        >
          <option value="">All</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </Select>
      </div>

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading…
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState message="No splash banners yet." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Image</Th>
                <Th>Title</Th>
                <Th>Priority</Th>
                <Th>Window</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((b) => (
                <tr key={b.id} className="cursor-pointer hover:bg-slate-50">
                  <Td>
                    <Link href={`/splash/${b.id}`}>
                      <img src={b.imageUrl} alt="" className="h-20 w-12 rounded object-cover" />
                    </Link>
                  </Td>
                  <Td>
                    <Link href={`/splash/${b.id}`}>
                      <div className="font-medium text-slate-900">{b.title}</div>
                    </Link>
                  </Td>
                  <Td className="text-xs">{b.priority}</Td>
                  <Td className="text-xs text-slate-500">
                    {b.startDate ? new Date(b.startDate).toLocaleDateString() : '—'}
                    {' → '}
                    {b.endDate ? new Date(b.endDate).toLocaleDateString() : '—'}
                  </Td>
                  <Td>
                    {b.active ? <Badge tone="green">active</Badge> : <Badge tone="amber">inactive</Badge>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
        </>
      )}
    </div>
  );
}
