// ---------------- Admin (staff + partners) ----------------

export interface Admin {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  roleId: string;
  scopeType: 'agency' | 'reseller' | null;
  scopeId: string | null;
  status: 'active' | 'disabled' | 'locked';
  mustChangePassword: boolean;
  lastLoginAt?: string;
  lastLoginIp?: string;
  linkedUserId?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRole {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  scopeType: 'agency' | 'reseller' | null;
  priority: number;
  active: boolean;
}

export interface AdminTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
}

export interface MeResponse {
  admin: Admin;
  role: AdminRole;
  permissions: string[];
  scope: { type: 'agency' | 'reseller'; id: string | null } | null;
}

// ---------------- App users ----------------

export type HostTier = 'trainee' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface HostProfile {
  tier: HostTier;
  approvedAt: string;
  approvedBy?: string | null;
  agencyId?: string | null;
  totalBeansEarned: number;
  streamHours: number;
}

export interface AppUser {
  id: string;
  email?: string;
  phone?: string;
  username?: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  language: string;
  country: string;
  status: 'active' | 'suspended' | 'banned' | 'deleted';
  banReason?: string;
  bannedAt?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt?: string;
  level: number;
  xp: number;
  isHost: boolean;
  hostProfile?: HostProfile | null;
  linkedAdminId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------- Permissions ----------------

export interface PermissionItem {
  value: string;
  label: string;
  description?: string;
}

export interface PermissionCategory {
  resource: string;
  label: string;
  permissions: PermissionItem[];
}

// ---------------- API envelopes ----------------

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: {
    code: string;
    message: string;
    details?: unknown;
  } | null;
  meta: {
    traceId?: string;
    timestamp: string;
  };
}

export interface PaginatedList<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}
