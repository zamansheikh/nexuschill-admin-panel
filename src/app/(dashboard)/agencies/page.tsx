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
import type { Agency, PaginatedList } from '@/types';

export default function AgenciesPage() {
  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canCreate = hasPermission(permissions, 'agency.manage');

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const [data, setData] = useState<PaginatedList<Agency> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const res = await api<PaginatedList<Agency>>(`/admin/agencies?${params.toString()}`);
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
        title="Agencies"
        subtitle="Business partners that contract with hosts. Each agency has its own admin owner and host roster."
        actions={canCreate && <Button href="/agencies/new">+ New Agency</Button>}
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
            placeholder="Search by ID, name, code, description…"
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
        <EmptyState message="No agencies yet." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Code</Th>
                <Th>Name</Th>
                <Th>Country</Th>
                <Th>Hosts</Th>
                <Th>Commission</Th>
                <Th>Status</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((a) => (
                <tr key={a.id} className="cursor-pointer hover:bg-slate-50">
                  <Td>
                    <code className="text-xs font-semibold text-brand">
                      {a.numericId ?? '—'}
                    </code>
                  </Td>
                  <Td>
                    <Link href={`/agencies/${a.id}`} className="block">
                      <code className="text-xs font-semibold text-brand">{a.code}</code>
                    </Link>
                  </Td>
                  <Td>
                    <Link href={`/agencies/${a.id}`} className="block">
                      <div className="font-medium text-slate-900">{a.name}</div>
                      <div className="text-xs text-slate-500">{a.description || '—'}</div>
                    </Link>
                  </Td>
                  <Td className="text-xs">{a.country}</Td>
                  <Td>
                    <span className="font-medium">{a.hostCount}</span>
                  </Td>
                  <Td className="text-xs">{a.commissionRate}%</Td>
                  <Td>
                    {a.status === 'active' && <Badge tone="green">active</Badge>}
                    {a.status === 'suspended' && <Badge tone="amber">suspended</Badge>}
                    {a.status === 'terminated' && <Badge tone="red">terminated</Badge>}
                  </Td>
                  <Td className="text-xs text-slate-500">
                    {new Date(a.createdAt).toLocaleDateString()}
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
