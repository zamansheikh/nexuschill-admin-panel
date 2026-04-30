'use client';

import { FormEvent, useEffect, useState } from 'react';

import { Button, Card, ErrorAlert, Field, Input, Select } from '@/components/ui';
import { api } from '@/lib/api';
import type {
  CosmeticItem,
  CosmeticType,
  PaginatedList,
  StoreCategory,
  StoreListing,
} from '@/types';

interface Props {
  initial?: StoreListing;
  onSaved: (l: StoreListing) => void;
}

const CATEGORIES: StoreCategory[] = ['frame', 'vehicle', 'theme', 'ring'];

export default function StoreListingForm({ initial, onSaved }: Props) {
  const isEdit = !!initial;
  const initialCosmeticId =
    initial && typeof initial.cosmeticItemId !== 'string'
      ? initial.cosmeticItemId.id
      : (initial?.cosmeticItemId as string | undefined) ?? '';

  const [cosmeticItemId, setCosmeticItemId] = useState(initialCosmeticId);
  const [category, setCategory] = useState<StoreCategory>(initial?.category ?? 'frame');
  const [priceCoins, setPriceCoins] = useState(String(initial?.priceCoins ?? 1_000_000));
  const [durationDays, setDurationDays] = useState(String(initial?.durationDays ?? 7));
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [giftable, setGiftable] = useState(initial?.giftable ?? true);
  const [active, setActive] = useState(initial?.active ?? true);

  const [items, setItems] = useState<CosmeticItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Limit catalog to types that are sellable (matches StoreCategory).
        const res = await api<PaginatedList<CosmeticItem>>(
          '/admin/cosmetics?limit=200&active=true',
        );
        const sellable: CosmeticType[] = ['frame', 'vehicle', 'theme', 'ring'];
        setItems(res.items.filter((i) => sellable.includes(i.type)));
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, []);

  // When user picks a cosmetic, default the category to its type if matching.
  useEffect(() => {
    const item = items.find((i) => i.id === cosmeticItemId);
    if (item && CATEGORIES.includes(item.type as StoreCategory)) {
      setCategory(item.type as StoreCategory);
    }
  }, [cosmeticItemId, items]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        ...(isEdit ? {} : { cosmeticItemId }),
        category,
        priceCoins: parseInt(priceCoins, 10),
        durationDays: parseInt(durationDays, 10) || 0,
        sortOrder: parseInt(sortOrder, 10) || 0,
        featured,
        giftable,
        active,
      };

      const res = isEdit
        ? await api<{ listing: StoreListing }>(`/admin/store/listings/${initial!.id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          })
        : await api<{ listing: StoreListing }>('/admin/store/listings', {
            method: 'POST',
            body: JSON.stringify(body),
          });
      onSaved(res.listing);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Cosmetic item" hint="Only frame/vehicle/theme/ring catalog items are sellable in the store.">
          <Select
            required
            value={cosmeticItemId}
            onChange={(e) => setCosmeticItemId(e.target.value)}
            disabled={isEdit}
          >
            <option value="">Choose a cosmetic…</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                [{i.type}] {i.name.en} ({i.code})
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value as StoreCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Price (coins)">
            <Input
              type="number"
              required
              min={1}
              value={priceCoins}
              onChange={(e) => setPriceCoins(e.target.value)}
            />
          </Field>
          <Field label="Duration (days)" hint="0 = permanent">
            <Input
              type="number"
              min={0}
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <Field label="Sort order">
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </Field>
          <Field label="Featured">
            <Select
              value={featured ? 'true' : 'false'}
              onChange={(e) => setFeatured(e.target.value === 'true')}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
          </Field>
          <Field label="Giftable">
            <Select
              value={giftable ? 'true' : 'false'}
              onChange={(e) => setGiftable(e.target.value === 'true')}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
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
          <Button type="submit" disabled={saving || !cosmeticItemId}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create listing'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
