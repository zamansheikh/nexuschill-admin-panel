'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import {
  Badge,
  Button,
  Card,
  ErrorAlert,
  Field,
  Input,
  PageHeader,
  Select,
} from '@/components/ui';
import { api } from '@/lib/api';
import { authStorage, hasPermission } from '@/lib/auth';
import type { AgoraConfigView } from '@/types';

export default function AgoraConfigPage() {
  const permissions = useMemo(() => authStorage.getRole()?.permissions ?? [], []);
  const canManage = hasPermission(permissions, 'agora.manage');

  const [cfg, setCfg] = useState<AgoraConfigView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const [appId, setAppId] = useState('');
  // Certificate input — server only updates when this is non-empty, so the
  // input starts blank even when a value is already stored.
  const [appCertificate, setAppCertificate] = useState('');
  const [defaultExpire, setDefaultExpire] = useState('3600');
  const [enabled, setEnabled] = useState(true);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ config: AgoraConfigView }>('/admin/agora/config');
      setCfg(res.config);
      setAppId(res.config.appId);
      setDefaultExpire(String(res.config.defaultExpireSeconds));
      setEnabled(res.config.enabled);
      // Don't pre-fill certificate — keep blank for "leave unchanged"
      // semantics; the masked value is shown alongside the input.
      setAppCertificate('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedAt(null);
    try {
      const body: Record<string, unknown> = {
        appId,
        defaultExpireSeconds: parseInt(defaultExpire, 10) || 3600,
        enabled,
      };
      if (appCertificate.trim().length > 0) {
        body.appCertificate = appCertificate.trim();
      }
      const res = await api<{ config: AgoraConfigView }>('/admin/agora/config', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setCfg(res.config);
      setAppCertificate('');
      setSavedAt(new Date().toLocaleTimeString());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function onTest() {
    setTesting(true);
    setTestResult(null);
    setError(null);
    try {
      const res = await api<{ ok: boolean; expireAt: string; appId: string }>(
        '/admin/agora/config/test',
        { method: 'POST' },
      );
      setTestResult(`OK — token signed against ${res.appId}, expires ${new Date(res.expireAt).toLocaleString()}`);
    } catch (e: any) {
      setError(`Test failed: ${e.message}`);
    } finally {
      setTesting(false);
    }
  }

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!cfg) return <ErrorAlert message={error || 'Failed to load Agora config'} />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Agora Settings"
        subtitle={
          <>
            RTC + RTM credentials. Used for live rooms, voice/video, and PK battles.{' '}
            <a
              className="text-brand underline"
              href="https://console.agora.io/"
              target="_blank"
              rel="noreferrer"
            >
              Get credentials from Agora Console
            </a>
            .
          </>
        }
        actions={
          canManage && (
            <Button variant="secondary" onClick={onTest} disabled={testing || !cfg.appId || !cfg.hasAppCertificate}>
              {testing ? 'Testing…' : 'Test signing'}
            </Button>
          )
        }
      />

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}
      {savedAt && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          Saved at {savedAt}. New credentials are effective immediately for all token requests.
        </div>
      )}
      {testResult && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          {testResult}
        </div>
      )}

      <Card>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Status">
            <div className="flex items-center gap-3">
              <Badge tone={enabled ? 'green' : 'amber'}>
                {enabled ? 'enabled' : 'disabled'}
              </Badge>
              <Select
                value={enabled ? 'true' : 'false'}
                onChange={(e) => setEnabled(e.target.value === 'true')}
              >
                <option value="true">Enabled — token endpoints active</option>
                <option value="false">Disabled — token endpoints return 503</option>
              </Select>
            </div>
          </Field>

          <Field
            label="App ID"
            hint="32-character ID from Agora Console → Project Management. Public — sent to mobile clients."
          >
            <Input
              required
              value={appId}
              onChange={(e) => setAppId(e.target.value.trim())}
              placeholder="e.g. 4604d0930fd945d28092a8c42e85ebc9"
              className="font-mono"
            />
          </Field>

          <Field
            label="App Certificate"
            hint={
              cfg.hasAppCertificate
                ? `Currently set (${cfg.appCertificateMasked}). Leave blank to keep, or paste a new value to rotate.`
                : 'Server-only secret. Used to sign RTC + RTM tokens. Required.'
            }
          >
            <Input
              type="password"
              autoComplete="off"
              value={appCertificate}
              onChange={(e) => setAppCertificate(e.target.value)}
              placeholder={cfg.hasAppCertificate ? cfg.appCertificateMasked : 'Paste new certificate'}
              className="font-mono"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Default token expiry (seconds)"
              hint="Used when the client doesn't override it. Min 60, max 86 400 (24 h)."
            >
              <Input
                type="number"
                min={60}
                max={86400}
                value={defaultExpire}
                onChange={(e) => setDefaultExpire(e.target.value)}
              />
            </Field>
            <Field label="Last updated">
              <div className="text-sm text-slate-600">
                {cfg.updatedAt ? new Date(cfg.updatedAt).toLocaleString() : '—'}
              </div>
            </Field>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <Button type="submit" disabled={saving || !canManage}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="mt-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-900">User-facing endpoints</h3>
        <ul className="space-y-1 text-xs text-slate-600">
          <li>
            <code className="rounded bg-slate-100 px-1.5 py-0.5">POST /api/v1/agora/rtc-token</code>{' '}
            — body: <code>{'{ channelName, uid?, role?, expireSeconds? }'}</code>
          </li>
          <li>
            <code className="rounded bg-slate-100 px-1.5 py-0.5">POST /api/v1/agora/rtm-token</code>{' '}
            — body: <code>{'{ uid, expireSeconds? }'}</code>
          </li>
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Both require a valid user JWT. Mobile clients should call these on every channel join — tokens
          expire and Agora rejects expired requests.
        </p>
      </Card>
    </div>
  );
}
