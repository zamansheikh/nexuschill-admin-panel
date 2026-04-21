'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Badge, Button, EmptyState, ErrorAlert, Input, PageHeader, Pagination, Select, Table, Td, Th } from '@/components/ui';
import { api } from '@/lib/api';
import { authStorage, hasPermission } from '@/lib/auth';
import type { Admin, AdminRole, PaginatedList } from '@/types';

interface ListResponse extends PaginatedList<Admin & { roleId: AdminRole | string }> {}

export default function AdminsPage() {
  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canCreate = hasPermission(permissions, 'admin.create');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState<string>('');
  const [roleId, setRoleId] = useState<string>('');

  const [data, setData] = useState<ListResponse | null>(null);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    try {
      const res = await api<{ roles: AdminRole[] }>('/admin/roles');
      setRoles(res.roles);
    } catch {
      /* ignore */
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (roleId) params.set('roleId', roleId);
      const res = await api<ListResponse>(`/admin/users?${params.toString()}`);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, roleId]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function roleName(r: AdminRole | string): string {
    if (typeof r === 'string') return roles.find((rl) => rl.id === r)?.displayName || r;
    return r?.displayName || r?.name || '—';
  }

  return (
    <div>
      <PageHeader
        title="Admin Users"
        subtitle="Manage staff, agencies, resellers, and other admin-panel accounts"
        actions={canCreate && <Button href="/admins/new">+ New Admin</Button>}
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
            placeholder="Search email, username, name…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        <Select
          value={roleId}
          onChange={(e) => {
            setRoleId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.displayName}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
          <option value="locked">Locked</option>
        </Select>
      </div>

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading…
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState message="No admin users found." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Name / Email</Th>
                <Th>Username</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Scope</Th>
                <Th>Last login</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <Td>
                    <div className="font-medium text-slate-900">{a.displayName || '—'}</div>
                    <div className="text-xs text-slate-500">{a.email}</div>
                    {a.linkedUserId && (
                      <div className="mt-1"><Badge tone="blue">linked to app user</Badge></div>
                    )}
                  </Td>
                  <Td className="font-mono text-xs">{a.username}</Td>
                  <Td>{roleName(a.roleId)}</Td>
                  <Td>
                    {a.status === 'active' ? (
                      <Badge tone="green">active</Badge>
                    ) : a.status === 'disabled' ? (
                      <Badge tone="slate">disabled</Badge>
                    ) : (
                      <Badge tone="red">locked</Badge>
                    )}
                  </Td>
                  <Td>
                    {a.scopeType ? (
                      <span className="text-xs">
                        {a.scopeType}
                        {a.scopeId && <span className="ml-1 font-mono text-slate-400">#{a.scopeId.slice(-6)}</span>}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">global</span>
                    )}
                  </Td>
                  <Td className="text-xs text-slate-500">
                    {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString() : 'Never'}
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
