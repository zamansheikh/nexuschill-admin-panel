'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorAlert,
  Field,
  Input,
  PageHeader,
  Select,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { api } from '@/lib/api';
import { authStorage, hasPermission } from '@/lib/auth';
import type { PaginatedList, RechargePackage } from '@/types';

interface PackageDraft {
  coins: string;
  bonusCoins: string;
  priceAmount: string;
  priceCurrency: string;
  badgeText: string;
  sortOrder: string;
  active: boolean;
}

const EMPTY: PackageDraft = {
  coins: '60000',
  bonusCoins: '0',
  priceAmount: '12',
  priceCurrency: 'BDT',
  badgeText: '',
  sortOrder: '0',
  active: true,
};

export default function RechargePackagesPage() {
  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canManage = hasPermission(permissions, 'recharge.package.manage');

  const [data, setData] = useState<PaginatedList<RechargePackage> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<PackageDraft>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<PaginatedList<RechargePackage>>(
        '/admin/wallet-options/recharge-packages?limit=100',
      );
      setData(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startNew() {
    setEditingId('new');
    setDraft(EMPTY);
  }

  function startEdit(p: RechargePackage) {
    setEditingId(p.id);
    setDraft({
      coins: String(p.coins),
      bonusCoins: String(p.bonusCoins),
      priceAmount: String(p.priceAmount),
      priceCurrency: p.priceCurrency,
      badgeText: p.badgeText,
      sortOrder: String(p.sortOrder),
      active: p.active,
    });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        coins: parseInt(draft.coins, 10) || 0,
        bonusCoins: parseInt(draft.bonusCoins, 10) || 0,
        priceAmount: parseInt(draft.priceAmount, 10) || 0,
        priceCurrency: draft.priceCurrency,
        badgeText: draft.badgeText,
        sortOrder: parseInt(draft.sortOrder, 10) || 0,
        active: draft.active,
      };
      if (editingId === 'new') {
        await api('/admin/wallet-options/recharge-packages', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      } else {
        await api(`/admin/wallet-options/recharge-packages/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      }
      setEditingId(null);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this recharge package permanently?')) return;
    try {
      await api(`/admin/wallet-options/recharge-packages/${id}`, { method: 'DELETE' });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Recharge Packages"
        subtitle="Coin bundles users can buy with real currency. Each tile shows base coins + bonus + price."
        actions={canManage && <Button onClick={startNew}>+ New Package</Button>}
      />

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      {editingId !== null && (
        <Card className="mb-4">
          <form onSubmit={save} className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              {editingId === 'new' ? 'New package' : 'Edit package'}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Coins" hint="Base coins delivered">
                <Input
                  type="number"
                  required
                  min={1}
                  value={draft.coins}
                  onChange={(e) => setDraft({ ...draft, coins: e.target.value })}
                />
              </Field>
              <Field label="Bonus coins" hint="+N shown in red">
                <Input
                  type="number"
                  min={0}
                  value={draft.bonusCoins}
                  onChange={(e) => setDraft({ ...draft, bonusCoins: e.target.value })}
                />
              </Field>
              <Field label="Badge" hint="🎁 / HOT / etc.">
                <Input
                  value={draft.badgeText}
                  onChange={(e) => setDraft({ ...draft, badgeText: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <Field label="Price">
                <Input
                  type="number"
                  required
                  min={0}
                  value={draft.priceAmount}
                  onChange={(e) => setDraft({ ...draft, priceAmount: e.target.value })}
                />
              </Field>
              <Field label="Currency">
                <Input
                  value={draft.priceCurrency}
                  onChange={(e) =>
                    setDraft({ ...draft, priceCurrency: e.target.value.toUpperCase() })
                  }
                />
              </Field>
              <Field label="Sort order" hint="Higher first">
                <Input
                  type="number"
                  value={draft.sortOrder}
                  onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })}
                />
              </Field>
              <Field label="Active">
                <Select
                  value={draft.active ? 'true' : 'false'}
                  onChange={(e) => setDraft({ ...draft, active: e.target.value === 'true' })}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Select>
              </Field>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
              <Button variant="secondary" type="button" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading…
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState message="No recharge packages yet." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Coins</Th>
              <Th>Bonus</Th>
              <Th>Price</Th>
              <Th>Badge</Th>
              <Th>Sort</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <Td className="font-mono">{p.coins.toLocaleString()}</Td>
                <Td className="font-mono text-xs text-amber-700">
                  {p.bonusCoins > 0 ? `+${p.bonusCoins.toLocaleString()}` : '—'}
                </Td>
                <Td className="font-mono">
                  {p.priceAmount} {p.priceCurrency}
                </Td>
                <Td className="text-xs">{p.badgeText || '—'}</Td>
                <Td className="text-xs">{p.sortOrder}</Td>
                <Td>
                  {p.active ? (
                    <Badge tone="green">active</Badge>
                  ) : (
                    <Badge tone="amber">inactive</Badge>
                  )}
                </Td>
                <Td>
                  {canManage && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(p)}
                        className="text-xs text-brand hover:underline"
                      >
                        Edit
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        onClick={() => remove(p.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
