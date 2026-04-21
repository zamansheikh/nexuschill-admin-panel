'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button, Card, ErrorAlert, Field, Input, PageHeader, Select, Textarea } from '@/components/ui';
import { api } from '@/lib/api';
import type { AdminRole, PermissionCategory } from '@/types';

export default function NewRolePage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('0');
  const [scopeType, setScopeType] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [categories, setCategories] = useState<PermissionCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ categories: PermissionCategory[] }>('/admin/permissions')
      .then((r) => setCategories(r.categories))
      .catch(() => {});
  }, []);

  function togglePerm(perm: string) {
    setPermissions((prev) => (prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]));
  }

  function toggleWholeResource(resource: PermissionCategory) {
    const wildcard = `${resource.resource}.*`;
    const allPerms = resource.permissions.map((p) => p.value);
    const hasWildcard = permissions.includes(wildcard);
    if (hasWildcard) {
      setPermissions((prev) => prev.filter((p) => p !== wildcard));
    } else {
      // toggle all under this resource → replace granular with wildcard
      setPermissions((prev) => [...prev.filter((p) => !allPerms.includes(p)), wildcard]);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (permissions.length === 0) {
      setError('Pick at least one permission');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name,
        displayName,
        description: description || undefined,
        permissions,
        priority: parseInt(priority, 10) || 0,
      };
      if (scopeType) payload.scopeType = scopeType;

      await api<{ role: AdminRole }>('/admin/roles', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      router.replace('/roles');
    } catch (err: any) {
      setError(err.message || 'Failed to create role');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Create Custom Role" subtitle="Define a new role with specific permissions" />

      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Role name (unique, machine)" hint="lowercase, underscores">
              <Input
                required
                pattern="^[a-z0-9_]{2,40}$"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase())}
                placeholder="gift_manager"
              />
            </Field>
            <Field label="Display name">
              <Input
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Gift Manager"
              />
            </Field>
          </div>

          <Field label="Description">
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Priority" hint="Higher shows first in lists">
              <Input
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              />
            </Field>
            <Field label="Scope (optional)" hint="Scoped roles only see their own agency/reseller data">
              <Select value={scopeType} onChange={(e) => setScopeType(e.target.value)}>
                <option value="">Global (no scope)</option>
                <option value="agency">Agency</option>
                <option value="reseller">Reseller</option>
              </Select>
            </Field>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Permissions ({permissions.length} selected)</h3>
              <button
                type="button"
                className="text-xs text-slate-500 hover:text-slate-700"
                onClick={() => setPermissions([])}
              >
                Clear all
              </button>
            </div>

            <div className="space-y-3">
              {categories.map((cat) => {
                const wildcard = `${cat.resource}.*`;
                const hasWildcard = permissions.includes(wildcard);
                return (
                  <div key={cat.resource} className="rounded-lg border border-slate-200 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-medium text-slate-800">{cat.label}</div>
                      <label className="flex items-center gap-1.5 text-xs">
                        <input
                          type="checkbox"
                          checked={hasWildcard}
                          onChange={() => toggleWholeResource(cat)}
                        />
                        <span className="text-slate-600">
                          All <code className="text-slate-500">{wildcard}</code>
                        </span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                      {cat.permissions.map((p) => (
                        <label
                          key={p.value}
                          className={`flex items-center gap-2 rounded px-2 py-1 text-xs ${
                            hasWildcard ? 'opacity-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={hasWildcard}
                            checked={hasWildcard || permissions.includes(p.value)}
                            onChange={() => togglePerm(p.value)}
                          />
                          <code className="text-slate-700">{p.value}</code>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {error && <ErrorAlert message={error} />}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating…' : 'Create role'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
