'use client';

import { useRouter } from 'next/navigation';

import CosmeticForm from '@/components/cosmetic-form';
import { Button, PageHeader } from '@/components/ui';

export default function NewCosmeticPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New cosmetic"
        subtitle="Add an item to the master catalog. Once saved, you can attach it to an SVIP tier or list it in the store."
        actions={
          <Button variant="secondary" onClick={() => router.back()}>
            ← Back
          </Button>
        }
      />
      <CosmeticForm onSaved={() => router.push('/cosmetics')} />
    </div>
  );
}
