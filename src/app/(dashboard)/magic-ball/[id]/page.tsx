'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import MagicBallTaskForm from '@/components/magic-ball-task-form';
import { Button, ErrorAlert, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import type { MagicBallTask } from '@/types';

export default function EditMagicBallTaskPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [task, setTask] = useState<MagicBallTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ task: MagicBallTask }>(
        `/admin/magic-ball/tasks/${id}`,
      );
      setTask(res.task);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function onDelete() {
    if (
      !confirm(
        'Delete this task permanently? Hosts already mid-progress today will lose it from their Magic Ball list (their coin counter is unaffected).',
      )
    ) {
      return;
    }
    try {
      await api(`/admin/magic-ball/tasks/${id}`, { method: 'DELETE' });
      router.push('/magic-ball');
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!task) return <ErrorAlert message={error || 'Task not found'} />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={task.label}
        subtitle={`Magic Ball task · ${task.kind} · goal ${task.goal} · +${task.rewardCoins.toLocaleString()} coins`}
        actions={
          <>
            <Button variant="secondary" onClick={() => router.back()}>
              ← Back
            </Button>
            <Button variant="danger" onClick={onDelete}>
              Delete
            </Button>
          </>
        }
      />
      {error && (
        <div className="mb-4">
          <ErrorAlert message={error} />
        </div>
      )}
      <MagicBallTaskForm initial={task} onSaved={(t) => setTask(t)} />
    </div>
  );
}
