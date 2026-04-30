'use client';

import { FormEvent, useState } from 'react';

import { Button, Card, ErrorAlert, Field, Input, Select, Textarea } from '@/components/ui';
import { api } from '@/lib/api';
import type { Gift, GiftCategory } from '@/types';

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
  const [beanReward, setBeanReward] = useState(String(initial?.beanReward ?? 5));
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? '');
  const [animationUrl, setAnimationUrl] = useState(initial?.animationUrl ?? '');
  const [soundUrl, setSoundUrl] = useState(initial?.soundUrl ?? '');
  const [durationMs, setDurationMs] = useState(String(initial?.durationMs ?? 3000));
  const [active, setActive] = useState(initial?.active ?? true);
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [vipOnly, setVipOnly] = useState(initial?.vipOnly ?? false);
  const [svipOnly, setSvipOnly] = useState(initial?.svipOnly ?? false);
  const [countries, setCountries] = useState((initial?.countries ?? []).join(','));
  const [combo, setCombo] = useState((initial?.comboMultipliers ?? [1, 10, 66, 188, 520, 1314]).join(','));
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        beanReward: parseInt(beanReward, 10),
        thumbnailUrl: thumbnailUrl || undefined,
        animationUrl: animationUrl || undefined,
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
          <Field label="Bean reward" hint="Typically priceCoins × 0.5">
            <Input
              type="number"
              required
              min={0}
              value={beanReward}
              onChange={(e) => setBeanReward(e.target.value)}
            />
          </Field>
          <Field label="Animation duration (ms)">
            <Input type="number" min={500} value={durationMs} onChange={(e) => setDurationMs(e.target.value)} />
          </Field>
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Assets</h3>
          <div className="space-y-2">
            <Field label="Thumbnail URL" hint="Cloudinary URL or any HTTPS URL">
              <Input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} />
            </Field>
            <Field label="Animation URL (Lottie JSON / SVGA / MP4)">
              <Input value={animationUrl} onChange={(e) => setAnimationUrl(e.target.value)} />
            </Field>
            <Field label="Sound URL (optional)">
              <Input value={soundUrl} onChange={(e) => setSoundUrl(e.target.value)} />
            </Field>
            {thumbnailUrl && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Preview:</span>
                <img src={thumbnailUrl} alt="" className="h-12 w-12 rounded object-cover ring-1 ring-slate-200" />
              </div>
            )}
          </div>
        </div>

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
