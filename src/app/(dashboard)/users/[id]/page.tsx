'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Badge, Button, Card, ErrorAlert, Field, Input, PageHeader, Select } from '@/components/ui';
import WalletCard from '@/components/wallet-card';
import { api } from '@/lib/api';
import { authStorage, hasPermission } from '@/lib/auth';
import type { AdminRole, Agency, AppUser, PaginatedList, Reseller } from '@/types';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canBan = hasPermission(permissions, 'users.ban');
  const canHost = hasPermission(permissions, 'hosts.approve');
  const canPromote = hasPermission(permissions, 'admin.create') && hasPermission(permissions, 'users.edit');

  const [user, setUser] = useState<AppUser | null>(null);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([
        api<{ user: AppUser }>(`/admin/app-users/${id}`),
        api<{ roles: AdminRole[] }>(`/admin/roles`),
      ]);
      setUser(u.user);
      setRoles(r.roles);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function run<T>(label: string, fn: () => Promise<T>) {
    setBusy(label);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!user) return <ErrorAlert message={error || 'User not found'} />;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={user.displayName || user.username || 'User'}
        subtitle={`@${user.username || '(no username)'} — ${user.email || user.phone || '—'}`}
        actions={<Button variant="secondary" onClick={() => router.back()}>← Back</Button>}
      />

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Profile</h3>
          <dl className="space-y-1.5 text-sm">
            <Row label="ID" value={<code className="text-xs">{user.id}</code>} />
            <Row label="Display name" value={user.displayName || '—'} />
            <Row label="Email" value={user.email || '—'} />
            <Row label="Phone" value={user.phone || '—'} />
            <Row label="Country" value={user.country} />
            <Row label="Language" value={user.language} />
            <Row label="Level" value={`Lv. ${user.level} (${user.xp} XP)`} />
            <Row label="Status" value={
              user.status === 'banned' ? <Badge tone="red">banned</Badge>
              : user.status === 'suspended' ? <Badge tone="amber">suspended</Badge>
              : <Badge tone="green">{user.status}</Badge>
            } />
            <Row label="Created" value={new Date(user.createdAt).toLocaleString()} />
            <Row label="Last login" value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'} />
          </dl>
        </Card>

        <Card>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Flags</h3>
          <div className="mb-4 flex flex-wrap gap-2">
            {user.isHost && <Badge tone="brand">Host</Badge>}
            {user.linkedAdminId && <Badge tone="blue">Linked admin</Badge>}
            {user.emailVerified && <Badge tone="green">Email verified</Badge>}
            {user.phoneVerified && <Badge tone="green">Phone verified</Badge>}
          </div>

          {user.isHost && user.hostProfile && (
            <div className="rounded-lg bg-slate-50 p-3 text-xs">
              <div className="font-semibold text-slate-700">Host profile</div>
              <div>Tier: <b>{user.hostProfile.tier}</b></div>
              <div>Stream hours: {user.hostProfile.streamHours}</div>
              <div>Beans earned: {user.hostProfile.totalBeansEarned}</div>
              {user.hostProfile.agencyId && (
                <div>Agency: <code>{user.hostProfile.agencyId}</code></div>
              )}
            </div>
          )}

          {user.banReason && (
            <div className="mt-3 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              <b>Ban reason:</b> {user.banReason}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <WalletCard userId={user.id} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {canBan && (
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Moderation</h3>
            {user.status === 'banned' ? (
              <Button
                variant="secondary"
                disabled={busy === 'unban'}
                onClick={() => run('unban', () => api(`/admin/app-users/${user.id}/unban`, { method: 'POST' }))}
              >
                {busy === 'unban' ? 'Unbanning…' : 'Unban user'}
              </Button>
            ) : (
              <BanForm
                onBan={async (reason) => {
                  await run('ban', () =>
                    api(`/admin/app-users/${user.id}/ban`, {
                      method: 'POST',
                      body: JSON.stringify({ reason }),
                    }),
                  );
                }}
              />
            )}
          </Card>
        )}

        {canHost && (
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Host capability</h3>
            <p className="mb-3 text-xs text-slate-500">
              Hosts can broadcast live, run voice/video rooms, receive gifts, and earn beans.
            </p>
            {user.isHost ? (
              <Button
                variant="secondary"
                disabled={busy === 'unhost'}
                onClick={() =>
                  run('unhost', () =>
                    api(`/admin/app-users/${user.id}/toggle-host`, {
                      method: 'POST',
                      body: JSON.stringify({ isHost: false }),
                    }),
                  )
                }
              >
                {busy === 'unhost' ? 'Removing…' : 'Revoke host status'}
              </Button>
            ) : (
              <Button
                disabled={busy === 'host'}
                onClick={() =>
                  run('host', () =>
                    api(`/admin/app-users/${user.id}/toggle-host`, {
                      method: 'POST',
                      body: JSON.stringify({ isHost: true, tier: 'trainee' }),
                    }),
                  )
                }
              >
                {busy === 'host' ? 'Making…' : 'Make this user a host'}
              </Button>
            )}
          </Card>
        )}

        {canPromote && !user.linkedAdminId && (
          <Card className="md:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Promote to admin role</h3>
            <p className="mb-3 text-xs text-slate-500">
              Creates an admin-panel account linked to this user. Typically used for agency owners,
              resellers, or custom partner roles. The user keeps their mobile-app login as-is.
            </p>
            <PromoteForm
              user={user}
              roles={roles}
              onSubmit={async (payload) =>
                run('promote', () =>
                  api(`/admin/app-users/${user.id}/promote-to-admin`, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                  }),
                )
              }
            />
          </Card>
        )}

        {user.linkedAdminId && (
          <Card className="md:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Linked admin account</h3>
            <p className="mb-3 text-xs text-slate-500">
              This user already has an admin-panel account.
              <code className="ml-1 text-slate-700">adminId: {user.linkedAdminId}</code>
            </p>
            {canPromote && (
              <Button
                variant="danger"
                disabled={busy === 'unlink'}
                onClick={() =>
                  run('unlink', () =>
                    api(`/admin/app-users/${user.id}/unlink-admin`, { method: 'POST' }),
                  )
                }
              >
                {busy === 'unlink' ? 'Disabling…' : 'Disable & unlink admin account'}
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="max-w-[60%] truncate font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function BanForm({ onBan }: { onBan: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!reason) return;
        setBusy(true);
        try {
          await onBan(reason);
        } finally {
          setBusy(false);
          setReason('');
        }
      }}
      className="space-y-2"
    >
      <Input
        placeholder="Ban reason (required)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <Button type="submit" variant="danger" disabled={busy || !reason}>
        {busy ? 'Banning…' : 'Ban user'}
      </Button>
    </form>
  );
}

