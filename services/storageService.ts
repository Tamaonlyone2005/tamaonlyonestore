
import { db, initializationSuccessful } from './firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc, query, where, orderBy, onSnapshot, getDoc } from "firebase/firestore";
import { User, Product, SiteProfile, Order, OrderStatus, ChatMessage, PointHistory, ActivityLog, ChatGroup, ChatSession, VipLevel, Coupon, CartItem, Review, ServiceRequest, ProductType, UserRole } from '../types';
import { DEFAULT_PROFILE, ADMIN_ID } from '../constants';

let isRemoteEnabled = initializationSuccessful && !!db;

const handleRemoteError = (error: any) => {
    const msg = error?.message || '';
    console.error("Firestore/Network Error:", error);
    if (error?.code === 'unavailable' || msg.includes('offline')) {
        console.warn("Switching to offline mode logic temporarily.");
    }
};

/**
 * UTILITY: COMPRESS IMAGE TO < 500KB
 */
export const compressImage = (file: File, maxSizeKB: number = 500): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Max dimensions to help size reduction
                const MAX_WIDTH = 1280;
                const MAX_HEIGHT = 1280;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // Start with high quality
                let quality = 0.9;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);
                
                // Loop to reduce quality if file is too big
                while (dataUrl.length / 1024 > maxSizeKB && quality > 0.1) {
                    quality -= 0.1;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }

                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

/**
 * GENERATE 50+ DUMMY PRODUCTS FOR PREVIEW
 */
const generateDefaultProducts = (): Product[] => {
    const products: Product[] = [];
    // ... Logic skipped ...
    return products;
};

const cleanData = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(v => cleanData(v)).filter(v => v !== undefined);
    const newObj: any = {};
    Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (value === undefined) return;
        if (value !== null && typeof value === 'object') newObj[key] = cleanData(value);
        else newObj[key] = value;
    });
    return newObj;
};

const safeJSONParse = <T>(key: string, fallback: T): T => {
    try {
        const item = localStorage.getItem(key);
        if (!item || item === "undefined" || item === "null") return fallback;
        return JSON.parse(item);
    } catch (e) {
        return fallback;
    }
};

const getCollection = async <T>(colName: string): Promise<T[]> => {
    if (!isRemoteEnabled || !db) return getLocalFallback<T>(colName);
    try {
        const snap = await getDocs(collection(db, colName));
        return snap.docs.map(d => d.data() as T);
    } catch (error) {
        handleRemoteError(error);
        return getLocalFallback<T>(colName);
    }
};

const setDocument = async (colName: string, docId: string, data: any) => {
    try {
        const key = `local_fallback_${colName}`;
        const existing = safeJSONParse<any[]>(key, []);
        const idx = existing.findIndex((i: any) => i.id === docId);
        const dataCopy = JSON.parse(JSON.stringify(data));
        if (idx >= 0) existing[idx] = dataCopy;
        else existing.push(dataCopy);
        localStorage.setItem(key, JSON.stringify(existing));
    } catch(e) {}

    if (isRemoteEnabled && db) {
        try {
            await setDoc(doc(db, colName, docId), cleanData(data));
        } catch (error) {
            handleRemoteError(error);
        }
    }
};

const deleteDocument = async (colName: string, docId: string) => {
    if (!docId) return;

    try {
        const key = `local_fallback_${colName}`;
        let existing = safeJSONParse<any[]>(key, []);
        existing = existing.filter((i: any) => i.id !== docId);
        localStorage.setItem(key, JSON.stringify(existing));
    } catch(e) {}

    if (isRemoteEnabled && db) {
        try {
            await deleteDoc(doc(db, colName, docId));
        } catch (e) {
            handleRemoteError(e);
        }
    }
};

const getLocalFallback = <T>(colName: string): T[] => safeJSONParse<T[]>(`local_fallback_${colName}`, []);

