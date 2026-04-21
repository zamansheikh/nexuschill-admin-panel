'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button, Card, ErrorAlert, Field, Input, PageHeader, Select } from '@/components/ui';
import { api } from '@/lib/api';
import type { Admin, AdminRole } from '@/types';

export default function NewAdminPage() {
  const router = useRouter();

  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [scopeId, setScopeId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ roles: AdminRole[] }>('/admin/roles').then((r) => setRoles(r.roles)).catch(() => {});
  }, []);

  const selectedRole = roles.find((r) => r.id === roleId);
  const needsScope = !!selectedRole?.scopeType;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        email,
        username,
        password,
        roleId,
        ...(displayName && { displayName }),
      };
      if (needsScope) {
        if (!scopeId) throw new Error('Scope id is required for this role');
        payload.scopeType = selectedRole!.scopeType;
        payload.scopeId = scopeId;
      }
      await api<{ admin: Admin }>('/admin/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      router.replace('/admins');
    } catch (err: any) {
      setError(err.message || 'Failed to create admin');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Create Admin"
        subtitle="Create a new admin-panel account (staff, agency, reseller, or custom role)"
      />

      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Email">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </Field>

          <Field label="Username" hint="Lowercase letters, numbers, underscores only">
            <Input
              required
              pattern="^[a-z0-9_]{3,30}$"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="admin_username"
            />
          </Field>

          <Field label="Display name (optional)">
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </Field>

          <Field label="Initial password" hint="Minimum 8 characters">
            <Input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          <Field label="Role">
            <Select required value={roleId} onChange={(e) => setRoleId(e.target.value)}>
              <option value="">Select a role…</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.displayName} ({r.name})
                  {r.scopeType ? ` — scoped to ${r.scopeType}` : ''}
                </option>
              ))}
            </Select>
          </Field>

          {selectedRole && (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {selectedRole.description}
              <div className="mt-1 flex flex-wrap gap-1">
                {selectedRole.permissions.map((p) => (
                  <span key={p} className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {needsScope && (
            <Field
              label={`${selectedRole?.scopeType?.toUpperCase()} ID`}
              hint="The MongoDB ObjectId of the specific agency/reseller this admin manages"
            >
              <Input
                required
                value={scopeId}
                onChange={(e) => setScopeId(e.target.value)}
                placeholder="507f1f77bcf86cd799439011"
              />
            </Field>
          )}

          {error && <ErrorAlert message={error} />}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating…' : 'Create admin'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
