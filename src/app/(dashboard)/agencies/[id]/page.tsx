'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  Badge,
  Button,
  Card,
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
import type { Agency, AppUser, PaginatedList } from '@/types';

type AgencyStatus = Agency['status'];

export default function AgencyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canManage = hasPermission(permissions, 'agency.manage');
  const canAssignHost = hasPermission(permissions, 'hosts.assign_agency');

  const [agency, setAgency] = useState<Agency | null>(null);
  const [hosts, setHosts] = useState<PaginatedList<AppUser> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [assignUserId, setAssignUserId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const a = await api<{ agency: Agency }>(`/admin/agencies/${id}`);
      setAgency(a.agency);
      const h = await api<PaginatedList<AppUser>>(`/admin/agencies/${id}/hosts?page=${page}&limit=10`);
      setHosts(h);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(status: AgencyStatus) {
    setBusy('status');
    setError(null);
    try {
      const r = await api<{ agency: Agency }>(`/admin/agencies/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setAgency(r.agency);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function assignHost(e: React.FormEvent) {
    e.preventDefault();
    if (!assignUserId) return;
    setBusy('assign');
    setError(null);
    try {
      await api(`/admin/agencies/${id}/hosts/${assignUserId}`, { method: 'POST' });
      setAssignUserId('');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function removeHost(userId: string) {
    if (!confirm('Remove this host from the agency?')) return;
    setBusy('remove-' + userId);
    setError(null);
    try {
      await api(`/admin/agencies/${id}/hosts/${userId}/remove`, { method: 'PATCH' });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!agency) return <ErrorAlert message={error || 'Agency not found'} />;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={agency.name}
        subtitle={
          <>
            <code className="text-brand">{agency.code}</code> · {agency.country} ·{' '}
            <span>{agency.hostCount} hosts</span>
          </>
        }
        actions={
          <Button variant="secondary" onClick={() => router.back()}>
            ← Back
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorAlert message={error} />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Details</h3>
          <dl className="space-y-1.5 text-sm">
            <Row label="Code" value={<code>{agency.code}</code>} />
            <Row label="Country" value={agency.country} />
            <Row label="Commission" value={`${agency.commissionRate}%`} />
            <Row label="Hosts" value={String(agency.hostCount)} />
            <Row label="Total beans" value={String(agency.totalBeansEarned)} />
            <Row
              label="Created"
              value={new Date(agency.createdAt).toLocaleDateString()}
            />
          </dl>
        </Card>

        <Card>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</h3>
          <dl className="space-y-1.5 text-sm">
            <Row label="Email" value={agency.contactEmail || '—'} />
            <Row label="Phone" value={agency.contactPhone || '—'} />
          </dl>
          {agency.description && (
            <p className="mt-3 rounded bg-slate-50 p-2 text-xs text-slate-600">{agency.description}</p>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</h3>
          <div className="mb-3">
            {agency.status === 'active' && <Badge tone="green">Active</Badge>}
            {agency.status === 'suspended' && <Badge tone="amber">Suspended</Badge>}
            {agency.status === 'terminated' && <Badge tone="red">Terminated</Badge>}
          </div>
          {canManage && (
            <div className="flex flex-wrap gap-2">
              {agency.status !== 'active' && (
                <Button variant="secondary" disabled={busy === 'status'} onClick={() => changeStatus('active')}>
                  Activate
                </Button>
              )}
              {agency.status !== 'suspended' && (
                <Button variant="secondary" disabled={busy === 'status'} onClick={() => changeStatus('suspended')}>
                  Suspend
                </Button>
              )}
              {agency.status !== 'terminated' && (
                <Button variant="danger" disabled={busy === 'status'} onClick={() => changeStatus('terminated')}>
                  Terminate
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Hosts under this agency</h2>
          {canAssignHost && (
            <form onSubmit={assignHost} className="flex gap-2">
              <Input
                placeholder="App user ID"
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
                className="w-72 font-mono text-xs"
              />
              <Button type="submit" disabled={busy === 'assign' || !assignUserId}>
                {busy === 'assign' ? 'Assigning…' : 'Assign host'}
              </Button>
            </form>
          )}
        </div>

        {!hosts || hosts.items.length === 0 ? (
          <EmptyState message="No hosts assigned yet. Assign a host using their user ID — make sure they're already a host first." />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>User</Th>
                  <Th>Tier</Th>
                  <Th>Stream hours</Th>
                  <Th>Beans earned</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {hosts.items.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <Td>
                      <Link href={`/users/${u.id}`} className="block">
                        <div className="font-medium text-slate-900">{u.displayName || u.username || '—'}</div>
                        <code className="text-xs text-slate-500">@{u.username || '—'}</code>
                      </Link>
                    </Td>
                    <Td>
                      <Badge tone="brand">{u.hostProfile?.tier || 'trainee'}</Badge>
                    </Td>
                    <Td className="text-xs">{u.hostProfile?.streamHours ?? 0}</Td>
                    <Td className="text-xs">{u.hostProfile?.totalBeansEarned ?? 0}</Td>
                    <Td>
                      {u.status === 'active' && <Badge tone="green">active</Badge>}
                      {u.status === 'banned' && <Badge tone="red">banned</Badge>}
                    </Td>
                    <Td>
                      {canAssignHost && (
                        <button
                          onClick={() => removeHost(u.id)}
                          disabled={busy === 'remove-' + u.id}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50"
                        >
                          {busy === 'remove-' + u.id ? 'Removing…' : 'Remove'}
                        </button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={hosts.page} limit={hosts.limit} total={hosts.total} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="max-w-[60%] truncate font-medium text-slate-900">{value}</dd>
    </div>
  );
}