export const StorageService = {
  getSession: (): User | null => safeJSONParse<User | null>('tama_session', null),
  setSession: (user: User) => localStorage.setItem('tama_session', JSON.stringify(user)),
  clearSession: () => localStorage.removeItem('tama_session'),
  
  // Expose compressor
  compressImage: compressImage,

  getProfile: async (): Promise<SiteProfile> => {
    if (isRemoteEnabled && db) {
        try {
            const snap = await getDoc(doc(db, 'config', 'profile'));
            if (snap.exists()) return snap.data() as SiteProfile;
        } catch(e) { handleRemoteError(e); }
    }
    return safeJSONParse<SiteProfile>('local_fallback_profile', DEFAULT_PROFILE);
  },
  saveProfile: async (profile: SiteProfile) => {
      localStorage.setItem('local_fallback_profile', JSON.stringify(profile));
      if (isRemoteEnabled && db) {
          try { await setDoc(doc(db, 'config', 'profile'), cleanData(profile)); } catch(e) { handleRemoteError(e); }
      }
  },

  getUsers: async (): Promise<User[]> => {
      const res = await getCollection<User>('users');
      return res;
  },
  saveUser: async (user: User) => {
      await setDocument('users', user.id, user);
      const session = StorageService.getSession();
      if(session && session.id === user.id) StorageService.setSession(user);
  },
  deleteUser: async (id: string) => { await deleteDocument('users', id); },
  findUser: async (identifier: string): Promise<User | undefined> => {
      const users = await StorageService.getUsers();
      return users.find(u => u.id === identifier || u.username === identifier);
  },
  
  // SELLER FEATURE
  registerSeller: async (userId: string, storeName: string, description: string) => {
      const user = await StorageService.findUser(userId);
      if(!user) return false;
      
      user.isSeller = true;
      user.storeName = storeName;
      user.storeDescription = description;
      user.storeRating = 0;
      
      await StorageService.saveUser(user);
      await StorageService.logActivity(userId, user.username, "OPEN_STORE", `Membuka toko baru: ${storeName}`);
      return true;
  },

  followUser: async (followerId: string, targetId: string) => {
      const follower = await StorageService.findUser(followerId);
      const target = await StorageService.findUser(targetId);
      
      if(!follower || !target) return false;
      if(!follower.following) follower.following = [];
      if(!target.followers) target.followers = [];
      
      if(follower.following.includes(targetId)) return false; 

      follower.following.push(targetId);
      target.followers.push(followerId);
      
      await StorageService.saveUser(follower);
      await StorageService.saveUser(target);
      await StorageService.logActivity(followerId, follower.username, 'FOLLOW', `Mulai mengikuti ${target.username}`);
      return true;
  },
  
  unfollowUser: async (followerId: string, targetId: string) => {
      const follower = await StorageService.findUser(followerId);
      const target = await StorageService.findUser(targetId);
      
      if(!follower || !target) return false;
      
      follower.following = (follower.following || []).filter(id => id !== targetId);
      target.followers = (target.followers || []).filter(id => id !== followerId);
      
      await StorageService.saveUser(follower);
      await StorageService.saveUser(target);
      return true;
  },

  getCart: async (userId: string): Promise<CartItem[]> => {
      if (isRemoteEnabled && db) {
          try {
              const snap = await getDocs(collection(db, `carts/${userId}/items`));
              return snap.docs.map(d => d.data() as CartItem);
          } catch(e) { handleRemoteError(e); }
      }
      return safeJSONParse<CartItem[]>(`local_fallback_cart_${userId}`, []);
  },
  addToCart: async (userId: string, item: CartItem) => {
      const key = `local_fallback_cart_${userId}`;
      const existing = safeJSONParse<CartItem[]>(key, []);
      existing.push(item);
      localStorage.setItem(key, JSON.stringify(existing));
      if (isRemoteEnabled && db) {
          try { await setDoc(doc(db, `carts/${userId}/items`, item.id), cleanData(item)); } catch(e) { handleRemoteError(e); }
      }
  },
  removeFromCart: async (userId: string, itemId: string) => {
      const key = `local_fallback_cart_${userId}`;
      let existing = safeJSONParse<CartItem[]>(key, []);
      existing = existing.filter((i: CartItem) => i.id !== itemId);
      localStorage.setItem(key, JSON.stringify(existing));
      if (isRemoteEnabled && db) {
          try { await deleteDoc(doc(db, `carts/${userId}/items`, itemId)); } catch(e) { handleRemoteError(e); }
      }
  },
  clearCart: async (userId: string) => {
      localStorage.removeItem(`local_fallback_cart_${userId}`);
      if (isRemoteEnabled && db) {
          try {
              const snap = await getDocs(collection(db, `carts/${userId}/items`));
              snap.docs.forEach(d => deleteDoc(d.ref));
          } catch(e) { handleRemoteError(e); }
      }
  },

  getProducts: async (): Promise<Product[]> => {
      let products = await getCollection<Product>('products');
      if (products.length === 0) {
          products = [];
      }
      return products;
  },
  saveProduct: async (product: Product) => { await setDocument('products', product.id, product); },
  deleteProduct: async (id: string) => { 
      await deleteDocument('products', id); 
  },

  getOrders: async (): Promise<Order[]> => {
      return await getCollection<Order>('orders');
  },
  subscribeToOrders: (callback: (orders: Order[]) => void) => {
      if (!isRemoteEnabled || !db) {
          StorageService.getOrders().then(callback);
          return () => {};
      }
      try {
          const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
          return onSnapshot(q, (snap) => {
              callback(snap.docs.map(d => d.data() as Order));
          });
      } catch (e) { return () => {}; }
  },

  createOrder: async (order: Order) => {
      await setDocument('orders', order.id, order);
      await StorageService.logActivity(order.userId, order.username, "BUY", `Membuat pesanan ${order.productName} (#${order.id})`);
      return true;
  },
  uploadPaymentProof: async (orderId: string, proofImage: string) => {
      if (isRemoteEnabled && db) {
          try { 
              const orderRef = doc(db, 'orders', orderId);
              await updateDoc(orderRef, { paymentProof: proofImage }); 
          } catch(e) { handleRemoteError(e); }
      }
  },
  updateOrderStatus: async (orderId: string, status: OrderStatus, adminName: string) => {
      if (isRemoteEnabled && db) {
          try {
              const orderRef = doc(db, 'orders', orderId);
              await updateDoc(orderRef, { status });
          } catch(e) { handleRemoteError(e); }
      }
      await StorageService.logActivity(adminName, adminName, "ORDER_UPDATE", `Mengubah status Order #${orderId} menjadi ${status}`);
  },

  getLogs: async (): Promise<ActivityLog[]> => {
      const res = await getCollection<ActivityLog>('logs');
      return res.sort((a,b)=>new Date(b.timestamp).getTime()-new Date(a.timestamp).getTime());
  },
  
  logActivity: async (userId: string, username: string, action: string, details: string) => {
      let finalUsername = username;
      const user = await StorageService.findUser(userId);
      if (user && user.role === UserRole.ADMIN) {
          finalUsername = "Administrator";
      } else if (username.toLowerCase().includes('admin') || userId === ADMIN_ID) {
          finalUsername = "Administrator";
      }

      const log: ActivityLog = { id: Date.now().toString() + Math.random(), userId, username: finalUsername, action, details, timestamp: new Date().toISOString() };
      await setDocument('logs', log.id, log);
  },

  subscribeToChats: (callback: (chats: ChatMessage[]) => void) => {
      if (!isRemoteEnabled || !db) {
          callback(getLocalFallback<ChatMessage>('chats'));
          return () => {};
      }
      try {
          const q = query(collection(db, 'chats'), orderBy('timestamp', 'asc'));
          return onSnapshot(q, (snap) => callback(snap.docs.map(d => d.data() as ChatMessage)));
      } catch (e) { return () => {}; }
  },
  sendChat: async (message: ChatMessage) => { await setDocument('chats', message.id, message); },
  
  getChatSessions: async (): Promise<ChatSession[]> => getCollection<ChatSession>('chat_sessions'),
  
  createOrGetSession: async (userId: string, username: string, avatar: string = '', receiverId?: string): Promise<ChatSession> => {
      let sessionId = userId;
      let isDM = false;
      let topic = 'Support Ticket';
      
      if(receiverId && receiverId !== 'ADMIN') {
          const ids = [userId, receiverId].sort();
          sessionId = `${ids[0]}_${ids[1]}`;
          isDM = true;
          topic = 'Direct Message';
      }

      if (isRemoteEnabled && db) {
          const snap = await getDoc(doc(db, 'chat_sessions', sessionId));
          if(snap.exists()) return snap.data() as ChatSession;
      }
      
      const session: ChatSession = { 
          id: sessionId, 
          userId, 
          receiverId: receiverId || 'ADMIN', 
          username, 
          userAvatar: avatar, 
          status: 'ACTIVE', 
          lastMessageAt: new Date().toISOString(),
          isDirectMessage: isDM,
          topic
      };
      await setDocument('chat_sessions', session.id, session);
      return session;
  },

  getChatGroups: async (): Promise<ChatGroup[]> => getCollection<ChatGroup>('chat_groups'),
  createChatGroup: async (name: string): Promise<ChatGroup> => {
      const group: ChatGroup = { id: Date.now().toString(), name, isClosed: false, createdAt: new Date().toISOString(), members: [] };
      await setDocument('chat_groups', group.id, group);
      return group;
  },

  getReviews: async (productId: string): Promise<Review[]> => {
      const all = await getCollection<Review>('reviews');
      return all.filter(r => r.productId === productId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  addReview: async (review: Review) => { 
      await setDocument('reviews', review.id, review); 
      await StorageService.logActivity(review.userId, review.username, "REVIEW", `Memberikan ulasan pada produk`);
  },

  getPointHistory: async (userId: string): Promise<PointHistory[]> => {
      const all = await getCollection<PointHistory>('point_history');
      return all.filter(p => p.userId === userId).sort((a,b)=> new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  managePoints: async (adminName: string, userId: string, amount: number, type: 'ADD' | 'SUBTRACT') => {
      const user = await StorageService.findUser(userId);
      if(user) {
          if (type === 'ADD') user.points += amount; else user.points = Math.max(0, user.points - amount);
          await StorageService.saveUser(user);
          await StorageService.logActivity(adminName, adminName, "POINTS", `Mengubah poin user ${user.username} (${type === 'ADD' ? '+' : '-'}${amount})`);
      }
      const history: PointHistory = { id: Date.now().toString(), userId, type, amount, reason: `${type} oleh ${adminName}`, timestamp: new Date().toISOString() };
      await setDocument('point_history', history.id, history);
  },

  getCoupons: async (): Promise<Coupon[]> => getCollection<Coupon>('coupons'),
  saveCoupon: async (coupon: Coupon) => { await setDocument('coupons', coupon.id, coupon); },
  deleteCoupon: async (id: string) => { await deleteDocument('coupons', id); },

  createServiceRequest: async (req: ServiceRequest) => { await setDocument('service_requests', req.id, req); }
};
