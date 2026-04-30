'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Badge, Button, EmptyState, ErrorAlert, PageHeader, Table, Td, Th } from '@/components/ui';
import { api } from '@/lib/api';
import { authStorage, hasPermission } from '@/lib/auth';
import type { SvipTier } from '@/types';

export default function SvipTiersPage() {
  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canManage = hasPermission(permissions, 'vip.manage');

  const [tiers, setTiers] = useState<SvipTier[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ items: SvipTier[] }>('/admin/svip/tiers');
      setTiers(res.items);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="SVIP Tiers"
        subtitle="Levels 1–9. Each tier has monthly-points to qualify, a coin reward on first reach, a set of identity items, and privileges that flag user behavior."
        actions={canManage && <Button href="/svip/new">+ New Tier</Button>}
      />

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading…
        </div>
      ) : !tiers || tiers.length === 0 ? (
        <EmptyState message="No SVIP tiers configured. Create SVIP 1 first, then build up to SVIP 9." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Level</Th>
              <Th>Icon</Th>
              <Th>Name</Th>
              <Th>Monthly points</Th>
              <Th>Coin reward</Th>
              <Th>Items</Th>
              <Th>Privileges</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t) => (
              <tr key={t.id} className="cursor-pointer hover:bg-slate-50">
                <Td>
                  <Link href={`/svip/${t.id}`}>
                    <Badge tone="brand">SVIP {t.level}</Badge>
                  </Link>
                </Td>
                <Td>
                  <Link href={`/svip/${t.id}`}>
                    {t.iconUrl ? (
                      <img src={t.iconUrl} alt="" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-slate-100" />
                    )}
                  </Link>
                </Td>
                <Td className="font-medium">{t.name}</Td>
                <Td className="font-mono text-xs">{t.monthlyPointsRequired.toLocaleString()}</Td>
                <Td className="font-mono text-xs text-amber-700">
                  {t.coinReward > 0 ? t.coinReward.toLocaleString() : '—'}
                </Td>
                <Td className="text-xs">{t.grantedItemIds.length}</Td>
                <Td className="text-xs">{t.privileges.length}</Td>
                <Td>
                  {t.active ? <Badge tone="green">active</Badge> : <Badge tone="amber">inactive</Badge>}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
