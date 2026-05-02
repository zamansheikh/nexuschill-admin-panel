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
import type { MagicBallTask, MagicBallTaskKind, PaginatedList } from '@/types';

const KIND_LABEL: Record<MagicBallTaskKind, string> = {
  mic_minutes: 'On mic — minutes',
  invites_completed: 'Invites accepted',
  gifts_sent: 'Gifts sent',
  gifts_received: 'Gifts received',
  chat_messages: 'Chat messages',
  room_visitors: 'Room visitors',
};

export default function MagicBallPage() {
  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canManage = hasPermission(permissions, 'magic_ball.manage');

  const [page, setPage] = useState(1);
  const [active, setActive] = useState('');
  const [kind, setKind] = useState<MagicBallTaskKind | ''>('');
  const [data, setData] = useState<PaginatedList<MagicBallTask> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (active) params.set('active', active);
      if (kind) params.set('kind', kind);
      const res = await api<PaginatedList<MagicBallTask>>(
        `/admin/magic-ball/tasks?${params.toString()}`,
      );
      setData(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, active, kind]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Magic Ball — Daily Tasks"
        subtitle="Per-day quests hosts complete inside audio rooms. Counters reset at 00:00 UTC+5:30 every night; rewards credit to the host's coin wallet on claim."
        actions={canManage && <Button href="/magic-ball/new">+ New task</Button>}
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          value={active}
          onChange={(e) => {
            setActive(e.target.value);
            setPage(1);
          }}
          className="w-44"
        >
          <option value="">All statuses</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </Select>
        <Select
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as MagicBallTaskKind | '');
            setPage(1);
          }}
          className="w-56"
        >
          <option value="">All kinds</option>
          {Object.entries(KIND_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
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
        <EmptyState message="No Magic Ball tasks yet." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Label</Th>
                <Th>Kind</Th>
                <Th>Goal</Th>
                <Th>Reward</Th>
                <Th>Sort</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((t) => (
                <tr key={t.id} className="cursor-pointer hover:bg-slate-50">
                  <Td>
                    <Link href={`/magic-ball/${t.id}`}>
                      <div className="font-medium text-slate-900">{t.label}</div>
                    </Link>
                  </Td>
                  <Td className="text-xs">
                    <Badge tone="brand">{KIND_LABEL[t.kind]}</Badge>
                  </Td>
                  <Td className="text-xs">{t.goal}</Td>
                  <Td className="text-xs">+{t.rewardCoins.toLocaleString()} coins</Td>
                  <Td className="text-xs">{t.sortOrder}</Td>
                  <Td>
                    {t.active ? (
                      <Badge tone="green">active</Badge>
                    ) : (
                      <Badge tone="amber">inactive</Badge>
                    )}
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
