'use client';

import { useRouter } from 'next/navigation';

import MagicBallTaskForm from '@/components/magic-ball-task-form';
import { Button, PageHeader } from '@/components/ui';

export default function NewMagicBallTaskPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New Magic Ball task"
        subtitle="Define a daily quest — what to track, the goal, and the coin reward when it's claimed."
        actions={
          <Button variant="secondary" onClick={() => router.back()}>
            ← Back
          </Button>
        }
      />
      <MagicBallTaskForm onSaved={() => router.push('/magic-ball')} />
    </div>
  );
}
