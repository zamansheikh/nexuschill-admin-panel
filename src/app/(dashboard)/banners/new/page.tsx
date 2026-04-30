'use client';

import { useRouter } from 'next/navigation';

import HomeBannerForm from '@/components/home-banner-form';
import { Button, PageHeader } from '@/components/ui';

export default function NewHomeBannerPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New home banner"
        subtitle="Upload an image, choose what tapping does, and set the active window."
        actions={
          <Button variant="secondary" onClick={() => router.back()}>
            ← Back
          </Button>
        }
      />
      <HomeBannerForm onSaved={() => router.push('/banners')} />
    </div>
  );
}
