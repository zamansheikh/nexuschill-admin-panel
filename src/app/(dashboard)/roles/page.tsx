'use client';

import { useEffect, useMemo, useState } from 'react';

import { Badge, Button, Card, ErrorAlert, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { authStorage, hasPermission } from '@/lib/auth';
import type { AdminRole } from '@/types';

export default function RolesPage() {
  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canManage = hasPermission(permissions, 'admin.role.manage');

  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ roles: AdminRole[] }>('/admin/roles')
      .then((r) => setRoles(r.roles.sort((a, b) => b.priority - a.priority)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Role-based access control — super admins can create custom roles"
        actions={canManage && <Button href="/roles/new">+ New Role</Button>}
      />

      {error && <ErrorAlert message={error} />}

      {loading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => (
            <Card key={r.id}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{r.displayName}</h3>
                  <code className="text-xs text-slate-500">{r.name}</code>
                </div>
                <div className="flex flex-col gap-1 text-right">
                  {r.isSystem ? <Badge tone="slate">system</Badge> : <Badge tone="brand">custom</Badge>}
                  {r.scopeType && <Badge tone="blue">{r.scopeType} scope</Badge>}
                </div>
              </div>
              <p className="mb-3 text-sm text-slate-600">{r.description}</p>
              <div className="flex flex-wrap gap-1">
                {r.permissions.map((p) => (
                  <code key={p} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700">
                    {p}
                  </code>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Priority: {r.priority}</span>
                <span>{r.active ? 'Active' : 'Inactive'}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
