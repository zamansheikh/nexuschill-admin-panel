'use client';

import { FormEvent, useState } from 'react';

import AssetPreview from '@/components/asset-preview';
import { Button, Card, ErrorAlert, Field, Input, Select, Textarea } from '@/components/ui';
import { api } from '@/lib/api';
import type { Gift, GiftAssetType, GiftCategory } from '@/types';

interface Props {
  initial?: Gift;
  onSaved: (g: Gift) => void;
}

export default function GiftForm({ initial, onSaved }: Props) {
  const isEdit = !!initial;

  const [nameEn, setNameEn] = useState(initial?.name?.en ?? '');
  const [nameBn, setNameBn] = useState(initial?.name?.bn ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [descEn, setDescEn] = useState(initial?.description?.en ?? '');
  const [descBn, setDescBn] = useState(initial?.description?.bn ?? '');
  const [category, setCategory] = useState<GiftCategory>(initial?.category ?? 'basic');
  const [priceCoins, setPriceCoins] = useState(String(initial?.priceCoins ?? 10));
  const [diamondReward, setDiamondReward] = useState(String(initial?.diamondReward ?? 5));
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? '');
  const [thumbnailPublicId, setThumbnailPublicId] = useState(initial?.thumbnailPublicId ?? '');
  const [animationUrl, setAnimationUrl] = useState(initial?.animationUrl ?? '');
  const [animationPublicId, setAnimationPublicId] = useState(initial?.animationPublicId ?? '');
  const [assetType, setAssetType] = useState<GiftAssetType>(initial?.assetType ?? 'none');
  const [soundUrl, setSoundUrl] = useState(initial?.soundUrl ?? '');
  const [durationMs, setDurationMs] = useState(String(initial?.durationMs ?? 3000));
  const [active, setActive] = useState(initial?.active ?? true);
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [vipOnly, setVipOnly] = useState(initial?.vipOnly ?? false);
  const [svipOnly, setSvipOnly] = useState(initial?.svipOnly ?? false);
  const [countries, setCountries] = useState((initial?.countries ?? []).join(','));
  const [combo, setCombo] = useState((initial?.comboMultipliers ?? [1, 10, 66, 188, 520, 1314]).join(','));
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));

  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingAnim, setUploadingAnim] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadThumbnail(file: File) {
    setUploadingThumb(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api<{ url: string; publicId: string }>(
        '/admin/gifts/upload/thumbnail',
        { method: 'POST', body: fd },
      );
      setThumbnailUrl(res.url);
      setThumbnailPublicId(res.publicId);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploadingThumb(false);
    }
  }

  async function uploadAnimation(file: File) {
    setUploadingAnim(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api<{ url: string; publicId: string; assetType: GiftAssetType }>(
        '/admin/gifts/upload/animation',
        { method: 'POST', body: fd },
      );
      setAnimationUrl(res.url);
      setAnimationPublicId(res.publicId);
      setAssetType(res.assetType);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploadingAnim(false);
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
        category,
        priceCoins: parseInt(priceCoins, 10),
        diamondReward: parseInt(diamondReward, 10),
        thumbnailUrl: thumbnailUrl || undefined,
        thumbnailPublicId: thumbnailPublicId || undefined,
        animationUrl: animationUrl || undefined,
        animationPublicId: animationPublicId || undefined,
        assetType,
        soundUrl: soundUrl || undefined,
        durationMs: parseInt(durationMs, 10),
        active,
        featured,
        vipOnly,
        svipOnly,
        countries: countries
          .split(',')
          .map((c) => c.trim().toUpperCase())
          .filter(Boolean),
        comboMultipliers: combo
          .split(',')
          .map((c) => parseInt(c.trim(), 10))
          .filter((n) => !isNaN(n) && n > 0),
        sortOrder: parseInt(sortOrder, 10) || 0,
      };

      const res = isEdit
        ? await api<{ gift: Gift }>(`/admin/gifts/${initial!.id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          })
        : await api<{ gift: Gift }>('/admin/gifts', {
            method: 'POST',
            body: JSON.stringify(body),
          });
      onSaved(res.gift);
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
          <Field label="Code (unique)" hint="Uppercase">
            <Input
              required
              pattern="^[A-Za-z0-9_-]{2,30}$"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ROSE"
            />
          </Field>
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value as GiftCategory)}>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="legendary">Legendary</option>
              <option value="limited">Limited</option>
            </Select>
          </Field>
          <Field label="Sort order">
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
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

        <div className="grid grid-cols-3 gap-3">
          <Field label="Price (coins)">
            <Input
              type="number"
              required
              min={1}
              value={priceCoins}
              onChange={(e) => setPriceCoins(e.target.value)}
            />
          </Field>
          <Field label="Diamond reward" hint="Typically priceCoins × 0.5">
            <Input
              type="number"
              required
              min={0}
              value={diamondReward}
              onChange={(e) => setDiamondReward(e.target.value)}
            />
          </Field>
          <Field label="Animation duration (ms)">
            <Input type="number" min={500} value={durationMs} onChange={(e) => setDurationMs(e.target.value)} />
          </Field>
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Thumbnail (PNG / JPG / WebP)
          </h3>
          <div className="flex items-start gap-4">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt=""
                className="h-24 w-24 rounded-lg border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
                No thumbnail
              </div>
            )}
            <div className="flex-1 space-y-2">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadThumbnail(f);
                  e.target.value = '';
                }}
                disabled={uploadingThumb}
                className="block w-full text-sm"
              />
              <p className="text-xs text-slate-500">
                {uploadingThumb
                  ? 'Uploading…'
                  : 'Static image shown on the gift sheet card.'}
              </p>
              {thumbnailUrl && (
                <Input value={thumbnailUrl} readOnly className="font-mono text-xs" />
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Animation (SVGA / Lottie JSON / MP4)
          </h3>
          <div className="flex items-start gap-4">
            {animationUrl ? (
              <AssetPreview
                assetUrl={animationUrl}
                assetType={
                  // AssetPreview was built for cosmetics; the enums match
                  // 1:1 so we can pass the gift assetType straight through.
                  (assetType === 'none' ? 'none' : assetType) as
                    | 'svga'
                    | 'lottie'
                    | 'mp4'
                    | 'image'
                    | 'none'
                }
                previewUrl={thumbnailUrl}
                className="h-32 w-32 shrink-0 rounded-lg border border-slate-200 bg-slate-50"
              />
            ) : (
              <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
                No animation
              </div>
            )}
            <div className="flex-1 space-y-2">
              <input
                type="file"
                accept=".svga,.json,.mp4,.webm"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadAnimation(f);
                  e.target.value = '';
                }}
                disabled={uploadingAnim}
                className="block w-full text-sm"
              />
              <p className="text-xs text-slate-500">
                {uploadingAnim
                  ? 'Uploading…'
                  : 'SVGA → played by SVGA player. Lottie JSON → Lottie. MP4/WebM → autoplay video.'}
              </p>
              {animationUrl && (
                <>
                  <div className="text-xs text-slate-600">
                    <b>Type:</b> {assetType}
                  </div>
                  <Input value={animationUrl} readOnly className="font-mono text-xs" />
                </>
              )}
            </div>
          </div>
        </div>

        <Field label="Sound URL (optional)">
          <Input value={soundUrl} onChange={(e) => setSoundUrl(e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Combo multipliers" hint="Comma-separated, e.g. 1,10,66,188">
            <Input value={combo} onChange={(e) => setCombo(e.target.value)} />
          </Field>
          <Field label="Country whitelist" hint="ISO-2 codes, comma-separated. Empty = all countries.">
            <Input
              value={countries}
              onChange={(e) => setCountries(e.target.value)}
              placeholder="BD,IN,PK"
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-4 rounded-lg bg-slate-50 p-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            Featured
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={vipOnly} onChange={(e) => setVipOnly(e.target.checked)} />
            VIP only
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={svipOnly} onChange={(e) => setSvipOnly(e.target.checked)} />
            SVIP only
          </label>
        </div>

        {error && <ErrorAlert message={error} />}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create gift'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
