'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorAlert,
  PageHeader,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { api } from '@/lib/api';
import { authStorage, hasPermission } from '@/lib/auth';
import type {
  Family,
  FamilyMember,
  FamilyStatus,
  PaginatedList,
} from '@/types';

const STATUS_TONE: Record<FamilyStatus, 'green' | 'amber' | 'red'> = {
  active: 'green',
  frozen: 'amber',
  disbanded: 'red',
};

const ROLE_TONE: Record<FamilyMember['role'], 'brand' | 'blue' | 'slate'> = {
  leader: 'brand',
  co_leader: 'blue',
  member: 'slate',
};

export default function FamilyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canManage = hasPermission(permissions, 'family.manage');

  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<PaginatedList<FamilyMember> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [familyRes, membersRes] = await Promise.all([
          api<{ family: Family }>(`/admin/families/${id}`),
          api<PaginatedList<FamilyMember>>(`/admin/families/${id}/members?limit=200`),
        ]);
        if (cancelled) return;
        setFamily(familyRes.family);
        setMembers(membersRes);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  /// Status changes use the same admin endpoint with different payloads.
  /// Disband is destructive (detaches every member); freeze just blocks
  /// new joins; unfreeze restores active.
  async function setStatus(status: FamilyStatus) {
    if (!family) return;
    if (status === 'disbanded') {
      const ok = confirm(
        `Force-disband "${family.name}"?\n\nAll ${family.memberCount} member(s) will be removed. The family record stays in the database for audit. This cannot be undone.`,
      );
      if (!ok) return;
    }
    try {
      const res = await api<{ family: Family }>(`/admin/families/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setFamily(res.family);
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!family) return <ErrorAlert message={error || 'Family not found'} />;

  const leaderMember = members?.items.find((m) => m.role === 'leader');
  const coLeaders = members?.items.filter((m) => m.role === 'co_leader') ?? [];
  const regulars = members?.items.filter((m) => m.role === 'member') ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={family.name}
        subtitle={
          <>
            {family.numericId && (
              <code className="text-brand">#{family.numericId}</code>
            )}{' '}
            · Lv.{family.level} · {family.memberCount} member(s) ·{' '}
            <span className="capitalize">{family.joinMode.replace('_', ' ')}</span>
          </>
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => router.back()}>
              ← Back
            </Button>
            {canManage && family.status === 'active' && (
              <>
                <Button variant="secondary" onClick={() => setStatus('frozen')}>
                  Freeze
                </Button>
                <Button variant="danger" onClick={() => setStatus('disbanded')}>
                  Force disband
                </Button>
              </>
            )}
            {canManage && family.status === 'frozen' && (
              <Button variant="primary" onClick={() => setStatus('active')}>
                Unfreeze
              </Button>
            )}
          </>
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorAlert message={error} />
        </div>
      )}

      <Card className="mb-6">
        <div className="flex items-start gap-4">
          {family.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={family.coverUrl}
              alt=""
              className="h-24 w-24 rounded-lg object-cover ring-1 ring-slate-200"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-brand-50 text-3xl text-brand-700">
              ✦
            </div>
          )}
          <div className="flex-1 space-y-2 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge tone={STATUS_TONE[family.status]}>{family.status}</Badge>
              <Badge tone="brand">Lv.{family.level}</Badge>
              <Badge tone="slate">join level {family.joinLevelRequirement}</Badge>
              {family.creationFeePaid > 0 && (
                <Badge tone="slate">
                  paid {family.creationFeePaid.toLocaleString()} coins
                </Badge>
              )}
              {family.creationFeePaid === 0 && <Badge tone="green">SVIP4+ free</Badge>}
            </div>
            {family.notification && (
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-slate-700">
                <span className="text-xs font-semibold text-slate-500">
                  ANNOUNCEMENT
                </span>
                <div className="mt-1 whitespace-pre-wrap">{family.notification}</div>
              </div>
            )}
            <div className="text-xs text-slate-500">
              Created {new Date(family.createdAt).toLocaleString()}
              {family.soloSince && (
                <>
                  {' · '}
                  <span className="text-amber-700">
                    solo since {new Date(family.soloSince).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      <h2 className="mb-3 text-sm font-semibold text-slate-700">Members</h2>
      {!members || members.items.length === 0 ? (
        <EmptyState message="No members." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Role</Th>
              <Th>User</Th>
              <Th>Joined</Th>
            </tr>
          </thead>
          <tbody>
            {[leaderMember, ...coLeaders, ...regulars]
              .filter((m): m is FamilyMember => !!m)
              .map((m) => {
                const u = typeof m.userId === 'object' ? m.userId : null;
                return (
                  <tr key={m.id}>
                    <Td>
                      <Badge tone={ROLE_TONE[m.role]}>
                        {m.role.replace('_', ' ')}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="font-medium text-slate-900">
                        {u?.displayName || u?.username || (typeof m.userId === 'string' ? m.userId : '—')}
                      </div>
                      {u?.numericId && (
                        <div className="text-xs text-slate-500">#{u.numericId}</div>
                      )}
                    </Td>
                    <Td className="text-xs text-slate-500">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </Td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
