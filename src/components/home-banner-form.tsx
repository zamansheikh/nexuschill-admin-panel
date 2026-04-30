'use client';

import { FormEvent, useState } from 'react';

import { Button, Card, ErrorAlert, Field, Input, Select } from '@/components/ui';
import { api } from '@/lib/api';
import type { BannerLinkKind, HomeBanner } from '@/types';

interface Props {
  initial?: HomeBanner;
  onSaved: (b: HomeBanner) => void;
}

const LINK_KINDS: { value: BannerLinkKind; label: string; hint: string }[] = [
  { value: 'none', label: 'None — visual only', hint: 'Banner is non-interactive.' },
  { value: 'route', label: 'In-app route', hint: 'e.g. /svip, /store, /inventory' },
  { value: 'room', label: 'Live room', hint: 'Room id (joined when tapped)' },
  { value: 'user', label: 'User profile', hint: '7-digit numeric ID' },
  { value: 'web', label: 'Web URL', hint: 'https://… opened in in-app browser' },
  { value: 'event', label: 'Event/promo id', hint: 'Handled by mobile event router' },
];

export default function HomeBannerForm({ initial, onSaved }: Props) {
  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [imagePublicId, setImagePublicId] = useState(initial?.imagePublicId ?? '');
  const [linkKind, setLinkKind] = useState<BannerLinkKind>(initial?.linkKind ?? 'none');
  const [linkValue, setLinkValue] = useState(initial?.linkValue ?? '');
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [active, setActive] = useState(initial?.active ?? true);
  const [startDate, setStartDate] = useState(initial?.startDate?.slice(0, 10) ?? '');
  const [endDate, setEndDate] = useState(initial?.endDate?.slice(0, 10) ?? '');
  const [countries, setCountries] = useState((initial?.countries ?? []).join(','));

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
        subtitle,
        imageUrl,
        imagePublicId,
        linkKind,
        linkValue,
        sortOrder: parseInt(sortOrder, 10) || 0,
        active,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        countries: countries
          .split(',')
          .map((c) => c.trim().toUpperCase())
          .filter(Boolean),
      };
      const res = isEdit
        ? await api<{ banner: HomeBanner }>(`/admin/banners/home/${initial!.id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          })
        : await api<{ banner: HomeBanner }>('/admin/banners/home', {
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
            Banner image
          </h3>
          <div className="flex items-start gap-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="h-24 w-44 rounded-lg border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-24 w-44 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
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
              <p className="text-xs text-slate-500">
                Aim for ~16:9 wide images. {uploading && 'Uploading…'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Title (admin label)">
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Subtitle (optional)">
            <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Link kind" hint={LINK_KINDS.find((k) => k.value === linkKind)?.hint}>
            <Select
              value={linkKind}
              onChange={(e) => setLinkKind(e.target.value as BannerLinkKind)}
            >
              {LINK_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Link value" hint={linkKind === 'none' ? 'Not used.' : undefined}>
            <Input
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              disabled={linkKind === 'none'}
              placeholder={linkKind === 'route' ? '/svip' : ''}
            />
          </Field>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <Field label="Sort order" hint="Higher = first">
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
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

        <Field label="Countries (comma-separated, ISO-2)" hint="Empty = visible everywhere.">
          <Input
            value={countries}
            onChange={(e) => setCountries(e.target.value)}
            placeholder="BD,IN,PK"
          />
        </Field>

        {error && <ErrorAlert message={error} />}

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={saving || !imageUrl}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create banner'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
