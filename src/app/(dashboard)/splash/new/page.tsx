'use client';

import { useRouter } from 'next/navigation';

import SplashBannerForm from '@/components/splash-banner-form';
import { Button, PageHeader } from '@/components/ui';

export default function NewSplashBannerPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New splash banner"
        subtitle="Upload a portrait splash image. Mobile clients pre-fetch and cache the highest-priority active splash for next launch."
        actions={
          <Button variant="secondary" onClick={() => router.back()}>
            ← Back
          </Button>
        }
      />
      <SplashBannerForm onSaved={() => router.push('/splash')} />
    </div>
  );
}
