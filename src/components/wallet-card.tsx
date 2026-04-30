'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

import { Badge, Button, Card, ErrorAlert, Field, Input, Select } from '@/components/ui';
import { api } from '@/lib/api';
import { authStorage, hasPermission } from '@/lib/auth';
import type { Currency, TxnDirection, Wallet } from '@/types';

export default function WalletCard({ userId }: { userId: string }) {
  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canView = hasPermission(permissions, 'wallet.view');
  const canAdjust = hasPermission(permissions, 'wallet.adjust');
  const canFreeze = hasPermission(permissions, 'wallet.freeze');
  const canMint = hasPermission(permissions, 'wallet.mint');

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [currency, setCurrency] = useState<Currency>('coins');
  const [direction, setDirection] = useState<TxnDirection>('credit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }
    api<{ wallet: Wallet }>(`/admin/wallets/${userId}`)
      .then((r) => setWallet(r.wallet))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId, canView]);

  if (!canView) return null;
  if (loading) {
    return (
      <Card>
        <div className="text-sm text-slate-500">Loading wallet…</div>
      </Card>
    );
  }

  async function adjust(e: FormEvent) {
    e.preventDefault();
    if (!amount || !reason) return;
    setAdjusting(true);
    setError(null);
    try {
      const r = await api<{ wallet: Wallet }>(`/admin/wallets/${userId}/adjust`, {
        method: 'POST',
        body: JSON.stringify({
          currency,
          direction,
          amount: parseInt(amount, 10),
          reason,
        }),
      });
      setWallet(r.wallet);
      setAmount('');
      setReason('');
      setShowForm(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdjusting(false);
    }
  }

  async function mint() {
    const amountStr = prompt('How many coins to mint?');
    const amount = parseInt(amountStr || '0', 10);
    if (!amount || amount <= 0) return;
    const reason = prompt('Reason (audit-logged):');
    if (!reason) return;
    setError(null);
    try {
      const r = await api<{ wallet: Wallet }>(`/admin/wallets/${userId}/mint`, {
        method: 'POST',
        body: JSON.stringify({ amount, reason }),
      });
      setWallet(r.wallet);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function toggleFreeze() {
    if (!wallet) return;
    if (wallet.frozen) {
      const r = await api<{ wallet: Wallet }>(`/admin/wallets/${userId}/unfreeze`, { method: 'POST' });
      setWallet(r.wallet);
    } else {
      const reason = prompt('Reason to freeze this wallet?');
      if (!reason) return;
      const r = await api<{ wallet: Wallet }>(`/admin/wallets/${userId}/freeze`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      setWallet(r.wallet);
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wallet</h3>
        {wallet?.frozen && <Badge tone="red">frozen</Badge>}
      </div>

      {error && (
        <div className="mb-3">
          <ErrorAlert message={error} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-amber-50 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Coins</div>
          <div className="mt-1 text-2xl font-bold text-amber-900">{wallet?.coins ?? 0}</div>
          <div className="mt-1 text-xs text-amber-600">
            recharged: {wallet?.lifetimeCoinsRecharged ?? 0} · spent: {wallet?.lifetimeCoinsSpent ?? 0}
          </div>
        </div>
        <div className="rounded-lg bg-purple-50 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-purple-700">Beans</div>
          <div className="mt-1 text-2xl font-bold text-purple-900">{wallet?.beans ?? 0}</div>
          <div className="mt-1 text-xs text-purple-600">
            earned: {wallet?.lifetimeBeansEarned ?? 0} · withdrawn: {wallet?.lifetimeBeansWithdrawn ?? 0}
          </div>
        </div>
      </div>

      {wallet?.frozen && (
        <div className="mt-3 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          <b>Frozen:</b> {wallet.frozenReason}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {canMint && !showForm && (
          <Button onClick={() => mint()}>Mint coins</Button>
        )}
        {canAdjust && !showForm && (
          <Button variant="secondary" onClick={() => setShowForm(true)}>
            Adjust balance
          </Button>
        )}
        {canFreeze && wallet && (
          <Button variant={wallet.frozen ? 'secondary' : 'danger'} onClick={toggleFreeze}>
            {wallet.frozen ? 'Unfreeze' : 'Freeze'}
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={adjust} className="mt-4 space-y-3 border-t border-slate-200 pt-4">
          <div className="grid grid-cols-3 gap-2">
            <Field label="Currency">
              <Select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
                <option value="coins">Coins</option>
                <option value="beans">Beans</option>
              </Select>
            </Field>
            <Field label="Direction">
              <Select value={direction} onChange={(e) => setDirection(e.target.value as TxnDirection)}>
                <option value="credit">Credit (+)</option>
                <option value="debit">Debit (−)</option>
              </Select>
            </Field>
            <Field label="Amount">
              <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
          </div>
          <Field label="Reason (audit-logged)">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={adjusting || !amount || !reason}>
              {adjusting ? 'Saving…' : 'Apply'}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
