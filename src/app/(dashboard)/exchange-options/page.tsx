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
import type { ExchangeOption, PaginatedList } from '@/types';

interface OptionDraft {
  diamondsRequired: string;
  coinsAwarded: string;
  sortOrder: string;
  active: boolean;
}

const EMPTY: OptionDraft = {
  diamondsRequired: '1000',
  coinsAwarded: '330',
  sortOrder: '0',
  active: true,
};

export default function ExchangeOptionsPage() {
  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canManage = hasPermission(permissions, 'wallet.adjust');

  const [data, setData] = useState<PaginatedList<ExchangeOption> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<OptionDraft>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<PaginatedList<ExchangeOption>>(
        '/admin/wallet-options/exchange-options?limit=100',
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

  function startEdit(o: ExchangeOption) {
    setEditingId(o.id);
    setDraft({
      diamondsRequired: String(o.diamondsRequired),
      coinsAwarded: String(o.coinsAwarded),
      sortOrder: String(o.sortOrder),
      active: o.active,
    });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        diamondsRequired: parseInt(draft.diamondsRequired, 10) || 0,
        coinsAwarded: parseInt(draft.coinsAwarded, 10) || 0,
        sortOrder: parseInt(draft.sortOrder, 10) || 0,
        active: draft.active,
      };
      if (editingId === 'new') {
        await api('/admin/wallet-options/exchange-options', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      } else {
        await api(`/admin/wallet-options/exchange-options/${editingId}`, {
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
    if (!confirm('Delete this exchange option permanently?')) return;
    try {
      await api(`/admin/wallet-options/exchange-options/${id}`, { method: 'DELETE' });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  // Derived ratio (coins per 1k diamonds) — quick sanity check that the
  // ladder is monotonic and balanced.
  function ratio(o: ExchangeOption): string {
    if (!o.diamondsRequired) return '—';
    const r = (o.coinsAwarded / o.diamondsRequired) * 1000;
    return `${r.toFixed(0)} coins / 1K💎`;
  }

  return (
    <div>
      <PageHeader
        title="Exchange Options"
        subtitle="Tiers shown on the user's Diamonds tab — each row is a fixed diamond → coin trade."
        actions={canManage && <Button onClick={startNew}>+ New Option</Button>}
      />

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      {editingId !== null && (
        <Card className="mb-4">
          <form onSubmit={save} className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              {editingId === 'new' ? 'New exchange option' : 'Edit option'}
            </h3>
            <div className="grid grid-cols-4 gap-3">
              <Field label="Diamonds required">
                <Input
                  type="number"
                  required
                  min={1}
                  value={draft.diamondsRequired}
                  onChange={(e) =>
                    setDraft({ ...draft, diamondsRequired: e.target.value })
                  }
                />
              </Field>
              <Field label="Coins awarded">
                <Input
                  type="number"
                  required
                  min={1}
                  value={draft.coinsAwarded}
                  onChange={(e) => setDraft({ ...draft, coinsAwarded: e.target.value })}
                />
              </Field>
              <Field label="Sort order">
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
        <EmptyState message="No exchange options yet." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Diamonds</Th>
              <Th>Coins</Th>
              <Th>Effective rate</Th>
              <Th>Sort</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <Td className="font-mono">{o.diamondsRequired.toLocaleString()}</Td>
                <Td className="font-mono">{o.coinsAwarded.toLocaleString()}</Td>
                <Td className="font-mono text-xs text-slate-500">{ratio(o)}</Td>
                <Td className="text-xs">{o.sortOrder}</Td>
                <Td>
                  {o.active ? (
                    <Badge tone="green">active</Badge>
                  ) : (
                    <Badge tone="amber">inactive</Badge>
                  )}
                </Td>
                <Td>
                  {canManage && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(o)}
                        className="text-xs text-brand hover:underline"
                      >
                        Edit
                      </button>
                      <span className="text-slate-300">·</span>
                      <button
                        onClick={() => remove(o.id)}
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
