'use client';

import { useEffect, useMemo, useState } from 'react';

import { Card, ErrorAlert, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { authStorage, hasPermission } from '@/lib/auth';
import type { AppConfig } from '@/types';

/**
 * System config — kill switches for whole-feature toggles. Saves
 * immediately on toggle, with optimistic UI; reverts if the request
 * fails. Backend gates `family.create / .join` and `agency.create /
 * .assignHost` on these flags, and the public `/api/v1/system-config`
 * endpoint lets mobile clients hide entry points.
 */
export default function SettingsPage() {
  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canManage = hasPermission(permissions, 'system.config');

  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ config: AppConfig }>('/admin/system-config')
      .then((res) => {
        if (!cancelled) setConfig(res.config);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(key: 'familiesEnabled' | 'agenciesEnabled') {
    if (!config || !canManage) return;
    const next = !config[key];
    // Optimistic — flip immediately, revert on error.
    setConfig({ ...config, [key]: next });
    setSaving(key);
    setError(null);
    try {
      const res = await api<{ config: AppConfig }>('/admin/system-config', {
        method: 'PATCH',
        body: JSON.stringify({ [key]: next }),
      });
      setConfig(res.config);
    } catch (e: any) {
      setConfig({ ...config }); // revert
      setError(e.message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="System Settings"
        subtitle="Platform-wide kill switches. Disabling a feature blocks new creates and hides it on mobile; existing data is preserved and reads stay open."
      />

      {error && (
        <div className="mb-4">
          <ErrorAlert message={error} />
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading…
        </div>
      ) : !config ? (
        <ErrorAlert message="Couldn't load configuration." />
      ) : (
        <div className="space-y-4">
          <ToggleCard
            title="Family feature"
            body={
              <>
                When off, the mobile <em>Create Family</em> + <em>Join</em> flows are
                blocked at the API level. Existing families remain visible and
                their members keep their badges.
              </>
            }
            checked={config.familiesEnabled}
            disabled={!canManage || saving === 'familiesEnabled'}
            onToggle={() => toggle('familiesEnabled')}
          />
          <ToggleCard
            title="Agency feature"
            body={
              <>
                When off, no new agency can be created and no host can be
                assigned. Existing agencies and their hosts keep their
                contracts intact.
              </>
            }
            checked={config.agenciesEnabled}
            disabled={!canManage || saving === 'agenciesEnabled'}
            onToggle={() => toggle('agenciesEnabled')}
          />

          {!canManage && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              You're viewing this page in read-only mode — toggling requires
              the <code>system.config</code> permission.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ToggleCard({
  title,
  body,
  checked,
  disabled,
  onToggle,
}: {
  title: string;
  body: React.ReactNode;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <span
              className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                checked
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {checked ? 'enabled' : 'disabled'}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{body}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
            checked ? 'bg-brand-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
              checked ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    </Card>
  );
}
