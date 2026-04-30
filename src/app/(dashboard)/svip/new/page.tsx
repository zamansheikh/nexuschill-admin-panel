'use client';

import { useRouter } from 'next/navigation';

import SvipTierForm from '@/components/svip-tier-form';
import { Button, PageHeader } from '@/components/ui';

export default function NewSvipTierPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="New SVIP tier"
        subtitle="Configure a level (1–9), pick the cosmetics it grants, and check the privileges it unlocks."
        actions={
          <Button variant="secondary" onClick={() => router.back()}>
            ← Back
          </Button>
        }
      />
      <SvipTierForm onSaved={() => router.push('/svip')} />
    </div>
  );
}
