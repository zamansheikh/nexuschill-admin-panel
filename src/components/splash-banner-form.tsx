'use client';

import { FormEvent, useState } from 'react';

import { Button, Card, ErrorAlert, Field, Input, Select } from '@/components/ui';
import { api } from '@/lib/api';
import type { SplashBanner } from '@/types';

interface Props {
  initial?: SplashBanner;
  onSaved: (b: SplashBanner) => void;
}

export default function SplashBannerForm({ initial, onSaved }: Props) {
  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [imagePublicId, setImagePublicId] = useState(initial?.imagePublicId ?? '');
  const [priority, setPriority] = useState(String(initial?.priority ?? 0));
  const [active, setActive] = useState(initial?.active ?? true);
  const [startDate, setStartDate] = useState(initial?.startDate?.slice(0, 10) ?? '');
  const [endDate, setEndDate] = useState(initial?.endDate?.slice(0, 10) ?? '');

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadImage(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api<{ url: string; publicId: string }>(
        '/admin/banners/upload/image',
        { method: 'POST', body: fd },
      );
      setImageUrl(res.url);
      setImagePublicId(res.publicId);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        title,
        imageUrl,
        imagePublicId,
        priority: parseInt(priority, 10) || 0,
        active,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const res = isEdit
        ? await api<{ banner: SplashBanner }>(`/admin/banners/splash/${initial!.id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          })
        : await api<{ banner: SplashBanner }>('/admin/banners/splash', {
            method: 'POST',
            body: JSON.stringify(body),
          });
      onSaved(res.banner);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="rounded-lg border border-slate-200 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Splash image
          </h3>
          <p className="mb-3 text-xs text-slate-500">
            Use a portrait image (~9:16). Mobile clients pre-fetch the highest-priority
            active splash and cache it locally — the banner shows on the user's <em>next</em>{' '}
            cold launch, not the current one.
          </p>
          <div className="flex items-start gap-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="h-44 w-24 rounded-lg border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-44 w-24 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
                No image
              </div>
            )}
            <div className="flex-1 space-y-2">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f);
                  e.target.value = '';
                }}
                className="block w-full text-sm"
              />
              {uploading && <p className="text-xs text-slate-500">Uploading…</p>}
            </div>
          </div>
        </div>

        <Field label="Title (admin label)">
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>

        <div className="grid grid-cols-4 gap-3">
          <Field label="Priority" hint="Higher beats lower when multiple are active">
            <Input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} />
          </Field>
          <Field label="Active">
            <Select
              value={active ? 'true' : 'false'}
              onChange={(e) => setActive(e.target.value === 'true')}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </Field>
          <Field label="Start date">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="End date">
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </div>

        {error && <ErrorAlert message={error} />}

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={saving || !imageUrl}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create splash'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