function PromoteForm({
  user,
  roles,
  onSubmit,
}: {
  user: AppUser;
  roles: AdminRole[];
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [roleId, setRoleId] = useState('');
  const [adminEmail, setAdminEmail] = useState(user.email || '');
  const [adminUsername, setAdminUsername] = useState(user.username || '');
  const [initialPassword, setInitialPassword] = useState('');
  const [scopeId, setScopeId] = useState('');
  const [busy, setBusy] = useState(false);

  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [resellers, setResellers] = useState<Reseller[]>([]);

  const selectedRole = roles.find((r) => r.id === roleId);
  const scopeType = selectedRole?.scopeType;

  // Only show roles that typically apply to partners (agency, reseller, or custom non-system)
  const promotableRoles = roles.filter((r) => !r.isSystem || r.scopeType !== null);

  // Lazy-load agencies / resellers when their scope type is selected
  useEffect(() => {
    if (scopeType === 'agency' && agencies.length === 0) {
      api<PaginatedList<Agency>>('/admin/agencies?limit=100&status=active')
        .then((r) => setAgencies(r.items))
        .catch(() => {});
    }
    if (scopeType === 'reseller' && resellers.length === 0) {
      api<PaginatedList<Reseller>>('/admin/resellers?limit=100&status=active')
        .then((r) => setResellers(r.items))
        .catch(() => {});
    }
  }, [scopeType, agencies.length, resellers.length]);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const payload: Record<string, unknown> = {
            roleId,
            adminEmail,
            adminUsername,
            initialPassword,
          };
          if (scopeType) {
            payload.scopeType = scopeType;
            if (scopeId) payload.scopeId = scopeId;
          }
          await onSubmit(payload);
        } finally {
          setBusy(false);
        }
      }}
      className="grid gap-3 md:grid-cols-2"
    >
      <Field label="Role">
        <Select required value={roleId} onChange={(e) => setRoleId(e.target.value)}>
          <option value="">Select role…</option>
          {promotableRoles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.displayName}{r.scopeType ? ` (${r.scopeType})` : ''}
            </option>
          ))}
        </Select>
      </Field>

      {scopeType === 'agency' && (
        <Field label="Agency" hint="The agency this admin will own/manage">
          <Select required value={scopeId} onChange={(e) => setScopeId(e.target.value)}>
            <option value="">Select agency…</option>
            {agencies.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} — {a.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {scopeType === 'reseller' && (
        <Field label="Reseller" hint="The reseller this admin will manage">
          <Select required value={scopeId} onChange={(e) => setScopeId(e.target.value)}>
            <option value="">Select reseller…</option>
            {resellers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code} — {r.name} (pool: {r.coinPool.toLocaleString()})
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Admin email" hint="Used to log into admin panel">
        <Input type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
      </Field>

      <Field label="Admin username">
        <Input
          required
          pattern="^[a-z0-9_]{3,30}$"
          value={adminUsername}
          onChange={(e) => setAdminUsername(e.target.value.toLowerCase())}
        />
      </Field>

      <Field label="Initial password" hint="Admin will be forced to change on first login">
        <Input
          type="password"
          required
          minLength={8}
          value={initialPassword}
          onChange={(e) => setInitialPassword(e.target.value)}
        />
      </Field>

      <div className="flex items-end">
        <Button type="submit" disabled={busy}>
          {busy ? 'Promoting…' : 'Promote to admin'}
        </Button>
      </div>
    </form>
  );
}
