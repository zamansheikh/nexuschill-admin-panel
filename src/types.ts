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

// ---------------- Agencies ----------------

export interface Agency {
  id: string;
  name: string;
  code: string;
  description: string;
  country: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  commissionRate: number;
  status: 'active' | 'suspended' | 'terminated';
  hostCount: number;
  totalBeansEarned: number;
  ownerAdminId?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------- Gifts ----------------

export type GiftCategory = 'basic' | 'premium' | 'legendary' | 'limited';

export interface LocalizedString {
  en: string;
  bn: string;
}

export interface Gift {
  id: string;
  name: LocalizedString;
  code: string;
  description: LocalizedString;
  category: GiftCategory;
  priceCoins: number;
  beanReward: number;
  thumbnailUrl: string;
  animationUrl: string;
  soundUrl: string;
  durationMs: number;
  active: boolean;
  startDate?: string | null;
  endDate?: string | null;
  vipOnly: boolean;
  svipOnly: boolean;
  countries: string[];
  comboMultipliers: number[];
  sortOrder: number;
  featured: boolean;
  totalSent: number;
  totalCoinsCollected: number;
  createdAt: string;
  updatedAt: string;
}

export interface GiftEvent {
  id: string;
  giftId: { id: string; code: string; name: LocalizedString } | string;
  senderId: { id: string; username: string; displayName: string; avatarUrl: string } | string;
  receiverId: { id: string; username: string; displayName: string; avatarUrl: string } | string;
  count: number;
  totalCoinAmount: number;
  totalBeanReward: number;
  contextType: string;
  message: string;
  status: 'completed' | 'reversed';
  createdAt: string;
}

// ---------------- Wallet ----------------

export interface Wallet {
  id: string;
  userId: string;
  coins: number;
  beans: number;
  lifetimeCoinsRecharged: number;
  lifetimeCoinsSpent: number;
  lifetimeBeansEarned: number;
  lifetimeBeansWithdrawn: number;
  frozen: boolean;
  frozenReason: string;
  frozenAt?: string | null;
  frozenBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Currency = 'coins' | 'beans';
export type TxnDirection = 'credit' | 'debit';
export type TxnType =
  | 'recharge'
  | 'recharge_bonus'
  | 'gift_send'
  | 'gift_receive'
  | 'withdrawal'
  | 'withdrawal_reversal'
  | 'admin_credit'
  | 'admin_debit'
  | 'event_reward'
  | 'referral_bonus'
  | 'task_reward'
  | 'refund'
  | 'conversion';

export interface Transaction {
  id: string;
  idempotencyKey: string;
  correlationId: string;
  walletId: string;
  userId: string;
  currency: Currency;
  direction: TxnDirection;
  amount: number;
  type: TxnType;
  description: string;
  refType?: string | null;
  refId?: string | null;
  balanceAfter: number;
  performedBy?: string | null;
  status: 'completed' | 'reversed';
  createdAt: string;
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
