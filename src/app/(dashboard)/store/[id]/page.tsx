'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import StoreListingForm from '@/components/store-listing-form';
import { Badge, Button, ErrorAlert, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import type { CosmeticItem, StoreListing } from '@/types';

export default function EditStoreListingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [listing, setListing] = useState<StoreListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ listing: StoreListing }>(`/admin/store/listings/${id}`);
      setListing(res.listing);
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
    if (!confirm('Deactivate this store listing? Users will no longer see it for purchase.')) return;
    try {
      await api(`/admin/store/listings/${id}`, { method: 'DELETE' });
      router.push('/store');
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!listing) return <ErrorAlert message={error || 'Listing not found'} />;

  const item =
    typeof listing.cosmeticItemId === 'string' ? null : (listing.cosmeticItemId as CosmeticItem);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={item?.name?.en || 'Store listing'}
        subtitle={
          <>
            <Badge tone="brand">{listing.category}</Badge>
            {' · '}
            {listing.priceCoins.toLocaleString()} coins ·{' '}
            {listing.durationDays > 0 ? `${listing.durationDays} days` : 'permanent'}
          </>
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => router.back()}>
              ← Back
            </Button>
            {listing.active && (
              <Button variant="danger" onClick={softDelete}>
                Deactivate
              </Button>
            )}
          </>
        }
      />
      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}
      <StoreListingForm initial={listing} onSaved={(l) => setListing(l)} />
    </div>
  );
}
