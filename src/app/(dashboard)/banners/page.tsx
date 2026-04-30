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
import type { HomeBanner, PaginatedList } from '@/types';

export default function HomeBannersPage() {
  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canManage = hasPermission(permissions, 'banners.manage');

  const [page, setPage] = useState(1);
  const [active, setActive] = useState('');
  const [data, setData] = useState<PaginatedList<HomeBanner> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (active) params.set('active', active);
      const res = await api<PaginatedList<HomeBanner>>(
        `/admin/banners/home?${params.toString()}`,
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
        title="Home Banners"
        subtitle="Carousel images shown at the top of the mobile home page. Banners can be visual-only or link to a route, room, profile, or web URL."
        actions={canManage && <Button href="/banners/new">+ New Banner</Button>}
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
        <EmptyState message="No home banners yet." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Image</Th>
                <Th>Title</Th>
                <Th>Link</Th>
                <Th>Sort</Th>
                <Th>Window</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((b) => (
                <tr key={b.id} className="cursor-pointer hover:bg-slate-50">
                  <Td>
                    <Link href={`/banners/${b.id}`}>
                      <img src={b.imageUrl} alt="" className="h-10 w-20 rounded object-cover" />
                    </Link>
                  </Td>
                  <Td>
                    <Link href={`/banners/${b.id}`}>
                      <div className="font-medium text-slate-900">{b.title}</div>
                      {b.subtitle && (
                        <div className="text-xs text-slate-500">{b.subtitle}</div>
                      )}
                    </Link>
                  </Td>
                  <Td className="text-xs">
                    {b.linkKind === 'none' ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <>
                        <Badge tone="brand">{b.linkKind}</Badge>{' '}
                        <code className="text-xs text-slate-600">{b.linkValue}</code>
                      </>
                    )}
                  </Td>
                  <Td className="text-xs">{b.sortOrder}</Td>
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
