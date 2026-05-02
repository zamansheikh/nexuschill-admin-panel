'use client';

import { FormEvent, useState } from 'react';

import { Button, Card, ErrorAlert, Field, Input, Select } from '@/components/ui';
import { api } from '@/lib/api';
import type { MagicBallTask, MagicBallTaskKind } from '@/types';

interface Props {
  initial?: MagicBallTask;
  onSaved: (t: MagicBallTask) => void;
}

const KINDS: { value: MagicBallTaskKind; label: string; hint: string }[] = [
  {
    value: 'mic_minutes',
    label: 'On mic — minutes',
    hint: 'Goal counts whole minutes the user spent on a mic seat today.',
  },
  {
    value: 'invites_completed',
    label: 'Invites accepted',
    hint: 'Goal counts unique users the host invited that took a seat.',
  },
  {
    value: 'gifts_sent',
    label: 'Gifts sent',
    hint: 'Goal counts gifts the user sent today (gift count, not coin total).',
  },
  {
    value: 'gifts_received',
    label: 'Gifts received',
    hint: 'Goal counts gifts the user received today.',
  },
  {
    value: 'chat_messages',
    label: 'Chat messages',
    hint: 'Goal counts chat messages the user posted in any room.',
  },
  {
    value: 'room_visitors',
    label: 'Room visitors',
    hint: 'Goal counts distinct visitors to the user’s owned room today.',
  },
];

export default function MagicBallTaskForm({ initial, onSaved }: Props) {
  const isEdit = !!initial;
  const [label, setLabel] = useState(initial?.label ?? '');
  const [kind, setKind] = useState<MagicBallTaskKind>(initial?.kind ?? 'mic_minutes');
  const [goal, setGoal] = useState(String(initial?.goal ?? 10));
  const [rewardCoins, setRewardCoins] = useState(String(initial?.rewardCoins ?? 3000));
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [active, setActive] = useState(initial?.active ?? true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        label,
        kind,
        goal: parseInt(goal, 10) || 1,
        rewardCoins: parseInt(rewardCoins, 10) || 0,
        sortOrder: parseInt(sortOrder, 10) || 0,
        active,
      };
      const res = isEdit
        ? await api<{ task: MagicBallTask }>(
            `/admin/magic-ball/tasks/${initial!.id}`,
            { method: 'PATCH', body: JSON.stringify(body) },
          )
        : await api<{ task: MagicBallTask }>('/admin/magic-ball/tasks', {
            method: 'POST',
            body: JSON.stringify(body),
          });
      onSaved(res.task);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Label"
          hint="Exactly what the host sees on the Magic Ball page (e.g. “On mic for 10 minutes”)."
        >
          <Input required value={label} onChange={(e) => setLabel(e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Kind"
            hint={KINDS.find((k) => k.value === kind)?.hint}
          >
            <Select
              value={kind}
              onChange={(e) => setKind(e.target.value as MagicBallTaskKind)}
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Goal" hint="How many units of `kind` to complete the task.">
            <Input
              type="number"
              min="1"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Reward coins" hint="Credited on claim.">
            <Input
              type="number"
              min="0"
              value={rewardCoins}
              onChange={(e) => setRewardCoins(e.target.value)}
            />
          </Field>
          <Field label="Sort order" hint="Higher = first">
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
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

        {error && <ErrorAlert message={error} />}

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
