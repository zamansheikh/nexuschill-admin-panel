'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import {
  Badge,
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
import type { Family, FamilyStatus, PaginatedList } from '@/types';

const STATUS_TONE: Record<FamilyStatus, 'green' | 'amber' | 'red'> = {
  active: 'green',
  frozen: 'amber',
  disbanded: 'red',
};

export default function FamiliesPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<FamilyStatus | ''>('');

  const [data, setData] = useState<PaginatedList<Family> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const res = await api<PaginatedList<Family>>(`/admin/families?${params.toString()}`);
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
        title="Families"
        subtitle="User-formed crews. Created from the mobile app for 6M coins (free for SVIP4+). Auto-disbands after 7 days at 1 member."
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
            placeholder="Search by name…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as FamilyStatus | '');
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="frozen">Frozen</option>
          <option value="disbanded">Disbanded</option>
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
        <EmptyState message="No families yet." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Name</Th>
                <Th>Level</Th>
                <Th>Members</Th>
                <Th>Join Mode</Th>
                <Th>Status</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((f) => (
                <tr key={f.id} className="cursor-pointer hover:bg-slate-50">
                  <Td>
                    <Link href={`/families/${f.id}`} className="block">
                      <code className="text-xs font-semibold text-brand">
                        {f.numericId ?? '—'}
                      </code>
                    </Link>
                  </Td>
                  <Td>
                    <Link href={`/families/${f.id}`} className="block">
                      <div className="flex items-center gap-2">
                        {f.coverUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={f.coverUrl}
                            alt=""
                            className="h-8 w-8 rounded object-cover ring-1 ring-slate-200"
                          />
                        )}
                        <div>
                          <div className="font-medium text-slate-900">{f.name}</div>
                          {f.notification && (
                            <div className="line-clamp-1 text-xs text-slate-500">
                              {f.notification}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </Td>
                  <Td className="text-xs">Lv.{f.level}</Td>
                  <Td className="text-xs">{f.memberCount}</Td>
                  <Td className="text-xs capitalize">{f.joinMode.replace('_', ' ')}</Td>
                  <Td>
                    <Badge tone={STATUS_TONE[f.status]}>{f.status}</Badge>
                  </Td>
                  <Td className="text-xs text-slate-500">
                    {new Date(f.createdAt).toLocaleDateString()}
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
