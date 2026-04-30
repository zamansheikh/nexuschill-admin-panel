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
import type { PaginatedList, Reseller } from '@/types';

export default function ResellersPage() {
  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canCreate = hasPermission(permissions, 'reseller.manage');

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const [data, setData] = useState<PaginatedList<Reseller> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const res = await api<PaginatedList<Reseller>>(`/admin/resellers?${params.toString()}`);
      setData(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Resellers"
        subtitle="Coin distribution partners. Each reseller has its own pool — admin tops up, reseller assigns to users."
        actions={canCreate && <Button href="/resellers/new">+ New Reseller</Button>}
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(searchInput);
          }}
          className="sm:col-span-2"
        >
          <Input
            placeholder="Search by ID, name, or code…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="terminated">Terminated</option>
        </Select>
      </div>

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading…
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState message="No resellers yet." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Code</Th>
                <Th>Name</Th>
                <Th>Pool</Th>
                <Th>Lifetime received</Th>
                <Th>Lifetime assigned</Th>
                <Th>Country</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((r) => (
                <tr key={r.id} className="cursor-pointer hover:bg-slate-50">
                  <Td>
                    <code className="text-xs font-semibold text-brand">
                      {r.numericId ?? '—'}
                    </code>
                  </Td>
                  <Td>
                    <Link href={`/resellers/${r.id}`}>
                      <code className="text-xs font-semibold text-brand">{r.code}</code>
                    </Link>
                  </Td>
                  <Td>
                    <Link href={`/resellers/${r.id}`}>
                      <div className="font-medium text-slate-900">{r.name}</div>
                      <div className="text-xs text-slate-500">{r.description || '—'}</div>
                    </Link>
                  </Td>
                  <Td>
                    <span className="font-mono font-semibold text-amber-700">
                      {r.coinPool.toLocaleString()}
                    </span>
                    {r.creditLimit > 0 && (
                      <span className="ml-1 text-xs text-slate-500">/ {r.creditLimit.toLocaleString()}</span>
                    )}
                  </Td>
                  <Td className="text-xs">{r.lifetimeCoinsReceived.toLocaleString()}</Td>
                  <Td className="text-xs">{r.lifetimeCoinsAssigned.toLocaleString()}</Td>
                  <Td className="text-xs">{r.country}</Td>
                  <Td>
                    {r.status === 'active' && <Badge tone="green">active</Badge>}
                    {r.status === 'suspended' && <Badge tone="amber">suspended</Badge>}
                    {r.status === 'terminated' && <Badge tone="red">terminated</Badge>}
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
