'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { api } from '@/lib/api';
import { authStorage, hasPermission } from '@/lib/auth';

interface NavItem {
  href: string;
  label: string;
  permission?: string;
  icon?: string;
}

interface NavSection {
  /** Uppercase header shown above the group. Omit for the top dashboard row. */
  label?: string;
  items: NavItem[];
}

/**
 * Sections are intentionally semantic (what is this?) rather than
 * permission-shaped (who can see it?). A section is hidden entirely when
 * none of its items are visible to the current admin.
 */
const SECTIONS: NavSection[] = [
  {
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '■' },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/users', label: 'App Users', permission: 'users.view', icon: '◯' },
      { href: '/agencies', label: 'Agencies', permission: 'agency.view', icon: '◈' },
      { href: '/resellers', label: 'Resellers', permission: 'reseller.view', icon: '◇' },
    ],
  },
  {
    label: 'Monetization',
    items: [
      { href: '/gifts', label: 'Gifts', permission: 'gifts.view', icon: '✿' },
      { href: '/cosmetics', label: 'Cosmetics', permission: 'cosmetics.view', icon: '◆' },
      { href: '/store', label: 'Store', permission: 'store.view', icon: '⌂' },
      { href: '/svip', label: 'SVIP Tiers', permission: 'vip.view', icon: '★' },
    ],
  },
  {
    label: 'Engagement',
    items: [
      { href: '/banners', label: 'Home Banners', permission: 'banners.view', icon: '▭' },
      { href: '/splash', label: 'Splash Banners', permission: 'banners.view', icon: '▣' },
      { href: '/daily-reward', label: 'Daily Reward', permission: 'daily_reward.view', icon: '✓' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/transactions', label: 'Transactions', permission: 'transactions.view', icon: '$' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admins', label: 'Admin Users', permission: 'admin.view', icon: '◉' },
      { href: '/roles', label: 'Roles & Permissions', permission: 'admin.view', icon: '✦' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const admin = authStorage.getAdmin();
  const role = authStorage.getRole();
  const permissions = role?.permissions ?? [];

  async function onLogout() {
    const refreshToken = authStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await api('/admin/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        /* ignore */
      }
    }
    authStorage.clear();
    router.replace('/login');
  }

  // Filter items by permission, then drop sections that ended up empty.
  const visibleSections = SECTIONS.map((s) => ({
    ...s,
    items: s.items.filter(
      (item) => !item.permission || hasPermission(permissions, item.permission),
    ),
  })).filter((s) => s.items.length > 0);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
          NC
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">NexusChill</div>
          <div className="text-xs text-slate-500">Admin Console</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {visibleSections.map((section, idx) => (
          <div key={section.label ?? `top-${idx}`} className={idx === 0 ? '' : 'mt-4'}>
            {section.label && (
              <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active
                        ? 'bg-brand/10 text-brand'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="text-base opacity-80">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3">
        {admin && (
          <div className="mb-3 rounded-lg bg-slate-50 p-3">
            <div className="truncate text-sm font-medium text-slate-900">
              {admin.displayName || admin.username}
            </div>
            <div className="truncate text-xs text-slate-500">{admin.email}</div>
            {role && (
              <div className="mt-1 inline-block rounded bg-brand/10 px-1.5 py-0.5 text-xs font-medium text-brand">
                {role.displayName}
              </div>
            )}
          </div>
        )}
        <button
          onClick={onLogout}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
