'use client';

import { FormEvent, useState } from 'react';

import { Button, Card, ErrorAlert, Field, Input, Select, Textarea } from '@/components/ui';
import { api } from '@/lib/api';
import type { CosmeticAssetType, CosmeticItem, CosmeticType } from '@/types';

interface Props {
  initial?: CosmeticItem;
  onSaved: (c: CosmeticItem) => void;
}

const TYPES: CosmeticType[] = [
  'frame',
  'vehicle',
  'theme',
  'ring',
  'medal',
  'title',
  'room_card',
  'room_chat_bubble',
  'room_list_border',
  'mic_wave',
  'mic_skin',
  'special_gift_notification',
  'profile_background',
  'ludo_dice_skin',
  'dynamic_avatar',
];

export default function CosmeticForm({ initial, onSaved }: Props) {
  const isEdit = !!initial;

  const [nameEn, setNameEn] = useState(initial?.name?.en ?? '');
  const [nameBn, setNameBn] = useState(initial?.name?.bn ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [descEn, setDescEn] = useState(initial?.description?.en ?? '');
  const [descBn, setDescBn] = useState(initial?.description?.bn ?? '');
  const [type, setType] = useState<CosmeticType>(initial?.type ?? 'frame');
  const [rarity, setRarity] = useState(String(initial?.rarity ?? 3));
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [active, setActive] = useState(initial?.active ?? true);

  const [previewUrl, setPreviewUrl] = useState(initial?.previewUrl ?? '');
  const [previewPublicId, setPreviewPublicId] = useState(initial?.previewPublicId ?? '');
  const [assetUrl, setAssetUrl] = useState(initial?.assetUrl ?? '');
  const [assetPublicId, setAssetPublicId] = useState(initial?.assetPublicId ?? '');
  const [assetType, setAssetType] = useState<CosmeticAssetType>(initial?.assetType ?? 'none');

  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadPreview(file: File) {
    setUploadingPreview(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api<{ url: string; publicId: string }>(
        '/admin/cosmetics/upload/preview',
        { method: 'POST', body: fd },
      );
      setPreviewUrl(res.url);
      setPreviewPublicId(res.publicId);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploadingPreview(false);
    }
  }

  async function uploadAsset(file: File) {
    setUploadingAsset(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api<{ url: string; publicId: string; assetType: CosmeticAssetType }>(
        '/admin/cosmetics/upload/asset',
        { method: 'POST', body: fd },
      );
      setAssetUrl(res.url);
      setAssetPublicId(res.publicId);
      setAssetType(res.assetType);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploadingAsset(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: { en: nameEn, ...(nameBn && { bn: nameBn }) },
        code: code.toUpperCase(),
        description: { en: descEn, ...(descBn && { bn: descBn }) },
        type,
        previewUrl,
        previewPublicId,
        assetUrl,
        assetPublicId,
        assetType,
        rarity: parseInt(rarity, 10),
        sortOrder: parseInt(sortOrder, 10) || 0,
        active,
      };

      const res = isEdit
        ? await api<{ item: CosmeticItem }>(`/admin/cosmetics/${initial!.id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          })
        : await api<{ item: CosmeticItem }>('/admin/cosmetics', {
            method: 'POST',
            body: JSON.stringify(body),
          });
      onSaved(res.item);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name (English)">
            <Input required value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          </Field>
          <Field label="Name (Bangla, optional)">
            <Input value={nameBn} onChange={(e) => setNameBn(e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Code (unique)" hint="UPPERCASE letters/digits/_-">
            <Input
              required
              pattern="^[A-Za-z0-9_-]{2,40}$"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="FRAME_PINK_FEATHER"
            />
          </Field>
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value as CosmeticType)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Rarity (1–5 stars)">
            <Select value={rarity} onChange={(e) => setRarity(e.target.value)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {'★'.repeat(n)}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Description (English)">
            <Textarea rows={2} value={descEn} onChange={(e) => setDescEn(e.target.value)} />
          </Field>
          <Field label="Description (Bangla, optional)">
            <Textarea rows={2} value={descBn} onChange={(e) => setDescBn(e.target.value)} />
          </Field>
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Preview image (PNG / JPG / WebP)
          </h3>
          <div className="flex items-start gap-4">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt=""
                className="h-24 w-24 rounded-lg border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
                No preview
              </div>
            )}
            <div className="flex-1 space-y-2">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadPreview(f);
                  e.target.value = '';
                }}
                disabled={uploadingPreview}
                className="block w-full text-sm"
              />
              <p className="text-xs text-slate-500">
                {uploadingPreview ? 'Uploading…' : 'Upload a static image. Used for cards, lists, inventory.'}
              </p>
              {previewUrl && (
                <Input
                  value={previewUrl}
                  readOnly
                  className="font-mono text-xs"
                />
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Animated asset (SVGA / Lottie JSON / MP4)
          </h3>
          <div className="space-y-2">
            <input
              type="file"
              accept=".svga,.json,.mp4,.webm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadAsset(f);
                e.target.value = '';
              }}
              disabled={uploadingAsset}
              className="block w-full text-sm"
            />
            <p className="text-xs text-slate-500">
              {uploadingAsset
                ? 'Uploading…'
                : 'Optional. SVGA → played by the SVGAPlayer. Lottie JSON → played by lottie. MP4/WebM → autoplay video.'}
            </p>
            {assetUrl && (
              <>
                <div className="text-xs text-slate-600">
                  <b>Type:</b> {assetType}
                </div>
                <Input value={assetUrl} readOnly className="font-mono text-xs" />
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Sort order">
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
        </div>

        {error && <ErrorAlert message={error} />}

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create cosmetic'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
