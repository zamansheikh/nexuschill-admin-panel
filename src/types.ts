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

// ---------------- Families ----------------

export type FamilyStatus = 'active' | 'frozen' | 'disbanded';
export type FamilyJoinMode = 'review' | 'open' | 'invite_only';
export type FamilyMemberRole = 'leader' | 'co_leader' | 'member';
export type FamilyMemberStatusKind = 'active' | 'pending';

export interface Family {
  id: string;
  numericId?: number;
  name: string;
  coverUrl: string;
  coverPublicId: string;
  notification: string;
  joinMode: FamilyJoinMode;
  joinLevelRequirement: number;
  level: number;
  leaderId: string;
  coLeaderIds: string[];
  memberCount: number;
  status: FamilyStatus;
  soloSince?: string | null;
  lastNameChangedAt?: string | null;
  lastCoverChangedAt?: string | null;
  createdBy: string;
  creationFeePaid: number;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  /** Backend admin endpoint populates with display fields. */
  userId:
    | string
    | {
        id: string;
        username?: string;
        displayName?: string;
        numericId?: number;
        avatarUrl?: string;
      };
  role: FamilyMemberRole;
  status: FamilyMemberStatusKind;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------- System config ----------------

export interface AppConfig {
  id: string;
  key: 'singleton';
  familiesEnabled: boolean;
  agenciesEnabled: boolean;
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

/// Mirrors the backend GiftAssetType — the upload endpoint returns this so
/// the form can persist + the mobile overlay knows which player to use.
export type GiftAssetType = 'image' | 'svga' | 'lottie' | 'mp4' | 'none';

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
  thumbnailPublicId?: string;
  animationUrl: string;
  animationPublicId?: string;
  assetType?: GiftAssetType;
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

// ---------------- Daily Reward ----------------

export type RewardKind = 'coin' | 'cosmetic';

export interface DailyRewardItemConfig {
  kind: RewardKind;
  coinAmount?: number | null;
  /** Server stores ObjectId string; admin form keeps it as a string. */
  cosmeticItemId?: string | null;
  cosmeticDurationDays: number;
}

export interface DailyRewardDayConfig {
  day: number;
  rewards: DailyRewardItemConfig[];
  isBigReward: boolean;
}

export interface DailyRewardConfig {
  id: string;
  version: number;
  active: boolean;
  days: DailyRewardDayConfig[];
  createdAt: string;
  updatedAt: string;
}

// ---------------- Wallet — admin-managed lists ----------------

export interface RechargePackage {
  id: string;
  coins: number;
  bonusCoins: number;
  priceAmount: number;
  priceCurrency: string;
  badgeText: string;
  sortOrder: number;
  active: boolean;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeOption {
  id: string;
  diamondsRequired: number;
  coinsAwarded: number;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------- Moments ----------------

export type MomentStatus = 'active' | 'removed' | 'deleted';

export interface MomentMedia {
  url: string;
  publicId: string;
  kind: 'image' | 'video';
  width: number;
  height: number;
}

export interface Moment {
  id: string;
  /** Populated subdoc when listed via the admin endpoint. */
  authorId:
    | string
    | {
        id: string;
        username?: string;
        displayName?: string;
        numericId?: number;
        avatarUrl?: string;
      };
  text: string;
  media: MomentMedia[];
  likeCount: number;
  commentCount: number;
  status: MomentStatus;
  removedReason: string;
  removedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------- Agora ----------------

export interface AgoraConfigView {
  id: string;
  appId: string;
  /** Masked except last 4 chars. Empty string when not set. */
  appCertificateMasked: string;
  hasAppCertificate: boolean;
  defaultExpireSeconds: number;
  enabled: boolean;
  updatedAt?: string;
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
