import type { Admin, AdminRole, AdminTokens } from '@/types';

const ACCESS_KEY = 'pa_admin_access';
const REFRESH_KEY = 'pa_admin_refresh';
const ADMIN_KEY = 'pa_admin_user';
const ROLE_KEY = 'pa_admin_role';

export const authStorage = {
  setTokens(tokens: AdminTokens) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  },
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_KEY);
  },
  setAdmin(admin: Admin, role: AdminRole) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
    localStorage.setItem(ROLE_KEY, JSON.stringify(role));
  },
  getAdmin(): Admin | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(ADMIN_KEY);
    return raw ? (JSON.parse(raw) as Admin) : null;
  },
  getRole(): AdminRole | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(ROLE_KEY);
    return raw ? (JSON.parse(raw) as AdminRole) : null;
  },
  clear() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(ADMIN_KEY);
    localStorage.removeItem(ROLE_KEY);
  },
};

export function hasPermission(perms: string[], required: string): boolean {
  if (perms.includes('*')) return true;
  if (perms.includes(required)) return true;
  const parts = required.split('.');
  for (let i = parts.length - 1; i > 0; i--) {
    const wildcard = parts.slice(0, i).join('.') + '.*';
    if (perms.includes(wildcard)) return true;
  }
  return false;
}
