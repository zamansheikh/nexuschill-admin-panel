'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Badge,
  Button,
  Card,
  ErrorAlert,
  Field,
  Input,
  PageHeader,
  Select,
} from '@/components/ui';
import { api } from '@/lib/api';
import { authStorage, hasPermission } from '@/lib/auth';
import type { LuckyBagConfig, LuckyBagTier } from '@/types';

/**
 * Single-page Lucky Bag config — the whole admin surface for this
 * feature lives here. Loads the singleton, lets the admin tweak
 * everything, validates client-side, and PATCHes back.
 */
export default function LuckyBagAdminPage() {
  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canManage = hasPermission(permissions, 'lucky_bag.manage');

  const [config, setConfig] = useState<LuckyBagConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Form-state mirrors the server doc but keeps the in-flight values
  // editable. Loaded fresh on mount; reset on save.
  const [enabled, setEnabled] = useState(true);
  const [commissionPct, setCommissionPct] = useState('25');
  const [applyByDefault, setApplyByDefault] = useState(true);
  const [coinPresetsRaw, setCoinPresetsRaw] = useState('');
  const [tiers, setTiers] = useState<LuckyBagTier[]>([]);

  function hydrateForm(c: LuckyBagConfig) {
    setEnabled(c.enabled);
    setCommissionPct((c.commissionRate * 100).toFixed(2).replace(/\.?0+$/, ''));
    setApplyByDefault(c.applyCommissionByDefault);
    setCoinPresetsRaw(c.coinPresets.join(','));
    setTiers(c.tiers.map((t) => ({ ...t, percentages: [...t.percentages] })));
  }

  useEffect(() => {
    let cancelled = false;
    api<{ config: LuckyBagConfig }>('/lucky-bag/admin/config')
      .then((res) => {
        if (cancelled) return;
        setConfig(res.config);
        hydrateForm(res.config);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function tierSum(t: LuckyBagTier): number {
    return t.percentages.reduce((s, p) => s + p, 0);
  }

  async function save() {
    if (!canManage || saving) return;
    setError(null);
    setSavedMessage(null);

    // Client-side validation — keep the server roundtrip cheap.
    const rate = Number(commissionPct);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      setError('Commission must be 0–100%.');
      return;
    }
    const coinPresets = coinPresetsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => parseInt(s, 10));
    if (coinPresets.some((n) => !Number.isFinite(n) || n <= 0)) {
      setError('Coin presets must be positive integers (comma-separated).');
      return;
    }
    for (const t of tiers) {
      if (t.percentages.length !== t.slotCount) {
        setError(`Tier ${t.slotCount}: percentages length must equal slot count.`);
        return;
      }
      const sum = tierSum(t);
      if (Math.abs(sum - 1) > 0.001) {
        setError(`Tier ${t.slotCount}: percentages must sum to 1.0 (got ${sum.toFixed(4)}).`);
        return;
      }
    }

    setSaving(true);
    try {
      const res = await api<{ config: LuckyBagConfig }>(
        '/lucky-bag/admin/config',
        {
          method: 'PATCH',
          body: JSON.stringify({
            enabled,
            commissionRate: rate / 100,
            applyCommissionByDefault: applyByDefault,
            coinPresets,
            tiers,
          }),
        },
      );
      setConfig(res.config);
      hydrateForm(res.config);
      setSavedMessage('Saved.');
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function addTier() {
    const next: LuckyBagTier = {
      slotCount: 1,
      percentages: [1],
    };
    setTiers([...tiers, next]);
  }

  function removeTier(idx: number) {
    setTiers(tiers.filter((_, i) => i !== idx));
  }

  function updateTierSlotCount(idx: number, slotCount: number) {
    if (!Number.isFinite(slotCount) || slotCount < 1) return;
    const t = tiers[idx];
    const next: LuckyBagTier = { slotCount, percentages: [...t.percentages] };
    // Stretch / shrink the percentages array to match. New slots get 0
    // (admin must rebalance). Trimmed slots are dropped from the end.
    if (next.percentages.length < slotCount) {
      while (next.percentages.length < slotCount) next.percentages.push(0);
    } else if (next.percentages.length > slotCount) {
      next.percentages = next.percentages.slice(0, slotCount);
    }
    const copy = [...tiers];
    copy[idx] = next;
    setTiers(copy);
  }

  function updateTierPercentage(idx: number, pos: number, raw: string) {
    const v = Number(raw);
    if (!Number.isFinite(v)) return;
    const t = tiers[idx];
    const next = [...t.percentages];
    next[pos] = v;
    const copy = [...tiers];
    copy[idx] = { ...t, percentages: next };
    setTiers(copy);
  }

  function normaliseTier(idx: number) {
    const t = tiers[idx];
    const sum = tierSum(t);
    if (sum <= 0) return;
    const scaled = t.percentages.map((p) => p / sum);
    const copy = [...tiers];
    copy[idx] = { ...t, percentages: scaled };
    setTiers(copy);
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }
  if (!config) {
    return <ErrorAlert message={error || 'Couldn\'t load Lucky Bag config.'} />;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Lucky Bag — Config"
        subtitle="Platform-wide settings for the Lucky Bag feature: commission rate, coin presets the composer shows, and the fixed-tier reward schedule. The without-commission percentages live here; the with-commission table is computed automatically as percentages × (1 − commission)."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => hydrateForm(config!)}
              disabled={saving}
            >
              Reset
            </Button>
            <Button onClick={save} disabled={!canManage || saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorAlert message={error} />
        </div>
      )}
      {savedMessage && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {savedMessage}
        </div>
      )}

      <Card className="mb-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Feature enabled">
            <Select
              value={enabled ? 'true' : 'false'}
              onChange={(e) => setEnabled(e.target.value === 'true')}
              disabled={!canManage}
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </Select>
          </Field>
          <Field
            label="Commission rate (%)"
            hint="Platform's cut. 0–100. The user pool is (totalCoins × (1 − rate))."
          >
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={commissionPct}
              onChange={(e) => setCommissionPct(e.target.value)}
              disabled={!canManage}
            />
          </Field>
          <Field
            label="Apply commission by default"
            hint="When off, the user pool is the full totalCoins regardless of rate."
          >
            <Select
              value={applyByDefault ? 'true' : 'false'}
              onChange={(e) => setApplyByDefault(e.target.value === 'true')}
              disabled={!canManage}
            >
              <option value="true">Apply</option>
              <option value="false">Skip</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card className="mb-4">
        <Field
          label="Coin presets (comma-separated)"
          hint="The amounts the mobile composer shows. Example: 60000,150000,210000,300000,600000"
        >
          <Input
            value={coinPresetsRaw}
            onChange={(e) => setCoinPresetsRaw(e.target.value)}
            disabled={!canManage}
          />
        </Field>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">
          Tiers (fixed-tier mode)
        </h2>
        {canManage && (
          <Button variant="secondary" onClick={addTier}>
            + Add tier
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {tiers.map((t, idx) => {
          const sum = tierSum(t);
          const ok = Math.abs(sum - 1) <= 0.001 && t.percentages.length === t.slotCount;
          return (
            <Card key={idx}>
              <div className="mb-3 flex flex-wrap items-end gap-3">
                <Field label="Slot count">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={String(t.slotCount)}
                    onChange={(e) =>
                      updateTierSlotCount(idx, parseInt(e.target.value, 10) || 1)
                    }
                    disabled={!canManage}
                    className="w-28"
                  />
                </Field>
                <div className="flex-1">
                  <span className="block text-sm font-medium text-slate-700">
                    Sum
                  </span>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <Badge tone={ok ? 'green' : 'red'}>
                      {(sum * 100).toFixed(2)}%
                    </Badge>
                    {!ok && (
                      <span className="text-slate-500">must equal 100%</span>
                    )}
                  </div>
                </div>
                {canManage && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => normaliseTier(idx)}
                    >
                      Normalize
                    </Button>
                    <Button variant="danger" onClick={() => removeTier(idx)}>
                      Remove
                    </Button>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {t.percentages.map((p, pos) => (
                  <div key={pos} className="rounded-lg border border-slate-200 p-2">
                    <div className="mb-1 text-xs text-slate-500">
                      Slot {pos + 1}
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.0001"
                      value={String(p)}
                      onChange={(e) => updateTierPercentage(idx, pos, e.target.value)}
                      disabled={!canManage}
                    />
                    <div className="mt-1 text-xs text-slate-400">
                      {(p * 100).toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
        {tiers.length === 0 && (
          <Card>
            <div className="text-center text-sm text-slate-500">
              No tiers configured. Fixed-tier mode will be unavailable until at
              least one tier is added.
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
