'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { Badge, EmptyState, ErrorAlert, Input, PageHeader, Pagination, Select, Table, Td, Th } from '@/components/ui';
import { api } from '@/lib/api';
import type { AppUser, PaginatedList } from '@/types';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [isHost, setIsHost] = useState('');

  const [data, setData] = useState<PaginatedList<AppUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (isHost) params.set('isHost', isHost);
      const res = await api<PaginatedList<AppUser>>(`/admin/app-users?${params.toString()}`);
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, status, isHost]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="App Users"
        subtitle="Users registered via the mobile app. Promote to host or admin role from here."
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(searchInput);
          }}
          className="sm:col-span-2"
        >
          <Input
            placeholder="Search email, phone, username, name…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </Select>
        <Select value={isHost} onChange={(e) => { setIsHost(e.target.value); setPage(1); }}>
          <option value="">All users</option>
          <option value="true">Hosts only</option>
          <option value="false">Non-hosts only</option>
        </Select>
      </div>

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading…
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState message="No app users found." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Contact</Th>
                <Th>Country</Th>
                <Th>Level</Th>
                <Th>Flags</Th>
                <Th>Status</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((u) => (
                <tr key={u.id} className="cursor-pointer hover:bg-slate-50">
                  <Td>
                    <Link href={`/users/${u.id}`} className="block">
                      <div className="font-medium text-slate-900">{u.displayName || u.username || '—'}</div>
                      <code className="text-xs text-slate-500">@{u.username || '(no username)'}</code>
                    </Link>
                  </Td>
                  <Td>
                    <div className="text-xs text-slate-600">{u.email || '—'}</div>
                    <div className="text-xs text-slate-500">{u.phone || '—'}</div>
                  </Td>
                  <Td className="text-xs">{u.country}</Td>
                  <Td className="text-xs">Lv. {u.level}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {u.isHost && <Badge tone="brand">host</Badge>}
                      {u.linkedAdminId && <Badge tone="blue">admin linked</Badge>}
                    </div>
                  </Td>
                  <Td>
                    {u.status === 'active' && <Badge tone="green">active</Badge>}
                    {u.status === 'banned' && <Badge tone="red">banned</Badge>}
                    {u.status === 'suspended' && <Badge tone="amber">suspended</Badge>}
                  </Td>
                  <Td className="text-xs text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
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
