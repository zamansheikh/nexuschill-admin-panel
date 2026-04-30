'use client';

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
import type { Moment, MomentStatus, PaginatedList } from '@/types';

export default function MomentsPage() {
  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canModerate = hasPermission(permissions, 'moments.moderate');

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<MomentStatus | ''>('');
  const [data, setData] = useState<PaginatedList<Moment> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) params.set('status', status);
      const res = await api<PaginatedList<Moment>>(
        `/admin/moments?${params.toString()}`,
      );
      setData(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(m: Moment) {
    const reason = prompt('Reason for removal (visible to author appeal):');
    if (!reason || reason.trim().length < 3) return;
    setBusyId(m.id);
    try {
      await api(`/admin/moments/${m.id}/remove`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason.trim() }),
      });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function restore(m: Moment) {
    setBusyId(m.id);
    try {
      await api(`/admin/moments/${m.id}/restore`, { method: 'POST' });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  function authorLabel(m: Moment) {
    const a = m.authorId;
    if (typeof a === 'string') return a;
    return a.displayName || a.username || a.id;
  }

  function authorIdLabel(m: Moment) {
    const a = m.authorId;
    if (typeof a === 'string') return null;
    return a.numericId;
  }

  return (
    <div>
      <PageHeader
        title="Moments"
        subtitle="Posts in the social feed. Removed posts are hidden from users but kept for audit/appeal."
      />

      <div className="mb-4 flex gap-3">
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as MomentStatus | '');
            setPage(1);
          }}
          className="w-48"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="removed">Removed</option>
          <option value="deleted">Deleted by author</option>
        </Select>
      </div>

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading…
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState message="No moments yet." />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Author</Th>
                <Th>Text</Th>
                <Th>Media</Th>
                <Th>Likes</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <Td>
                    <div className="font-medium text-slate-900">{authorLabel(m)}</div>
                    {authorIdLabel(m) != null && (
                      <code className="text-xs text-slate-500">
                        ID {authorIdLabel(m)}
                      </code>
                    )}
                  </Td>
                  <Td className="max-w-md">
                    <div className="line-clamp-3 text-sm text-slate-700">
                      {m.text || <span className="italic text-slate-400">(no text)</span>}
                    </div>
                  </Td>
                  <Td>
                    {m.media.length === 0 ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : (
                      <div className="flex gap-1">
                        {m.media.slice(0, 4).map((piece, i) => (
                          <img
                            key={i}
                            src={piece.url}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
                        ))}
                        {m.media.length > 4 && (
                          <span className="ml-1 text-xs text-slate-500">
                            +{m.media.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </Td>
                  <Td className="text-xs">{m.likeCount}</Td>
                  <Td>
                    {m.status === 'active' && <Badge tone="green">active</Badge>}
                    {m.status === 'removed' && <Badge tone="red">removed</Badge>}
                    {m.status === 'deleted' && <Badge tone="amber">deleted</Badge>}
                  </Td>
                  <Td className="text-xs text-slate-500">
                    {new Date(m.createdAt).toLocaleString()}
                  </Td>
                  <Td>
                    {canModerate && m.status === 'active' && (
                      <button
                        onClick={() => remove(m)}
                        disabled={busyId === m.id}
                        className="text-xs text-red-600 hover:underline disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                    {canModerate && m.status === 'removed' && (
                      <button
                        onClick={() => restore(m)}
                        disabled={busyId === m.id}
                        className="text-xs text-emerald-600 hover:underline disabled:opacity-50"
                      >
                        Restore
                      </button>
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
