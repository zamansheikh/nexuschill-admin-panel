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
  totalDiamondsEarned: number;
  streamHours: number;
}

export interface AppUser {
  id: string;
  /** 7-digit public ID (e.g. 1234567). Backfilled on existing users. */
  numericId?: number;
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
  numericId?: number;
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
  totalDiamondsEarned: number;
  ownerAdminId?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------- Resellers ----------------

export interface Reseller {
  id: string;
  numericId?: number;
  name: string;
  code: string;
  description: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
  coinPool: number;
  creditLimit: number;
  commissionRate: number;
  lifetimeCoinsReceived: number;
  lifetimeCoinsAssigned: number;
  status: 'active' | 'suspended' | 'terminated';
  ownerAdminId?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ResellerLedgerType =
  | 'pool_topup'
  | 'pool_clawback'
  | 'assignment'
  | 'adjustment';

export interface ResellerLedgerEntry {
  id: string;
  idempotencyKey: string;
  resellerId: string;
  direction: 'credit' | 'debit';
  type: ResellerLedgerType;
  amount: number;
  reason: string;
  poolBalanceAfter: number;
  performedBy: string;
  recipientUserId?:
    | string
    | { id: string; username?: string; displayName?: string }
    | null;
  userTxnId?: string | null;
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
  diamondReward: number;
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
  totalDiamondReward: number;
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
  diamonds: number;
  lifetimeCoinsRecharged: number;
  lifetimeCoinsSpent: number;
  lifetimeDiamondsEarned: number;
  lifetimeDiamondsWithdrawn: number;
  frozen: boolean;
  frozenReason: string;
  frozenAt?: string | null;
  frozenBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Currency = 'coins' | 'diamonds';
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

// ---------------- Cosmetics ----------------

export type CosmeticType =
  | 'frame'
  | 'vehicle'
  | 'theme'
  | 'ring'
  | 'medal'
  | 'title'
  | 'room_card'
  | 'room_chat_bubble'
  | 'room_list_border'
  | 'mic_wave'
  | 'mic_skin'
  | 'special_gift_notification'
  | 'profile_background'
  | 'ludo_dice_skin'
  | 'dynamic_avatar';

export type CosmeticAssetType = 'image' | 'svga' | 'lottie' | 'mp4' | 'none';

export interface CosmeticItem {
  id: string;
  name: LocalizedString;
  code: string;
  description: LocalizedString;
  type: CosmeticType;
  previewUrl: string;
  previewPublicId: string;
  assetUrl: string;
  assetPublicId: string;
  assetType: CosmeticAssetType;
  rarity: number;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------- SVIP ----------------

export interface SvipPrivilegeDef {
  key: string;
  label: string;
  description: string;
  category: 'visibility' | 'chat' | 'profile' | 'gameplay' | 'identity' | 'protection';
}

export interface SvipTier {
  id: string;
  level: number;
  name: string;
  monthlyPointsRequired: number;
  coinReward: number;
  iconUrl: string;
  iconPublicId: string;
  bannerUrl: string;
  bannerPublicId: string;
  grantedItemIds: string[];
  privileges: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------- Store ----------------

export type StoreCategory = 'frame' | 'vehicle' | 'theme' | 'ring';

export interface StoreListing {
  id: string;
  /** Populated when fetched from admin endpoints; may be the bare ID. */
  cosmeticItemId: CosmeticItem | string;
  category: StoreCategory;
  priceCoins: number;
  durationDays: number;
  sortOrder: number;
  featured: boolean;
  active: boolean;
  startDate?: string | null;
  endDate?: string | null;
  giftable: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------- Banners ----------------

export type BannerLinkKind = 'none' | 'route' | 'room' | 'user' | 'web' | 'event';

export interface HomeBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  imagePublicId: string;
  linkKind: BannerLinkKind;
  linkValue: string;
  sortOrder: number;
  active: boolean;
  startDate?: string | null;
  endDate?: string | null;
  countries: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SplashBanner {
  id: string;
  title: string;
  imageUrl: string;
  imagePublicId: string;
  priority: number;
  active: boolean;
  startDate?: string | null;
  endDate?: string | null;
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
