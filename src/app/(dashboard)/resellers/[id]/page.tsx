'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorAlert,
  Field,
  Input,
  PageHeader,
  Pagination,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { api } from '@/lib/api';
import { authStorage, hasPermission } from '@/lib/auth';
import type { PaginatedList, Reseller, ResellerLedgerEntry } from '@/types';

export default function ResellerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canManage = hasPermission(permissions, 'reseller.manage');
  const canMint = hasPermission(permissions, 'wallet.mint');
  const canDistribute = hasPermission(permissions, 'reseller.distribute_coins');

  const [reseller, setReseller] = useState<Reseller | null>(null);
  const [ledger, setLedger] = useState<PaginatedList<ResellerLedgerEntry> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api<{ reseller: Reseller }>(`/admin/resellers/${id}`);
      setReseller(r.reseller);
      const l = await api<PaginatedList<ResellerLedgerEntry>>(
        `/admin/resellers/${id}/ledger?page=${page}&limit=20`,
      );
      setLedger(l);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, page]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!reseller) return <ErrorAlert message={error || 'Reseller not found'} />;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={reseller.name}
        subtitle={
          <>
            <code className="text-brand">{reseller.code}</code> · {reseller.country} ·{' '}
            <span>
              pool: {reseller.coinPool.toLocaleString()}
              {reseller.creditLimit > 0 && ` / ${reseller.creditLimit.toLocaleString()}`}
            </span>
          </>
        }
        actions={
          <Button variant="secondary" onClick={() => router.back()}>
            ← Back
          </Button>
        }
      />

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Pool</h3>
          <div className="rounded-lg bg-amber-50 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Coins available</div>
            <div className="mt-1 text-3xl font-bold text-amber-900">
              {reseller.coinPool.toLocaleString()}
            </div>
            {reseller.creditLimit > 0 && (
              <div className="mt-1 text-xs text-amber-700">
                of {reseller.creditLimit.toLocaleString()} cap
              </div>
            )}
          </div>
          <dl className="mt-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-slate-500">Lifetime received</dt>
              <dd className="font-mono">{reseller.lifetimeCoinsReceived.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Lifetime assigned</dt>
              <dd className="font-mono">{reseller.lifetimeCoinsAssigned.toLocaleString()}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Details</h3>
          <dl className="space-y-1.5 text-sm">
            <Row label="Status" value={
              reseller.status === 'active' ? <Badge tone="green">active</Badge>
              : reseller.status === 'suspended' ? <Badge tone="amber">suspended</Badge>
              : <Badge tone="red">terminated</Badge>
            } />
            <Row label="Country" value={reseller.country} />
            <Row label="Commission" value={`${reseller.commissionRate}%`} />
            <Row label="Email" value={reseller.contactEmail || '—'} />
            <Row label="Phone" value={reseller.contactPhone || '—'} />
            <Row label="Created" value={new Date(reseller.createdAt).toLocaleDateString()} />
          </dl>
        </Card>

        <Card>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</h3>
          {canMint && canManage && (
            <TopupForm resellerId={reseller.id} onDone={load} />
          )}
          {canDistribute && (
            <div className="mt-3 border-t border-slate-200 pt-3">
              <AssignForm resellerId={reseller.id} disabled={reseller.coinPool === 0} onDone={load} />
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Pool ledger</h2>
        {!ledger || ledger.items.length === 0 ? (
          <EmptyState message="No pool activity yet." />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Time</Th>
                  <Th>Type</Th>
                  <Th>Direction</Th>
                  <Th>Amount</Th>
                  <Th>Pool after</Th>
                  <Th>Recipient / Reason</Th>
                </tr>
              </thead>
              <tbody>
                {ledger.items.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <Td className="text-xs text-slate-500">
                      {new Date(e.createdAt).toLocaleString()}
                    </Td>
                    <Td>
                      <Badge
                        tone={
                          e.type === 'pool_topup' ? 'green'
                          : e.type === 'assignment' ? 'blue'
                          : e.type === 'pool_clawback' ? 'red'
                          : 'slate'
                        }
                      >
                        {e.type}
                      </Badge>
                    </Td>
                    <Td>
                      {e.direction === 'credit' ? (
                        <span className="font-medium text-green-700">+ credit</span>
                      ) : (
                        <span className="font-medium text-red-700">− debit</span>
                      )}
                    </Td>
                    <Td className="font-mono">{e.amount.toLocaleString()}</Td>
                    <Td className="font-mono text-xs">{e.poolBalanceAfter.toLocaleString()}</Td>
                    <Td className="text-xs">
                      {typeof e.recipientUserId === 'object' && e.recipientUserId ? (
                        <>
                          <span className="font-medium">@{e.recipientUserId.username}</span>
                          {e.reason && <span className="text-slate-500"> — {e.reason}</span>}
                        </>
                      ) : (
                        <span className="text-slate-600">{e.reason || '—'}</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={ledger.page} limit={ledger.limit} total={ledger.total} onPage={setPage} />
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

function TopupForm({ resellerId, onDone }: { resellerId: string; onDone: () => void }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!amount || !reason) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/admin/resellers/${resellerId}/topup`, {
        method: 'POST',
        body: JSON.stringify({ amount: parseInt(amount, 10), reason }),
      });
      setAmount('');
      setReason('');
      onDone();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="text-xs font-semibold text-slate-700">Top up pool (mint)</div>
      <Input
        type="number"
        min={1}
        placeholder="Amount of coins"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Input placeholder="Reason (audit-logged)" value={reason} onChange={(e) => setReason(e.target.value)} />
      {error && <div className="text-xs text-red-600">{error}</div>}
      <Button type="submit" disabled={busy || !amount || !reason} className="w-full">
        {busy ? 'Topping up…' : 'Top up'}
      </Button>
    </form>
  );
}

function AssignForm({
  resellerId,
  disabled,
  onDone,
}: {
  resellerId: string;
  disabled: boolean;
  onDone: () => void;
}) {
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!userId || !amount) return;
    setBusy(true);
    setError(null);
    try {
      // Generate idempotency key client-side
      const idemKey = `assign-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await api(`/admin/resellers/${resellerId}/assign-to-user`, {
        method: 'POST',
        body: JSON.stringify({ userId, amount: parseInt(amount, 10), reason, idempotencyKey: idemKey }),
      });
      setUserId('');
      setAmount('');
      setReason('');
      onDone();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="text-xs font-semibold text-slate-700">Assign coins to user</div>
      <Input
        placeholder="User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        className="font-mono text-xs"
      />
      <Input type="number" min={1} placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <Input placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
      {error && <div className="text-xs text-red-600">{error}</div>}
      <Button type="submit" disabled={disabled || busy || !userId || !amount} className="w-full">
        {busy ? 'Assigning…' : disabled ? 'Pool empty — top up first' : 'Assign coins'}
      </Button>
    </form>
  );
}
