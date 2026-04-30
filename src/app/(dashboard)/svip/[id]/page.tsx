'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import SvipTierForm from '@/components/svip-tier-form';
import { Badge, Button, ErrorAlert, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import type { SvipTier } from '@/types';

export default function EditSvipTierPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [tier, setTier] = useState<SvipTier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ tier: SvipTier }>(`/admin/svip/tiers/${id}`);
      setTier(res.tier);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function softDelete() {
    if (!confirm('Deactivate this SVIP tier? Users currently at this level will no longer receive its privileges.')) return;
    try {
      await api(`/admin/svip/tiers/${id}`, { method: 'DELETE' });
      router.push('/svip');
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!tier) return <ErrorAlert message={error || 'SVIP tier not found'} />;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={tier.name}
        subtitle={
          <>
            <Badge tone="brand">SVIP {tier.level}</Badge>
            {' · '}
            <span>monthly: {tier.monthlyPointsRequired.toLocaleString()}</span>
            {tier.coinReward > 0 && (
              <> · <span>reward: {tier.coinReward.toLocaleString()} coins</span></>
            )}
          </>
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => router.back()}>
              ← Back
            </Button>
            {tier.active && (
              <Button variant="danger" onClick={softDelete}>
                Deactivate
              </Button>
            )}
          </>
        }
      />
      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}
      <SvipTierForm initial={tier} onSaved={(t) => setTier(t)} />
    </div>
  );
}
