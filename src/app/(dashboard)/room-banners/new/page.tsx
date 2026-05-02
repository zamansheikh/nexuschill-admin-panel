'use client';

import { useRouter } from 'next/navigation';

import RoomBannerForm from '@/components/room-banner-form';
import { Button, PageHeader } from '@/components/ui';

export default function NewRoomBannerPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New room banner"
        subtitle="Upload an image, pick which slot it rotates in, and set the active window."
        actions={
          <Button variant="secondary" onClick={() => router.back()}>
            ← Back
          </Button>
        }
      />
      <RoomBannerForm onSaved={() => router.push('/room-banners')} />
    </div>
  );
}
