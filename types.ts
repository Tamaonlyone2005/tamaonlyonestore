
export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST'
}

export enum VipLevel {
  NONE = 'NONE',
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD'
}

export enum StoreStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export type MembershipTier = 'NONE' | 'ELITE' | 'EPIC' | 'MASTER';

export interface User {
  id: string; 
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  banner?: string; 
  bio?: string; 
  points: number; 
  isVerified: boolean;
  isBanned: boolean;
  isVip: boolean;
  vipLevel: VipLevel;
  totalOrders: number;
  createdAt: string;
  redeemedCoupons: string[];
  wishlist: string[];
  lastLoginClaim?: string;
  followers: string[]; 
  following: string[];
  
  // SUBSCRIPTION
  membershipTier?: MembershipTier;
  subscriptionEndsAt?: string; // ISO Date
  lastFreeSpinClaim?: string;  // Track daily free spin

  // SELLER FIELDS
  isSeller?: boolean;
  storeName?: string;
  storeDescription?: string;
  storeRating?: number;
  storeStatus?: StoreStatus; 
  storeLevel?: number;
  storeExp?: number;
  hasAcceptedSellerRules?: boolean;
}

export interface ProductVariant {
  name: string; 
  price: number;
}

export type ProductType = 'ITEM' | 'SKIN' | 'JOKI' | 'REKBER' | 'VOUCHER' | 'OTHER';

export interface ProductInputRequirement {
  label: string; 
  key: string;   
  required: boolean;
  type: 'text' | 'number' | 'email' | 'textarea';
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  variants?: ProductVariant[];
  category?: string;
  type: ProductType; 
  inputFields?: ProductInputRequirement[]; 
  stock: number; 
  image?: string; 
  isFlashSale?: boolean;
  discountPrice?: number;
  discountEndsAt?: string;
  downloadUrl?: string;
  
  sellerId?: string; 
  sellerName?: string;
  sellerLevel?: number; 
  isVerifiedStore?: boolean; 
  
  isBoosted?: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  image?: string;
  price: number;
  variantName?: string;
  quantity: number;
  inputData: { [key: string]: string };
  note?: string;
  sellerId?: string; 
  couponCode?: string;
  discountAmount?: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  username: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  discountAmount: number;
  isPublic: boolean;
  isActive: boolean;
  validProductIds?: string[];
  maxUsage?: number;
  currentUsage?: number;
  expiresAt?: string;
}

export interface BotConfig {
  isModerationActive: boolean;
  isAutoReplyActive: boolean;
  botName: string;
  badWords: string[];
  autoReplyMessage: string;
}

export interface SiteProfile {
  name: string;
  description: string;
  avatar: string;
  tags: string[];
  socials: {
    facebook?: string;
    instagram?: string;
    discord?: string;
    whatsapp?: string;
    [key: string]: string | undefined;
  };
  isLocked: boolean;
  maintenanceMessage?: string;
  vipThresholds: {
    bronze: number;
    silver: number;
    gold: number;
  };
  botConfig?: BotConfig;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export enum OrderStatus {
  PENDING = 'PENDING', 
  PROCESSED = 'PROCESSED', 
  COMPLETED = 'COMPLETED', 
  CANCELLED = 'CANCELLED'
}

export interface Order {
  id: string;
  userId: string;
  username: string;
  whatsapp: string; 
  email: string; 
  gameData?: {
    [key: string]: string; 
  };
  productId: string;
  productName: string; 
  variantName?: string; 
  price: number;
  originalPrice: number;
  couponCode?: string;
  status: OrderStatus;
  paymentProof?: string;
  createdAt: string;
  downloadUrl?: string;
  sellerId?: string; 
}

export interface PointHistory {
  id: string;
  userId: string;
  type: 'ADD' | 'SUBTRACT';
  amount: number;
  reason: string;
  timestamp: string;
}

export interface ChatGroup {
  id: string;
  name: string;
  isClosed: boolean;
  createdAt: string;
  members: {
    userId: string;
    isMuted: boolean;
  }[];
}

export interface ChatSession {
  id: string; 
  userId: string; 
  receiverId?: string; 
  username: string; 
  userAvatar?: string;
  topic?: string;
  status: 'ACTIVE' | 'RESOLVED';
  lastMessageAt: string;
  isDirectMessage?: boolean; 
}

export interface ChatMessage {
  id: string;
  sessionId?: string;
  groupId?: string; 
  senderId: string;
  senderName: string;
  receiverId?: string;
  content: string;
  image?: string;
  isRead: boolean;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface ServiceRequest {
  id: string;
  name: string;
  contact: string;
  serviceType: string;
  budget: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' | 'REJECTED';
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  targetType: 'USER' | 'PRODUCT' | 'STORE';
  reason: string;
  description: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export interface Feedback {
  id: string;
  name: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  timestamp?: string; // Optional alias for createdAt for sorting consistency
}

export interface Archive {
    id: string;
    date: string;
    type: 'WEEKLY_CLEANUP';
    dataCount: number;
    sizeKB: number;
    content: string;
}

// EVENT TYPES
export type EventPrizeType = 'POINT' | 'ZONK' | 'SUBSCRIPTION';

export interface EventPrize {
  id: string;
  type: EventPrizeType;
  name: string;
  value: number;
  probability: number;
}

export interface EventConfig {
  isActive: boolean;
  spinCost: number;
  prizes: EventPrize[];
}

// Config Constants
export const STORE_LEVELS = [
  { level: 1, expRequired: 0, maxProducts: 5 },
  { level: 2, expRequired: 100, maxProducts: 10 },
  { level: 3, expRequired: 300, maxProducts: 20 },
  { level: 4, expRequired: 600, maxProducts: 50 },
  { level: 5, expRequired: 1000, maxProducts: 999 }
];

export const MEMBERSHIP_PLANS = [
    {
        tier: 'ELITE' as MembershipTier,
        name: 'Elite Member',
        price: 2000,
        duration: 7, // Days
        color: 'from-blue-600 to-blue-400',
        benefits: ['Bebas Biaya Admin', 'Badge Elite', '1x Free Spin / Hari']
    },
    {
        tier: 'EPIC' as MembershipTier,
        name: 'Epic Member',
        price: 7500,
        duration: 30, // Days
        color: 'from-purple-600 to-purple-400',
        benefits: ['Semua Benefit Elite', 'Bonus Poin 5%', 'Prioritas CS']
    },
    {
        tier: 'MASTER' as MembershipTier,
        name: 'Master Member',
        price: 20000,
        duration: 30, // Days
        color: 'from-yellow-600 to-yellow-400',
        benefits: ['Semua Benefit Epic', 'Bonus Poin 15%', '2x Free Spin / Hari', 'Akses Event Eksklusif']
    }
];