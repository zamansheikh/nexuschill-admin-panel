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
import type {
  CosmeticItem,
  PaginatedList,
  StoreCategory,
  StoreListing,
} from '@/types';

const CATEGORIES: StoreCategory[] = ['frame', 'vehicle', 'theme', 'ring'];

export default function StoreListingsPage() {
  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canManage = hasPermission(permissions, 'store.manage');

  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<StoreCategory | ''>('');
  const [active, setActive] = useState('');

  const [data, setData] = useState<PaginatedList<StoreListing> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (category) params.set('category', category);
      if (active) params.set('active', active);
      const res = await api<PaginatedList<StoreListing>>(
        `/admin/store/listings?${params.toString()}`,
      );
      setData(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, category, active]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Store"
        subtitle="Listings shown in the in-app store. Each entry wraps a Cosmetic Item with a price and rental duration."
        actions={canManage && <Button href="/store/new">+ New Listing</Button>}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as StoreCategory | '');
            setPage(1);
          }}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select value={active} onChange={(e) => { setActive(e.target.value); setPage(1); }}>
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
      </div>

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading…
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState message="No store listings yet. Create a Cosmetic Item first, then list it here." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Preview</Th>
                <Th>Item</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Duration</Th>
                <Th>Flags</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((l) => {
                const item = (typeof l.cosmeticItemId === 'string'
                  ? null
                  : (l.cosmeticItemId as CosmeticItem));
                return (
                  <tr key={l.id} className="cursor-pointer hover:bg-slate-50">
                    <Td>
                      <Link href={`/store/${l.id}`}>
                        {item?.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt=""
                            className="h-12 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded bg-slate-100" />
                        )}
                      </Link>
                    </Td>
                    <Td>
                      <Link href={`/store/${l.id}`}>
                        <div className="font-medium text-slate-900">
                          {item?.name?.en || '—'}
                        </div>
                        <code className="text-xs text-slate-500">{item?.code || '—'}</code>
                      </Link>
                    </Td>
                    <Td>
                      <Badge tone="brand">{l.category}</Badge>
                    </Td>
                    <Td className="font-mono text-amber-700">{l.priceCoins.toLocaleString()}</Td>
                    <Td className="text-xs">
                      {l.durationDays > 0 ? `${l.durationDays} days` : 'Permanent'}
                    </Td>
                    <Td>
                      <div className="flex gap-1">
                        {l.featured && <Badge tone="amber">featured</Badge>}
                        {l.giftable && <Badge tone="blue">giftable</Badge>}
                      </div>
                    </Td>
                    <Td>
                      {l.active ? <Badge tone="green">active</Badge> : <Badge tone="amber">inactive</Badge>}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Pagination page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
        </>
      )}
    </div>
  );
}
