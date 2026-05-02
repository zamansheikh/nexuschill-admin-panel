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
import type { PaginatedList, RoomBanner } from '@/types';

export default function RoomBannersPage() {
  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canManage = hasPermission(permissions, 'banners.manage');

  const [page, setPage] = useState(1);
  const [active, setActive] = useState('');
  const [slot, setSlot] = useState('');
  const [data, setData] = useState<PaginatedList<RoomBanner> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (active) params.set('active', active);
      if (slot) params.set('slot', slot);
      const res = await api<PaginatedList<RoomBanner>>(
        `/admin/banners/room?${params.toString()}`,
      );
      setData(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, active, slot]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Room Banners"
        subtitle="Vertical carousel cards shown on the right edge of the audio room. Two slots stack vertically; each slot rotates through every banner assigned to it every ~5 seconds."
        actions={canManage && <Button href="/room-banners/new">+ New Room Banner</Button>}
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          value={active}
          onChange={(e) => {
            setActive(e.target.value);
            setPage(1);
          }}
          className="w-44"
        >
          <option value="">All statuses</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </Select>
        <Select
          value={slot}
          onChange={(e) => {
            setSlot(e.target.value);
            setPage(1);
          }}
          className="w-44"
        >
          <option value="">All slots</option>
          <option value="1">Slot 1 (top)</option>
          <option value="2">Slot 2 (bottom)</option>
        </Select>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorAlert message={error} />
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading…
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState message="No room banners yet." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Image</Th>
                <Th>Title</Th>
                <Th>Slot</Th>
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
                    <Link href={`/room-banners/${b.id}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.imageUrl}
                        alt=""
                        className="h-14 w-10 rounded object-cover"
                      />
                    </Link>
                  </Td>
                  <Td>
                    <Link href={`/room-banners/${b.id}`}>
                      <div className="font-medium text-slate-900">{b.title}</div>
                      {b.subtitle && (
                        <div className="text-xs text-slate-500">{b.subtitle}</div>
                      )}
                    </Link>
                  </Td>
                  <Td className="text-xs">
                    <Badge tone={b.slot === 1 ? 'brand' : 'blue'}>
                      Slot {b.slot}
                    </Badge>
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
                    {b.active ? (
                      <Badge tone="green">active</Badge>
                    ) : (
                      <Badge tone="amber">inactive</Badge>
                    )}
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
