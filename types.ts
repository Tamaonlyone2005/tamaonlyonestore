
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

export interface User {
  id: string; 
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  banner?: string; // New: Banner Profil
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
