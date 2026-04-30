'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import GiftForm from '@/components/gift-form';
import { Badge, Button, Card, ErrorAlert, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { authStorage, hasPermission } from '@/lib/auth';
import type { Gift } from '@/types';

export default function GiftDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canManage = hasPermission(permissions, 'gifts.manage');

  const [gift, setGift] = useState<Gift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ gift: Gift }>(`/admin/gifts/${id}`)
      .then((r) => setGift(r.gift))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function softDelete() {
    if (!confirm('Deactivate this gift? Existing gift sends remain in the ledger.')) return;
    try {
      await api(`/admin/gifts/${id}`, { method: 'DELETE' });
      router.replace('/gifts');
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!gift) return <ErrorAlert message={error || 'Gift not found'} />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={gift.name.en}
        subtitle={
          <>
            <code className="text-brand">{gift.code}</code> ·{' '}
            <span>{gift.priceCoins}c → {gift.diamondReward}d</span> ·{' '}
            <span>{gift.totalSent} sent</span>
          </>
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => router.back()}>
              ← Back
            </Button>
            {canManage && !gift.active && (
              <Button variant="danger" onClick={softDelete}>
                Deactivate
              </Button>
            )}
          </>
        }
      />

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      <Card className="mb-6">
        <div className="flex items-start gap-4">
          {gift.thumbnailUrl && (
            <img src={gift.thumbnailUrl} alt="" className="h-24 w-24 rounded-lg object-cover ring-1 ring-slate-200" />
          )}
          <div className="flex-1 space-y-2 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge tone={gift.active ? 'green' : 'slate'}>{gift.active ? 'active' : 'inactive'}</Badge>
              <Badge tone="brand">{gift.category}</Badge>
              {gift.featured && <Badge tone="amber">featured</Badge>}
              {gift.vipOnly && <Badge tone="brand">VIP only</Badge>}
              {gift.svipOnly && <Badge tone="brand">SVIP only</Badge>}
              {gift.countries.length > 0 && <Badge tone="blue">countries: {gift.countries.join(',')}</Badge>}
            </div>
            <div className="text-slate-600">
              <strong>Combo:</strong> {gift.comboMultipliers.join(', ')}
            </div>
            <div className="text-slate-600">
              <strong>Lifetime collected:</strong> {gift.totalCoinsCollected.toLocaleString()} coins
            </div>
          </div>
        </div>
      </Card>

      {canManage ? (
        <GiftForm initial={gift} onSaved={(g) => setGift(g)} />
      ) : (
        <Card>
          <pre className="overflow-auto text-xs">{JSON.stringify(gift, null, 2)}</pre>
        </Card>
      )}
    </div>
  );
}
