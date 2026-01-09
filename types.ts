
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

export interface User {
  id: string; 
  shortId?: string; // UID 6 Angka Unik
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
  
  // SELLER FIELDS
  isSeller?: boolean;
  storeName?: string;
  storeDescription?: string;
  storeRating?: number;
  storeStatus?: StoreStatus; 
  storeLevel?: number; // Level Toko (1-5)
  storeExp?: number;   // Pengalaman Toko untuk naik level
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
  
  // SELLER FIELDS
  sellerId?: string; 
  sellerName?: string;
  sellerLevel?: number; // Menampilkan level seller di card produk
  isVerifiedStore?: boolean; // Lencana Oranye
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
  costPoints: number;
  isPublic: boolean;
  isActive: boolean;
  maxUsage?: number;
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
  isLocked: boolean; // Maintenance Mode
  maintenanceMessage?: string;
  vipThresholds: {
    bronze: number;
    silver: number;
    gold: number;
  };
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
  sellerId?: string; // Untuk EXP Seller
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
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetId: string; // Bisa ID User, ID Produk, atau ID Toko
  targetType: 'USER' | 'PRODUCT' | 'STORE';
  reason: string;
  description: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

// Konfigurasi Level Toko
export const STORE_LEVELS = [
  { level: 1, expRequired: 0, maxProducts: 5 },
  { level: 2, expRequired: 100, maxProducts: 10 },
  { level: 3, expRequired: 300, maxProducts: 20 },
  { level: 4, expRequired: 600, maxProducts: 50 },
  { level: 5, expRequired: 1000, maxProducts: 999 } // Unlimited
];
