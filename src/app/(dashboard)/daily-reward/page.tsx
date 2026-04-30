'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

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
import type {
  CosmeticItem,
  DailyRewardConfig,
  DailyRewardDayConfig,
  DailyRewardItemConfig,
  PaginatedList,
  RewardKind,
} from '@/types';

const DEFAULT_REWARDS: DailyRewardItemConfig = {
  kind: 'coin',
  coinAmount: 1000,
  cosmeticItemId: null,
  cosmeticDurationDays: 0,
};

function blankDays(): DailyRewardDayConfig[] {
  return Array.from({ length: 7 }, (_, i) => ({
    day: i + 1,
    rewards: [{ ...DEFAULT_REWARDS, coinAmount: 1000 * (i + 1) }],
    isBigReward: i === 6,
  }));
}

export default function DailyRewardConfigPage() {
  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canManage = hasPermission(permissions, 'daily_reward.manage');

  const [days, setDays] = useState<DailyRewardDayConfig[]>(blankDays());
  const [active, setActive] = useState(true);
  const [version, setVersion] = useState(1);
  const [items, setItems] = useState<CosmeticItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cfgRes, itemsRes] = await Promise.all([
        api<{ config: DailyRewardConfig }>('/admin/daily-reward/config'),
        api<PaginatedList<CosmeticItem>>('/admin/cosmetics?limit=200&active=true'),
      ]);
      const cfg = cfgRes.config;
      // Normalize: ensure all 7 days present; keep server-supplied data when available.
      const seeded = blankDays();
      for (const d of cfg.days) seeded[d.day - 1] = d;
      setDays(seeded);
      setActive(cfg.active);
      setVersion(cfg.version);
      setItems(itemsRes.items);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function patchDay(dayIdx: number, updater: (d: DailyRewardDayConfig) => DailyRewardDayConfig) {
    setDays((arr) => arr.map((d, i) => (i === dayIdx ? updater(d) : d)));
  }
  function addReward(dayIdx: number) {
    patchDay(dayIdx, (d) => ({ ...d, rewards: [...d.rewards, { ...DEFAULT_REWARDS }] }));
  }
  function removeReward(dayIdx: number, rIdx: number) {
    patchDay(dayIdx, (d) => ({
      ...d,
      rewards: d.rewards.filter((_, i) => i !== rIdx),
    }));
  }
  function patchReward(
    dayIdx: number,
    rIdx: number,
    updater: (r: DailyRewardItemConfig) => DailyRewardItemConfig,
  ) {
    patchDay(dayIdx, (d) => ({
      ...d,
      rewards: d.rewards.map((r, i) => (i === rIdx ? updater(r) : r)),
    }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSavedAt(null);
    try {
      // Strip cosmetic-only fields from coin entries and vice versa so the
      // backend validator sees a clean payload.
      const payloadDays = days.map((d) => ({
        day: d.day,
        isBigReward: d.isBigReward,
        rewards: d.rewards.map((r) =>
          r.kind === 'coin'
            ? {
                kind: 'coin',
                coinAmount: r.coinAmount ?? 0,
              }
            : {
                kind: 'cosmetic',
                cosmeticItemId: r.cosmeticItemId,
                cosmeticDurationDays: r.cosmeticDurationDays ?? 0,
              },
        ),
      }));
      const res = await api<{ config: DailyRewardConfig }>('/admin/daily-reward/config', {
        method: 'PATCH',
        body: JSON.stringify({ days: payloadDays, active }),
      });
      setVersion(res.config.version);
      setSavedAt(new Date().toLocaleTimeString());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Daily Reward"
        subtitle={
          <>
            7-day check-in cycle. Bumping the version (every save) resets all users to day 1.
            <span className="ml-2 text-xs text-slate-400">version {version}</span>
          </>
        }
        actions={
          canManage && (
            <>
              <Button variant="secondary" onClick={load}>
                Reload
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </>
          )
        }
      />

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}
      {savedAt && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          Saved at {savedAt} · version bumped to {version}
        </div>
      )}

      <Card className="mb-4">
        <Field label="Active">
          <Select
            value={active ? 'true' : 'false'}
            onChange={(e) => setActive(e.target.value === 'true')}
          >
            <option value="true">Active — users can claim daily</option>
            <option value="false">Disabled — no claims allowed</option>
          </Select>
        </Field>
      </Card>

      <div className="space-y-4">
        {days.map((d, di) => (
          <Card key={d.day}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge tone={d.isBigReward ? 'amber' : 'brand'}>Day {d.day}</Badge>
                {d.isBigReward && <span className="text-xs font-semibold text-amber-700">BIG REWARD</span>}
              </div>
              <label className="text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={d.isBigReward}
                  onChange={(e) => patchDay(di, (x) => ({ ...x, isBigReward: e.target.checked }))}
                  className="mr-1"
                />
                Big reward
              </label>
            </div>

            <div className="space-y-2">
              {d.rewards.map((r, ri) => (
                <div
                  key={ri}
                  className="grid grid-cols-12 items-end gap-2 rounded border border-slate-200 p-2"
                >
                  <div className="col-span-3">
                    <Field label="Kind">
                      <Select
                        value={r.kind}
                        onChange={(e) =>
                          patchReward(di, ri, (x) => ({
                            ...x,
                            kind: e.target.value as RewardKind,
                          }))
                        }
                      >
                        <option value="coin">Coins</option>
                        <option value="cosmetic">Cosmetic</option>
                      </Select>
                    </Field>
                  </div>
                  {r.kind === 'coin' ? (
                    <div className="col-span-7">
                      <Field label="Coin amount">
                        <Input
                          type="number"
                          min={1}
                          value={String(r.coinAmount ?? 0)}
                          onChange={(e) =>
                            patchReward(di, ri, (x) => ({
                              ...x,
                              coinAmount: parseInt(e.target.value, 10) || 0,
                            }))
                          }
                        />
                      </Field>
                    </div>
                  ) : (
                    <>
                      <div className="col-span-5">
                        <Field label="Cosmetic">
                          {(() => {
                            const sel = items.find((it) => it.id === r.cosmeticItemId);
                            return (
                              <div className="flex items-center gap-2">
                                {sel?.previewUrl ? (
                                  <img
                                    src={sel.previewUrl}
                                    alt=""
                                    className="h-9 w-9 shrink-0 rounded border border-slate-200 object-cover"
                                  />
                                ) : (
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-dashed border-slate-300 text-xs text-slate-400">
                                    —
                                  </div>
                                )}
                                <Select
                                  className="flex-1"
                                  value={r.cosmeticItemId ?? ''}
                                  onChange={(e) =>
                                    patchReward(di, ri, (x) => ({
                                      ...x,
                                      cosmeticItemId: e.target.value || null,
                                    }))
                                  }
                                >
                                  <option value="">Choose…</option>
                                  {items.map((it) => (
                                    <option key={it.id} value={it.id}>
                                      [{it.type}] {it.name.en} ({it.code})
                                    </option>
                                  ))}
                                </Select>
                              </div>
                            );
                          })()}
                        </Field>
                      </div>
                      <div className="col-span-2">
                        <Field label="Days" hint="0 = perm">
                          <Input
                            type="number"
                            min={0}
                            value={String(r.cosmeticDurationDays ?? 0)}
                            onChange={(e) =>
                              patchReward(di, ri, (x) => ({
                                ...x,
                                cosmeticDurationDays: parseInt(e.target.value, 10) || 0,
                              }))
                            }
                          />
                        </Field>
                      </div>
                    </>
                  )}
                  <div className="col-span-2 flex justify-end">
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => removeReward(di, ri)}
                      disabled={d.rewards.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={() => addReward(di)}>
                + Add reward to day {d.day}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
