'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Badge,
  Button,
  EmptyState,
  ErrorAlert,
  Input,
  PageHeader,
  Pagination,
  Select,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { api } from '@/lib/api';
import { authStorage, hasPermission } from '@/lib/auth';
import type { Gift, GiftCategory, PaginatedList } from '@/types';

const CATEGORY_TONE: Record<GiftCategory, 'slate' | 'green' | 'amber' | 'brand' | 'red'> = {
  basic: 'slate',
  premium: 'green',
  legendary: 'amber',
  limited: 'red',
};

export default function GiftsPage() {
  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canManage = hasPermission(permissions, 'gifts.manage');

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [category, setCategory] = useState<GiftCategory | ''>('');

  const [data, setData] = useState<PaginatedList<Gift> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (active) params.set('active', active);
      if (category) params.set('category', category);
      const res = await api<PaginatedList<Gift>>(`/admin/gifts?${params.toString()}`);
      setData(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, active, category]);

  useEffect(() => {
    load();
  }, [load]);

  // Per-row mutations — keep them inline so the admin doesn't have to
  // open each gift to retire it.
  async function deactivate(g: Gift) {
    if (!confirm(`Deactivate "${g.name.en}"?`)) return;
    try {
      await api(`/admin/gifts/${g.id}`, { method: 'DELETE' });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function reactivate(g: Gift) {
    try {
      await api(`/admin/gifts/${g.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: true }),
      });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function purge(g: Gift) {
    if (
      !confirm(
        `Permanently delete "${g.name.en}"? This also removes its Cloudinary assets. Cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await api(`/admin/gifts/${g.id}/purge`, { method: 'DELETE' });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Gifts"
        subtitle="Catalog of virtual gifts. Each send debits coins from sender, credits diamonds to receiver."
        actions={canManage && <Button href="/gifts/new">+ New Gift</Button>}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(searchInput);
          }}
          className="col-span-2"
        >
          <Input
            placeholder="Search code or name…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <Select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as GiftCategory | '');
            setPage(1);
          }}
        >
          <option value="">All categories</option>
          <option value="basic">Basic</option>
          <option value="premium">Premium</option>
          <option value="legendary">Legendary</option>
          <option value="limited">Limited</option>
        </Select>
        <Select
          value={active}
          onChange={(e) => {
            setActive(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
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
        <EmptyState message="No gifts yet." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Name</Th>
                <Th>Category</Th>
                <Th>Price → Reward</Th>
                <Th>Sent</Th>
                <Th>Flags</Th>
                <Th>Status</Th>
                {canManage && <Th>Actions</Th>}
              </tr>
            </thead>
            <tbody>
              {data.items.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50">
                  <Td>
                    <Link href={`/gifts/${g.id}`}>
                      <code className="text-xs font-semibold text-brand">{g.code}</code>
                    </Link>
                  </Td>
                  <Td>
                    <Link href={`/gifts/${g.id}`}>
                      <div className="flex items-center gap-2">
                        {g.thumbnailUrl && (
                          <img src={g.thumbnailUrl} alt="" className="h-8 w-8 rounded object-cover" />
                        )}
                        <div>
                          <div className="font-medium text-slate-900">{g.name.en}</div>
                          {g.name.bn && (
                            <div className="text-xs text-slate-500">{g.name.bn}</div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </Td>
                  <Td>
                    <Badge tone={CATEGORY_TONE[g.category]}>{g.category}</Badge>
                  </Td>
                  <Td className="font-mono text-xs">
                    {g.priceCoins}c → {g.diamondReward}d
                  </Td>
                  <Td className="text-xs">{g.totalSent}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {g.featured && <Badge tone="amber">featured</Badge>}
                      {g.vipOnly && <Badge tone="brand">VIP</Badge>}
                      {g.svipOnly && <Badge tone="brand">SVIP</Badge>}
                      {g.countries.length > 0 && (
                        <Badge tone="blue">{g.countries.join(',')}</Badge>
                      )}
                    </div>
                  </Td>
                  <Td>
                    {g.active ? <Badge tone="green">active</Badge> : <Badge tone="slate">inactive</Badge>}
                  </Td>
                  {canManage && (
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {g.active ? (
                          <button
                            onClick={() => deactivate(g)}
                            className="rounded border border-red-200 bg-white px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => reactivate(g)}
                            className="rounded border border-emerald-200 bg-white px-2 py-0.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                          >
                            Reactivate
                          </button>
                        )}
                        {g.totalSent === 0 && (
                          // Hard-delete is only safe when no GiftEvent
                          // references this gift. The button is hidden
                          // otherwise; the server enforces the same rule.
                          <button
                            onClick={() => purge(g)}
                            className="rounded border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </Td>
                  )}
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
