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

  async function deactivate() {
    if (!confirm('Deactivate this gift? Existing gift sends remain in the ledger and the gift can be reactivated later.')) return;
    try {
      await api(`/admin/gifts/${id}`, { method: 'DELETE' });
      // Backend keeps the row, just flips active=false. Reflect that
      // locally so the admin can flip back to "Reactivate" without a
      // round-trip.
      setGift((g) => (g ? { ...g, active: false } : g));
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function reactivate() {
    try {
      const res = await api<{ gift: Gift }>(`/admin/gifts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: true }),
      });
      setGift(res.gift);
    } catch (e: any) {
      setError(e.message);
    }
  }

  /// Hard delete. /purge for never-sent gifts (clean), /force for
  /// gifts with sends (cascades GiftEvent rows so nothing else is left
  /// pointing at a missing Gift). The gift detail page redirects back
  /// to the list either way, so feedback is just a confirm + alert.
  async function deletePermanently() {
    if (!gift) return;
    const hasSends = gift.totalSent > 0;
    const confirmMsg = hasSends
      ? `Permanently delete this gift?\n\nIt has been sent ${gift.totalSent} time(s). Continuing will ALSO delete every gift-history record (sent / received) referencing it, plus its Cloudinary assets.\n\nFinancial transaction logs are kept. Cannot be undone.`
      : 'Permanently delete this gift? This removes it from the catalog along with its Cloudinary assets. Cannot be undone.';
    if (!confirm(confirmMsg)) return;
    try {
      const path = hasSends
        ? `/admin/gifts/${id}/force`
        : `/admin/gifts/${id}/purge`;
      const res = await api<{ success: boolean; deletedEvents?: number }>(path, {
        method: 'DELETE',
      });
      if (hasSends && res.deletedEvents) {
        alert(`Deleted gift and ${res.deletedEvents} associated history record(s).`);
      }
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
            {canManage && gift.active && (
              <Button variant="danger" onClick={deactivate}>
                Deactivate
              </Button>
            )}
            {canManage && !gift.active && (
              <Button variant="secondary" onClick={reactivate}>
                Reactivate
              </Button>
            )}
            {canManage && (
              // Hard delete always available; the handler routes to
              // /purge (zero sends) or /force (cascades GiftEvent rows)
              // based on totalSent so we never leave orphan refs.
              <Button variant="danger" onClick={deletePermanently}>
                Delete permanently
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
