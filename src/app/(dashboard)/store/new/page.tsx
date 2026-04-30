'use client';

import { useRouter } from 'next/navigation';

import StoreListingForm from '@/components/store-listing-form';
import { Button, PageHeader } from '@/components/ui';

export default function NewStoreListingPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New store listing"
        subtitle="Pick a cosmetic, set the price + rental duration, and toggle the flags."
        actions={
          <Button variant="secondary" onClick={() => router.back()}>
            ← Back
          </Button>
        }
      />
      <StoreListingForm onSaved={() => router.push('/store')} />
    </div>
  );
}
