import type { ApiEnvelope } from '@/types';

import { authStorage } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

let refreshingPromise: Promise<boolean> | null = null;

async function refreshAccess(): Promise<boolean> {
  if (refreshingPromise) return refreshingPromise;
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) return false;

  refreshingPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const body = (await res.json()) as ApiEnvelope<{
        tokens: { accessToken: string; refreshToken: string; accessExpiresIn: number; refreshExpiresIn: number };
      }>;
      if (!body.success || !body.data?.tokens) return false;
      authStorage.setTokens(body.data.tokens);
      return true;
    } catch {
      return false;
    } finally {
      refreshingPromise = null;
    }
  })();

  return refreshingPromise;
}

export async function api<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, skipRefresh = false, headers, ...init } = options;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((headers as Record<string, string>) || {}),
  };

  if (!skipAuth) {
    const token = authStorage.getAccessToken();
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: finalHeaders });

  if (res.status === 401 && !skipAuth && !skipRefresh) {
    const refreshed = await refreshAccess();
    if (refreshed) {
      return api<T>(path, { ...options, skipRefresh: true });
    }
    authStorage.clear();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }

  let body: ApiEnvelope<T>;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError('NETWORK_ERROR', `Request failed with status ${res.status}`, res.status);
  }

  if (!body.success) {
    throw new ApiError(
      body.error?.code || 'UNKNOWN',
      body.error?.message || 'Request failed',
      res.status,
      body.error?.details,
    );
  }

  return body.data;
}
