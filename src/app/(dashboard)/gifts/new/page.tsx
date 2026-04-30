'use client';

import { useRouter } from 'next/navigation';

import GiftForm from '@/components/gift-form';
import { PageHeader } from '@/components/ui';

export default function NewGiftPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Create Gift" subtitle="Add a new gift to the catalog" />
      <GiftForm onSaved={() => router.replace('/gifts')} />
    </div>
  );
}
