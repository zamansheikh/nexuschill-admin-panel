'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import HomeBannerForm from '@/components/home-banner-form';
import { Button, ErrorAlert, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import type { HomeBanner } from '@/types';

export default function EditHomeBannerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [banner, setBanner] = useState<HomeBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ banner: HomeBanner }>(`/admin/banners/home/${id}`);
      setBanner(res.banner);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function onDelete() {
    if (!confirm('Delete this banner permanently? The image will also be removed from Cloudinary.')) return;
    try {
      await api(`/admin/banners/home/${id}`, { method: 'DELETE' });
      router.push('/banners');
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!banner) return <ErrorAlert message={error || 'Banner not found'} />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={banner.title}
        subtitle={banner.subtitle || 'Home banner'}
        actions={
          <>
            <Button variant="secondary" onClick={() => router.back()}>
              ← Back
            </Button>
            <Button variant="danger" onClick={onDelete}>
              Delete
            </Button>
          </>
        }
      />
      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}
      <HomeBannerForm initial={banner} onSaved={(b) => setBanner(b)} />
    </div>
  );
}
