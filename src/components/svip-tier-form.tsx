'use client';

import { FormEvent, useEffect, useState } from 'react';

import { Button, Card, ErrorAlert, Field, Input, Select } from '@/components/ui';
import { api } from '@/lib/api';
import type {
  CosmeticItem,
  PaginatedList,
  SvipPrivilegeDef,
  SvipTier,
} from '@/types';

interface Props {
  initial?: SvipTier;
  onSaved: (t: SvipTier) => void;
}

export default function SvipTierForm({ initial, onSaved }: Props) {
  const isEdit = !!initial;

  const [level, setLevel] = useState(String(initial?.level ?? 1));
  const [name, setName] = useState(initial?.name ?? '');
  const [monthlyPointsRequired, setMonthlyPointsRequired] = useState(
    String(initial?.monthlyPointsRequired ?? 0),
  );
  const [coinReward, setCoinReward] = useState(String(initial?.coinReward ?? 0));
  const [iconUrl, setIconUrl] = useState(initial?.iconUrl ?? '');
  const [iconPublicId, setIconPublicId] = useState(initial?.iconPublicId ?? '');
  const [bannerUrl, setBannerUrl] = useState(initial?.bannerUrl ?? '');
  const [bannerPublicId, setBannerPublicId] = useState(initial?.bannerPublicId ?? '');
  const [active, setActive] = useState(initial?.active ?? true);

  const [grantedItemIds, setGrantedItemIds] = useState<string[]>(initial?.grantedItemIds ?? []);
  const [privileges, setPrivileges] = useState<string[]>(initial?.privileges ?? []);

  const [items, setItems] = useState<CosmeticItem[]>([]);
  const [privilegeDefs, setPrivilegeDefs] = useState<SvipPrivilegeDef[]>([]);

  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [it, pr] = await Promise.all([
          api<PaginatedList<CosmeticItem>>('/admin/cosmetics?limit=200&active=true'),
          api<{ items: SvipPrivilegeDef[] }>('/admin/svip/privileges'),
        ]);
        setItems(it.items);
        setPrivilegeDefs(pr.items);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, []);

  async function uploadImage(file: File, target: 'icon' | 'banner') {
    const setUploading = target === 'icon' ? setUploadingIcon : setUploadingBanner;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api<{ url: string; publicId: string }>(
        '/admin/cosmetics/upload/preview',
        { method: 'POST', body: fd },
      );
      if (target === 'icon') {
        setIconUrl(res.url);
        setIconPublicId(res.publicId);
      } else {
        setBannerUrl(res.url);
        setBannerPublicId(res.publicId);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  function toggleItem(id: string) {
    setGrantedItemIds((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]));
  }

  function togglePrivilege(key: string) {
    setPrivileges((arr) => (arr.includes(key) ? arr.filter((x) => x !== key) : [...arr, key]));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        ...(isEdit ? {} : { level: parseInt(level, 10) }),
        name,
        monthlyPointsRequired: parseInt(monthlyPointsRequired, 10) || 0,
        coinReward: parseInt(coinReward, 10) || 0,
        iconUrl,
        iconPublicId,
        bannerUrl,
        bannerPublicId,
        grantedItemIds,
        privileges,
        active,
      };

      const res = isEdit
        ? await api<{ tier: SvipTier }>(`/admin/svip/tiers/${initial!.id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          })
        : await api<{ tier: SvipTier }>('/admin/svip/tiers', {
            method: 'POST',
            body: JSON.stringify(body),
          });
      onSaved(res.tier);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  // Group privileges by category for the editor.
  const privilegesByCategory = privilegeDefs.reduce<Record<string, SvipPrivilegeDef[]>>(
    (acc, p) => {
      (acc[p.category] ??= []).push(p);
      return acc;
    },
    {},
  );

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Level (1–9)">
            <Input
              type="number"
              required
              min={1}
              max={9}
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              disabled={isEdit}
            />
          </Field>
          <Field label="Display name">
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="SVIP 1"
            />
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

        <div className="grid grid-cols-2 gap-3">
          <Field label="Monthly points required" hint="To qualify for this tier each month">
            <Input
              type="number"
              required
              min={0}
              value={monthlyPointsRequired}
              onChange={(e) => setMonthlyPointsRequired(e.target.value)}
            />
          </Field>
          <Field label="Coin reward on first reach" hint="One-time reward, e.g. 270000000 for SVIP 9">
            <Input
              type="number"
              min={0}
              value={coinReward}
              onChange={(e) => setCoinReward(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Tier icon</h3>
            <div className="flex items-start gap-3">
              {iconUrl ? (
                <img src={iconUrl} alt="" className="h-20 w-20 rounded-lg object-cover" />
              ) : (
                <div className="h-20 w-20 rounded-lg border border-dashed border-slate-300" />
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploadingIcon}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f, 'icon');
                  e.target.value = '';
                }}
                className="block w-full text-sm"
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Banner</h3>
            <div className="flex items-start gap-3">
              {bannerUrl ? (
                <img src={bannerUrl} alt="" className="h-20 w-32 rounded-lg object-cover" />
              ) : (
                <div className="h-20 w-32 rounded-lg border border-dashed border-slate-300" />
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploadingBanner}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f, 'banner');
                  e.target.value = '';
                }}
                className="block w-full text-sm"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Granted cosmetics ({grantedItemIds.length} selected)
          </h3>
          <p className="mb-3 text-xs text-slate-500">
            Pick which catalog items the user receives while holding this tier — frame, medal, vehicle, chat bubble, mic wave, etc.
          </p>
          {items.length === 0 ? (
            <p className="text-xs text-slate-400">
              No cosmetic items in the catalog yet.{' '}
              <a className="text-brand underline" href="/cosmetics/new">
                Create one first
              </a>.
            </p>
          ) : (
            <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
              {items.map((it) => {
                const selected = grantedItemIds.includes(it.id);
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => toggleItem(it.id)}
                    className={`flex flex-col items-start rounded-lg border p-2 text-left transition ${
                      selected
                        ? 'border-brand bg-brand/5 ring-2 ring-brand/30'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {it.previewUrl ? (
                      <img src={it.previewUrl} alt="" className="h-12 w-full rounded object-cover" />
                    ) : (
                      <div className="h-12 w-full rounded bg-slate-100" />
                    )}
                    <div className="mt-1 truncate text-xs font-medium text-slate-900">{it.name.en}</div>
                    <div className="text-[10px] text-slate-500">{it.type.replace(/_/g, ' ')}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Privileges ({privileges.length} selected)
          </h3>
          {Object.entries(privilegesByCategory).map(([cat, defs]) => (
            <div key={cat} className="mb-3">
              <div className="mb-1 text-xs font-semibold capitalize text-slate-700">{cat}</div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {defs.map((p) => {
                  const selected = privileges.includes(p.key);
                  return (
                    <label
                      key={p.key}
                      className={`flex cursor-pointer items-start gap-2 rounded border p-2 text-xs transition ${
                        selected ? 'border-brand bg-brand/5' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => togglePrivilege(p.key)}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-medium text-slate-800">{p.label}</div>
                        <div className="text-slate-500">{p.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {error && <ErrorAlert message={error} />}

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create tier'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
