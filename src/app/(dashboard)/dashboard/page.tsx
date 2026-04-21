'use client';

import { useEffect, useState } from 'react';

import { authStorage } from '@/lib/auth';
import type { Admin, AdminRole } from '@/types';

export default function DashboardPage() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);

  useEffect(() => {
    setAdmin(authStorage.getAdmin());
    setRole(authStorage.getRole());
  }, []);

  if (!admin || !role) return null;

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Welcome back, {admin.displayName || admin.username}.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card title="Your Role">
          <div className="text-xl font-bold text-slate-900">{role.displayName}</div>
          <div className="mt-1 text-sm text-slate-500">{role.description}</div>
          <div className="mt-3 inline-block rounded bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            {role.name}
          </div>
        </Card>

        <Card title="Account">
          <dl className="space-y-1 text-sm">
            <Row label="Email" value={admin.email} />
            <Row label="Username" value={admin.username} />
            <Row label="Status" value={admin.status} />
            <Row
              label="Last login"
              value={admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : 'Never'}
            />
            {admin.mustChangePassword && (
              <div className="mt-2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                You should change your password.
              </div>
            )}
          </dl>
        </Card>

        <Card title={`Permissions (${role.permissions.length})`}>
          <div className="flex flex-wrap gap-1">
            {role.permissions.map((p) => (
              <span
                key={p}
                className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700"
              >
                {p}
              </span>
            ))}
          </div>
        </Card>

        <Card title="Scope">
          {admin.scopeType ? (
            <>
              <div className="text-lg font-semibold capitalize text-slate-900">
                {admin.scopeType}
              </div>
              <div className="mt-1 font-mono text-xs text-slate-500">
                scope id: {admin.scopeId || '(none set)'}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                This account is restricted to data within its {admin.scopeType} scope.
              </p>
            </>
          ) : (
            <div className="text-slate-500">Global — no scope restriction.</div>
          )}
        </Card>
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Next up</h2>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>• Admin user management (create/update/disable admin accounts)</li>
          <li>• Roles management UI (edit role permissions, create custom roles)</li>
          <li>• App user management (once backend user module is ready)</li>
          <li>• Dashboards for recharge, withdrawals, moderation (as features land)</li>
        </ul>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="truncate font-medium text-slate-900">{value}</dd>
    </div>
  );
}
