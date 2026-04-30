'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import CosmeticForm from '@/components/cosmetic-form';
import { Button, ErrorAlert, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import type { CosmeticItem } from '@/types';

export default function EditCosmeticPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [item, setItem] = useState<CosmeticItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ item: CosmeticItem }>(`/admin/cosmetics/${id}`);
      setItem(res.item);
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
    if (!confirm('Deactivate this cosmetic? It will be hidden from store + SVIP grants.')) return;
    try {
      await api(`/admin/cosmetics/${id}`, { method: 'DELETE' });
      router.push('/cosmetics');
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!item) return <ErrorAlert message={error || 'Cosmetic not found'} />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={item.name.en}
        subtitle={
          <>
            <code className="text-brand">{item.code}</code> · {item.type.replace(/_/g, ' ')} ·{' '}
            {'★'.repeat(item.rarity)}
          </>
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => router.back()}>
              ← Back
            </Button>
            {item.active && (
              <Button variant="danger" onClick={softDelete}>
                Deactivate
              </Button>
            )}
          </>
        }
      />
      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}
      <CosmeticForm initial={item} onSaved={(c) => setItem(c)} />
    </div>
  );
}
