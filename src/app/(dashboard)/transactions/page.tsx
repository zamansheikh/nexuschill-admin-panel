'use client';

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
import type {
  Currency,
  PaginatedList,
  Transaction,
  TxnDirection,
  TxnType,
} from '@/types';

const TXN_TYPES: TxnType[] = [
  'recharge',
  'recharge_bonus',
  'gift_send',
  'gift_receive',
  'withdrawal',
  'admin_credit',
  'admin_debit',
  'event_reward',
  'referral_bonus',
  'task_reward',
  'refund',
];

const TYPE_TONES: Partial<Record<TxnType, 'green' | 'red' | 'amber' | 'brand' | 'blue' | 'slate'>> = {
  recharge: 'green',
  recharge_bonus: 'green',
  gift_send: 'amber',
  gift_receive: 'brand',
  withdrawal: 'red',
  admin_credit: 'blue',
  admin_debit: 'amber',
  event_reward: 'brand',
  referral_bonus: 'brand',
  task_reward: 'brand',
  refund: 'slate',
};

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState('');
  const [userIdInput, setUserIdInput] = useState('');
  const [currency, setCurrency] = useState<Currency | ''>('');
  const [type, setType] = useState<TxnType | ''>('');
  const [direction, setDirection] = useState<TxnDirection | ''>('');

  const [data, setData] = useState<PaginatedList<Transaction> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (userId) params.set('userId', userId);
      if (currency) params.set('currency', currency);
      if (type) params.set('type', type);
      if (direction) params.set('direction', direction);
      const res = await api<PaginatedList<Transaction>>(`/admin/transactions?${params.toString()}`);
      setData(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, userId, currency, type, direction]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Append-only ledger across all wallets. Every coin & diamond movement is recorded here."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setUserId(userIdInput);
          }}
          className="col-span-2"
        >
          <Input
            placeholder="Filter by user ID"
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
          />
        </form>
        <Select
          value={currency}
          onChange={(e) => {
            setCurrency(e.target.value as Currency | '');
            setPage(1);
          }}
        >
          <option value="">All currencies</option>
          <option value="coins">Coins</option>
          <option value="diamonds">Diamonds</option>
        </Select>
        <Select
          value={type}
          onChange={(e) => {
            setType(e.target.value as TxnType | '');
            setPage(1);
          }}
        >
          <option value="">All types</option>
          {TXN_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Select
          value={direction}
          onChange={(e) => {
            setDirection(e.target.value as TxnDirection | '');
            setPage(1);
          }}
        >
          <option value="">Both directions</option>
          <option value="credit">Credit (+)</option>
          <option value="debit">Debit (−)</option>
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
        <EmptyState message="No transactions match your filters." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Time</Th>
                <Th>Type</Th>
                <Th>User</Th>
                <Th>Direction</Th>
                <Th>Amount</Th>
                <Th>Balance after</Th>
                <Th>Description</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <Td className="text-xs text-slate-500">
                    {new Date(t.createdAt).toLocaleString()}
                  </Td>
                  <Td>
                    <Badge tone={TYPE_TONES[t.type] || 'slate'}>{t.type}</Badge>
                  </Td>
                  <Td className="font-mono text-xs">{t.userId.slice(-8)}</Td>
                  <Td>
                    {t.direction === 'credit' ? (
                      <span className="font-medium text-green-700">+ credit</span>
                    ) : (
                      <span className="font-medium text-red-700">− debit</span>
                    )}
                  </Td>
                  <Td>
                    <span className="font-mono">
                      {t.amount} {t.currency}
                    </span>
                  </Td>
                  <Td className="font-mono text-xs text-slate-600">
                    {t.balanceAfter} {t.currency}
                  </Td>
                  <Td className="text-xs text-slate-600">{t.description || '—'}</Td>
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
