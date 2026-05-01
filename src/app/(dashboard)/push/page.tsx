'use client';

import { useMemo, useState } from 'react';

import {
  Button,
  Card,
  ErrorAlert,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
} from '@/components/ui';
import { api } from '@/lib/api';
import { authStorage, hasPermission } from '@/lib/auth';

/**
 * Push Notifications composer.
 *
 * Single screen — title + body + optional image + tap deep-link +
 * audience picker. Posts to `/admin/notifications/push`, which:
 *   • persists a Notification row for every targeted user (so it
 *     also shows up in their in-app Notifications tab),
 *   • fans the realtime event so connected sockets see it instantly,
 *   • fires an FCM push to every registered device of the targets.
 *
 * The `payload` deep-link is the same vocabulary the mobile app uses
 * for in-app notification rows — `chat`/`user`/`room`/`route` route
 * to the corresponding screen on tap.
 */

type LinkKind = 'none' | 'route' | 'user' | 'room' | 'chat' | 'web';
type Kind = 'system' | 'activity' | 'family' | 'follow' | 'message';
type TargetType = 'all' | 'users';

export default function PushNotificationsPage() {
  const permissions = useMemo(
    () => authStorage.getRole()?.permissions ?? [],
    [],
  );
  const canPush = hasPermission(permissions, 'notifications.push');

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [kind, setKind] = useState<Kind>('system');
  const [linkKind, setLinkKind] = useState<LinkKind>('none');
  const [linkValue, setLinkValue] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('all');
  const [userIdsRaw, setUserIdsRaw] = useState('');

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!canPush) {
    return (
      <div>
        <PageHeader
          title="Push Notifications"
          subtitle="Send a push to one user, a list, or every active user."
        />
        <ErrorAlert message="You don't have the notifications.push permission." />
      </div>
    );
  }

  const onSend = async () => {
    setError(null);
    setResult(null);
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (linkKind !== 'none' && !linkValue.trim()) {
      setError('Link value is required when a link kind is set.');
      return;
    }
    const userIds =
      targetType === 'users'
        ? userIdsRaw
            .split(/[\s,]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
    if (targetType === 'users' && userIds.length === 0) {
      setError('Add at least one userId, or switch the audience to "All".');
      return;
    }

    setSending(true);
    try {
      const res = await api<{ delivered: number }>(
        '/admin/notifications/push',
        {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            body: body.trim() || undefined,
            imageUrl: imageUrl.trim() || undefined,
            kind,
            linkKind,
            linkValue: linkValue.trim() || undefined,
            target: { type: targetType, userIds },
          }),
        },
      );
      setResult(
        `Pushed to ${res.delivered} user${res.delivered === 1 ? '' : 's'}.`,
      );
      // Reset form so the admin can compose another push without
      // having to clear fields manually. Keeps the audience picker
      // sticky — most use cases stay on the same audience for a while.
      setTitle('');
      setBody('');
      setImageUrl('');
      setLinkKind('none');
      setLinkValue('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Push Notifications"
        subtitle="Send a push notification + FCM push to a specific user, a list, or every active user."
      />

      {error && <ErrorAlert message={error} />}
      {result && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {result}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Content
          </h3>
          <div className="space-y-4">
            <Field label="Title" hint="Short headline. Max 200 chars.">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="New season starts tomorrow"
              />
            </Field>
            <Field label="Body" hint="Optional preview text. Max 500 chars.">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Rewards reset at midnight UTC. Be the first on the leaderboard."
              />
            </Field>
            <Field label="Image URL" hint="Optional thumbnail / banner.">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="Kind" hint="Drives the icon shown in the inbox.">
              <Select
                value={kind}
                onChange={(e) => setKind(e.target.value as Kind)}
              >
                <option value="system">System</option>
                <option value="activity">Activity</option>
                <option value="family">Family</option>
                <option value="follow">Follow</option>
                <option value="message">Message</option>
              </Select>
            </Field>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Tap action (deep link)
          </h3>
          <div className="space-y-4">
            <Field
              label="Link kind"
              hint="What happens when the user taps the notification."
            >
              <Select
                value={linkKind}
                onChange={(e) => setLinkKind(e.target.value as LinkKind)}
              >
                <option value="none">None — just shows</option>
                <option value="route">Route (e.g. /wallet)</option>
                <option value="user">User profile (userId)</option>
                <option value="room">Audio room (roomId)</option>
                <option value="chat">1-1 chat (peer userId)</option>
                <option value="web">External web URL</option>
              </Select>
            </Field>
            {linkKind !== 'none' && (
              <Field
                label="Link value"
                hint={hintForLinkKind(linkKind)}
              >
                <Input
                  value={linkValue}
                  onChange={(e) => setLinkValue(e.target.value)}
                  placeholder={placeholderForLinkKind(linkKind)}
                />
              </Field>
            )}
          </div>

          <h3 className="mb-4 mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Audience
          </h3>
          <div className="space-y-4">
            <Field
              label="Send to"
              hint="`All` targets every active (non-banned) user."
            >
              <Select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as TargetType)}
              >
                <option value="all">All active users</option>
                <option value="users">Specific user IDs</option>
              </Select>
            </Field>
            {targetType === 'users' && (
              <Field
                label="User IDs"
                hint="One Mongo _id per line, or comma/space separated. Max 10,000."
              >
                <Textarea
                  value={userIdsRaw}
                  onChange={(e) => setUserIdsRaw(e.target.value)}
                  rows={4}
                  placeholder={'68f3c1e8ff6ecfc43a701bbf\n68fc18c2…'}
                />
              </Field>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2">
        <Button onClick={onSend} disabled={sending}>
          {sending ? 'Sending…' : 'Send Push'}
        </Button>
      </div>
    </div>
  );
}

function hintForLinkKind(k: LinkKind): string {
  switch (k) {
    case 'route':
      return 'In-app route path, e.g. `/wallet`, `/store`.';
    case 'user':
      return 'Mongo _id of the user to open the public profile of.';
    case 'room':
      return 'Mongo _id of the audio room.';
    case 'chat':
      return 'Mongo _id of the peer user — opens the 1-1 thread.';
    case 'web':
      return 'Full https URL.';
    default:
      return '';
  }
}

function placeholderForLinkKind(k: LinkKind): string {
  switch (k) {
    case 'route':
      return '/wallet';
    case 'user':
    case 'room':
    case 'chat':
      return '68f3c1e8ff6ecfc43a701bbf';
    case 'web':
      return 'https://example.com/promo';
    default:
      return '';
  }
}
