
import { db, initializationSuccessful } from './firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc, query, where, orderBy, onSnapshot, getDoc, writeBatch } from "firebase/firestore";
import { User, Product, SiteProfile, Order, OrderStatus, ChatMessage, PointHistory, ActivityLog, ChatGroup, ChatSession, VipLevel, Coupon, CartItem, Review, ServiceRequest, ProductType, UserRole, StoreStatus, Report, STORE_LEVELS, Archive, Feedback, MEMBERSHIP_PLANS, MembershipTier, EventConfig } from '../types';
import { DEFAULT_PROFILE, ADMIN_ID, CLOUDINARY_CONFIG } from '../constants';

let isRemoteEnabled = initializationSuccessful && !!db;

const handleRemoteError = (error: any) => {
    console.error("Firestore Error:", error);
};

// OPTIMIZATION: Better compression logic (Fallback if Cloudinary not set)
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
                
                // Smart Resize: Maintain aspect ratio but limit max dimension
                const MAX_DIMENSION = 1080; 
                if (width > height) {
                    if (width > MAX_DIMENSION) {
                        height *= MAX_DIMENSION / width;
                        width = MAX_DIMENSION;
                    }
                } else {
                    if (height > MAX_DIMENSION) {
                        width *= MAX_DIMENSION / height;
                        height = MAX_DIMENSION;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                
                // Binary search-like quality reduction
                let quality = 0.8;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);
                
                // Loop to reduce size if still too big
                while (dataUrl.length / 1024 > maxSizeKB && quality > 0.3) {
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

// CLOUDINARY UPLOAD HANDLER
const uploadToCloudinary = async (file: File): Promise<string> => {
    if (!CLOUDINARY_CONFIG.cloudName || !CLOUDINARY_CONFIG.uploadPreset) {
        throw new Error("Cloudinary config missing");
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    
    // Optional: Add folder organization
    formData.append('folder', 'tamaonlyone_store');

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "Upload failed");
        }

        const data = await response.json();
        // Return secure_url (HTTPS)
        // Optimization: Auto-format to webp and limit width for performance
        let url = data.secure_url;
        
        // Inject transformations if possible (f_auto, q_auto, w_1000)
        // Cloudinary URL format: /upload/TRANSFORMATIONS/v1234/id.jpg
        const splitUrl = url.split('/upload/');
        if (splitUrl.length === 2) {
            url = `${splitUrl[0]}/upload/f_auto,q_auto,w_1000/${splitUrl[1]}`;
        }
        
        return url;
    } catch (error) {
        console.error("Cloudinary Error:", error);
        throw error;
    }
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

// Session Helper (Only for persisting ID across reloads, not Data Storage)
const safeJSONParse = <T>(key: string, fallback: T): T => {
    try {
        const item = localStorage.getItem(key);
        if (!item || item === "undefined" || item === "null") return fallback;
        return JSON.parse(item);
    } catch (e) {
        return fallback;
    }
};

// Strict Remote Collection Fetcher
const getCollection = async <T>(colName: string): Promise<T[]> => {
    if (!isRemoteEnabled || !db) {
        return []; 
    }
    try {
        const snap = await getDocs(collection(db, colName));
        return snap.docs.map(d => d.data() as T);
    } catch (error) {
        handleRemoteError(error);
        return [];
    }
};

const setDocument = async (colName: string, docId: string, data: any) => {
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
    if (isRemoteEnabled && db) {
        try { await deleteDoc(doc(db, colName, docId)); } catch(e) { handleRemoteError(e); }
    }
};

export const StorageService = {
  // Session management
  getSession: (): User | null => safeJSONParse<User | null>('tama_session', null),
  setSession: (user: User) => localStorage.setItem('tama_session', JSON.stringify(user)),
  clearSession: () => localStorage.removeItem('tama_session'),
  
  // UNIFIED UPLOAD FUNCTION
  // Tries Cloudinary first, falls back to Base64 compression
  uploadFile: async (file: File): Promise<string> => {
      // 1. Try Cloudinary
      if (CLOUDINARY_CONFIG.cloudName && CLOUDINARY_CONFIG.uploadPreset) {
          try {
              console.log("Uploading to Cloudinary...");
              return await uploadToCloudinary(file);
          } catch (e) {
              console.warn("Cloudinary upload failed, falling back to compression.", e);
          }
      }
      
      // 2. Fallback to Local Compression (Base64)
      return await compressImage(file, 300);
  },
  
  // Keep legacy for direct calls if needed
  compressImage: compressImage,

  getProfile: async (): Promise<SiteProfile> => {
    if (isRemoteEnabled && db) {
        try {
            const snap = await getDoc(doc(db, 'config', 'profile'));
            if (snap.exists()) return snap.data() as SiteProfile;
        } catch(e) { handleRemoteError(e); }
    }
    return DEFAULT_PROFILE;
  },
  saveProfile: async (profile: SiteProfile) => {
      await setDocument('config', 'profile', profile);
  },

  getUsers: async (): Promise<User[]> => {
      return await getCollection<User>('users');
  },
  saveUser: async (user: User) => {
      await setDocument('users', user.id, user);
      // Update session if it's the current user to keep local consistent with DB
      const session = StorageService.getSession();
      if(session && session.id === user.id) StorageService.setSession(user);
  },
  deleteUser: async (id: string) => { await deleteDocument('users', id); },
  
  findUser: async (identifier: string): Promise<User | undefined> => {
      if (!identifier) return undefined;
      if (isRemoteEnabled && db) {
          try {
             const docRef = doc(db, 'users', identifier);
             const docSnap = await getDoc(docRef);
             if (docSnap.exists()) {
                 return docSnap.data() as User;
             }
          } catch (e) { }
      }
      const users = await StorageService.getUsers();
      return users.find(u => u.id === identifier || u.username === identifier);
  },
  
  registerSeller: async (userId: string, storeName: string, description: string) => {
      const user = await StorageService.findUser(userId);
      if(!user) return false;
      user.isSeller = true;
      user.storeName = storeName;
      user.storeDescription = description;
      user.storeRating = 0;
      user.storeStatus = StoreStatus.ACTIVE;
      user.storeLevel = 1; 
      user.storeExp = 0;
      user.hasAcceptedSellerRules = true; // Auto accept if new
      await StorageService.saveUser(user);
      await StorageService.logActivity(userId, user.username, "OPEN_STORE", `Membuka toko baru: ${storeName}`);
      return true;
  },

  acceptSellerRules: async (userId: string) => {
      if (isRemoteEnabled && db) {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, { hasAcceptedSellerRules: true });
          const session = StorageService.getSession();
          if(session && session.id === userId) {
              session.hasAcceptedSellerRules = true;
              StorageService.setSession(session);
          }
      }
  },

  updateStoreStatus: async (userId: string, status: StoreStatus) => {
      const user = await StorageService.findUser(userId);
      if(!user || !user.isSeller) return;
      user.storeStatus = status;
      await StorageService.saveUser(user);
      await StorageService.logActivity(ADMIN_ID, "Administrator", "STORE_UPDATE", `Mengubah status toko ${user.storeName} menjadi ${status}`);
  },
  
  updateStoreExp: async (userId: string, exp: number, level: number) => {
      const user = await StorageService.findUser(userId);
      if(!user || !user.isSeller) return;
      user.storeExp = exp;
      user.storeLevel = level;
      await StorageService.saveUser(user);
      await StorageService.logActivity(ADMIN_ID, "Administrator", "STORE_LEVEL_UPDATE", `Update manual level toko ${user.storeName} ke Level ${level}`);
  },
  
  deleteStore: async (userId: string) => {
      const user = await StorageService.findUser(userId);
      if(!user) return;
      const storeName = user.storeName;
      user.isSeller = false;
      user.storeName = undefined;
      user.storeDescription = undefined;
      user.storeStatus = undefined;
      await StorageService.saveUser(user);
      const allProducts = await StorageService.getProducts();
      const sellerProducts = allProducts.filter(p => p.sellerId === userId);
      for(const p of sellerProducts) {
          await StorageService.deleteProduct(p.id);
      }
      await StorageService.logActivity(ADMIN_ID, "Administrator", "STORE_DELETE", `Menghapus toko ${storeName} dan produknya`);
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
      return [];
  },
  addToCart: async (userId: string, item: CartItem) => {
      if (isRemoteEnabled && db) {
          try { await setDoc(doc(db, `carts/${userId}/items`, item.id), cleanData(item)); } catch(e) { handleRemoteError(e); }
      }
  },
  removeFromCart: async (userId: string, itemId: string) => {
      if (isRemoteEnabled && db) {
          try { await deleteDoc(doc(db, `carts/${userId}/items`, itemId)); } catch(e) { handleRemoteError(e); }
      }
  },
  clearCart: async (userId: string) => {
      if (isRemoteEnabled && db) {
          try {
              const snap = await getDocs(collection(db, `carts/${userId}/items`));
              snap.docs.forEach(d => deleteDoc(d.ref));
          } catch(e) { handleRemoteError(e); }
      }
  },

  getProducts: async (): Promise<Product[]> => {
      return await getCollection<Product>('products');
  },
  
  getGlobalProducts: async (): Promise<Product[]> => {
      const all = await StorageService.getProducts();
      const adminProducts = all.filter(p => !p.sellerId);
      const sellerProducts = all.filter(p => p.sellerId);
      adminProducts.sort((a, b) => b.id.localeCompare(a.id));
      sellerProducts.sort((a, b) => b.id.localeCompare(a.id));
      return [...adminProducts, ...sellerProducts];
  },

  getSellerProducts: async (sellerId: string): Promise<Product[]> => {
      const all = await StorageService.getProducts();
      return all.filter(p => p.sellerId === sellerId);
  },

  saveProduct: async (product: Product) => { await setDocument('products', product.id, product); },
  deleteProduct: async (id: string) => { await deleteDocument('products', id); },
  
  toggleProductBoost: async (productId: string, isBoosted: boolean) => {
      if (isRemoteEnabled && db) {
          try {
              const productRef = doc(db, 'products', productId);
              await updateDoc(productRef, { isBoosted });
          } catch(e) { handleRemoteError(e); }
      }
      await StorageService.logActivity(ADMIN_ID, "Administrator", "PRODUCT_BOOST", `Mengubah status boost produk ${productId} menjadi ${isBoosted}`);
  },

  toggleFlashSale: async (productId: string, isFlashSale: boolean) => {
      if (isRemoteEnabled && db) {
          try {
              const productRef = doc(db, 'products', productId);
              await updateDoc(productRef, { isFlashSale });
          } catch(e) { handleRemoteError(e); }
      }
      await StorageService.logActivity(ADMIN_ID, "Administrator", "FLASH_SALE_UPDATE", `Mengubah status Flash Sale produk ${productId} menjadi ${isFlashSale}`);
  },

  getOrders: async (): Promise<Order[]> => {
      return await getCollection<Order>('orders');
  },
  subscribeToOrders: (callback: (orders: Order[]) => void) => {
      if (!isRemoteEnabled || !db) return () => {};
      try {
          const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
          return onSnapshot(q, (snap) => {
              callback(snap.docs.map(d => d.data() as Order));
          });
      } catch (e) { return () => {}; }
  },

  createOrder: async (order: Order) => {
      let finalOrder = { ...order };

      if (isRemoteEnabled && db) {
          try {
              const productRef = doc(db, 'products', order.productId);
              const productSnap = await getDoc(productRef);
              
              if (productSnap.exists()) {
                  const productData = productSnap.data() as Product;
                  finalOrder.originalPrice = productData.price;
                  
                  let discountAmount = 0;
                  if (order.couponCode) {
                      const coupons = await StorageService.getCoupons();
                      const coupon = coupons.find(c => c.code === order.couponCode);
                      if (coupon && coupon.isActive) {
                           discountAmount = coupon.discountAmount;
                           coupon.currentUsage = (coupon.currentUsage || 0) + 1;
                           await StorageService.saveCoupon(coupon);
                      }
                  }
                  
                  finalOrder.price = Math.max(0, productData.price - discountAmount);
              }
          } catch (e) {
              console.error("Failed to validate product price remotely", e);
          }
      }

      await setDocument('orders', finalOrder.id, finalOrder);
      await StorageService.logActivity(finalOrder.userId, finalOrder.username, "BUY", `Membuat pesanan ${finalOrder.productName} (#${finalOrder.id})`);
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
  
  updateOrderStatus: async (orderId: string, status: OrderStatus, actorName: string) => {
      if (isRemoteEnabled && db) {
          const snap = await getDoc(doc(db, 'orders', orderId));
          const order = snap.exists() ? snap.data() as Order : null;
          
          try {
              const orderRef = doc(db, 'orders', orderId);
              await updateDoc(orderRef, { status });
          } catch(e) { handleRemoteError(e); }

          if (status === OrderStatus.COMPLETED && order && order.sellerId) {
              const seller = await StorageService.findUser(order.sellerId);
              if (seller && seller.isSeller) {
                  const expGain = 10;
                  seller.storeExp = (seller.storeExp || 0) + expGain;
                  
                  const currentLevel = seller.storeLevel || 1;
                  const nextLevelData = STORE_LEVELS.find(l => l.level === currentLevel + 1);
                  
                  if (nextLevelData && seller.storeExp >= nextLevelData.expRequired) {
                      seller.storeLevel = nextLevelData.level;
                  }
                  await StorageService.saveUser(seller);
              }
          }
      }
      await StorageService.logActivity(actorName, actorName, "ORDER_UPDATE", `Mengubah status Order #${orderId} menjadi ${status}`);
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
      }

      const log: ActivityLog = { id: Date.now().toString() + Math.random(), userId, username: finalUsername, action, details, timestamp: new Date().toISOString() };
      await setDocument('logs', log.id, log);
  },

  subscribeToChats: (callback: (chats: ChatMessage[]) => void) => {
      if (!isRemoteEnabled || !db) return () => {};
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

  // CENTRALIZED POINT TRANSACTION HELPER
  addPointTransaction: async (userId: string, amount: number, type: 'ADD' | 'SUBTRACT', reason: string, actorName?: string) => {
      const user = await StorageService.findUser(userId);
      if(!user) return false;

      // Update User Balance
      if (type === 'ADD') {
          user.points += amount;
      } else {
          user.points = Math.max(0, user.points - amount);
      }
      await StorageService.saveUser(user);

      // Create Point History Log (For User)
      const history: PointHistory = { 
          id: Date.now().toString() + Math.random(), 
          userId: user.id, 
          type, 
          amount, 
          reason, 
          timestamp: new Date().toISOString() 
      };
      await setDocument('point_history', history.id, history);

      // Create Activity Log (For Admin/Audit)
      await StorageService.logActivity(
          actorName || user.username, 
          actorName || user.username, 
          "POINTS", 
          `${type === 'ADD' ? 'Menerima' : 'Menggunakan'} ${amount} Poin: ${reason}`
      );

      return true;
  },

  managePoints: async (adminName: string, userId: string, amount: number, type: 'ADD' | 'SUBTRACT') => {
      return await StorageService.addPointTransaction(userId, amount, type, `Adjustment oleh Admin`, adminName);
  },
  
  // NEW: Delete Point History by Reason (e.g., Clean up Lucky Wheel History)
  deletePointHistoryByReason: async (reasonKeyword: string): Promise<number> => {
      if (!isRemoteEnabled || !db) return 0;
      let count = 0;
      try {
          const batch = writeBatch(db);
          // Query all point history
          const snap = await getDocs(collection(db, 'point_history'));
          
          snap.forEach(doc => {
              const data = doc.data() as PointHistory;
              if (data.reason.toLowerCase().includes(reasonKeyword.toLowerCase())) {
                  batch.delete(doc.ref);
                  count++;
              }
          });
          
          if(count > 0) {
              await batch.commit();
          }
      } catch(e) {
          console.error("Cleanup Error:", e);
      }
      return count;
  },

  getCoupons: async (): Promise<Coupon[]> => getCollection<Coupon>('coupons'),
  saveCoupon: async (coupon: Coupon) => { await setDocument('coupons', coupon.id, coupon); },
  deleteCoupon: async (id: string) => { await deleteDocument('coupons', id); },
  
  validateCoupon: async (code: string, productId: string, sellerId?: string): Promise<{valid: boolean, discount: number, message: string}> => {
      if (sellerId) {
          return { valid: false, discount: 0, message: "Kupon hanya berlaku untuk produk Official." };
      }

      const coupons = await StorageService.getCoupons();
      const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());

      if (!coupon) return { valid: false, discount: 0, message: "Kode kupon tidak ditemukan." };
      if (!coupon.isActive) return { valid: false, discount: 0, message: "Kupon tidak aktif." };
      
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
          return { valid: false, discount: 0, message: "Kupon sudah kadaluarsa." };
      }

      if (coupon.maxUsage && (coupon.currentUsage || 0) >= coupon.maxUsage) {
          return { valid: false, discount: 0, message: "Kuota kupon habis." };
      }

      if (coupon.validProductIds && coupon.validProductIds.length > 0 && !coupon.validProductIds.includes(productId)) {
          return { valid: false, discount: 0, message: "Kupon tidak berlaku untuk produk ini." };
      }

      return { valid: true, discount: coupon.discountAmount, message: `Diskon Rp ${coupon.discountAmount.toLocaleString()} diterapkan!` };
  },

  createServiceRequest: async (req: ServiceRequest) => { await setDocument('service_requests', req.id, req); },
  
  getServiceRequests: async (): Promise<ServiceRequest[]> => {
      return await getCollection<ServiceRequest>('service_requests');
  },
  
  updateServiceRequestStatus: async (reqId: string, status: string) => {
      if(isRemoteEnabled && db) {
          try {
              const ref = doc(db, 'service_requests', reqId);
              await updateDoc(ref, { status });
          } catch(e) { handleRemoteError(e); }
      }
      await StorageService.logActivity(ADMIN_ID, "Administrator", "SERVICE_UPDATE", `Mengubah status Service Request ${reqId} menjadi ${status}`);
  },

  createReport: async (report: Report) => { await setDocument('reports', report.id, report); },
  getReports: async (): Promise<Report[]> => getCollection<Report>('reports'),
  deleteReport: async (id: string) => { await deleteDocument('reports', id); },

  createFeedback: async (feedback: Feedback) => { await setDocument('feedbacks', feedback.id, feedback); },
  getFeedbacks: async (): Promise<Feedback[]> => {
      const all = await getCollection<Feedback>('feedbacks');
      return all.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  deleteFeedback: async (id: string) => { await deleteDocument('feedbacks', id); },

  getArchives: async (): Promise<Archive[]> => getCollection<Archive>('archives'),
  
  runWeeklyCleanup: async (): Promise<{cleanedLogs: number, cleanedOrders: number}> => {
      if (!isRemoteEnabled || !db) return { cleanedLogs: 0, cleanedOrders: 0 };
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const cutoffISO = oneWeekAgo.toISOString();

      try {
          const batch = writeBatch(db);
          let opCount = 0;
          let deletedData: any[] = [];

          const logSnap = await getDocs(query(collection(db, 'logs'), where('timestamp', '<', cutoffISO)));
          logSnap.forEach(doc => {
              deletedData.push({ type: 'LOG', ...doc.data() });
              batch.delete(doc.ref);
              opCount++;
          });

          const orderSnap = await getDocs(query(collection(db, 'orders'), where('createdAt', '<', cutoffISO)));
          orderSnap.forEach(doc => {
              const data = doc.data() as Order;
              if (data.status === OrderStatus.COMPLETED || data.status === OrderStatus.CANCELLED) {
                  deletedData.push({ type: 'ORDER', ...data });
                  batch.delete(doc.ref);
                  opCount++;
              }
          });

          if (opCount > 0) {
              const archiveId = `arch_${Date.now()}`;
              const archiveContent = JSON.stringify(deletedData);
              const archive: Archive = {
                  id: archiveId,
                  date: new Date().toISOString(),
                  type: 'WEEKLY_CLEANUP',
                  dataCount: opCount,
                  sizeKB: Math.round(archiveContent.length / 1024),
                  content: archiveContent
              };
              
              const archiveRef = doc(db, 'archives', archiveId);
              batch.set(archiveRef, archive);
              
              await batch.commit();
              return { cleanedLogs: logSnap.size, cleanedOrders: opCount - logSnap.size };
          }
      } catch (e) {
          console.error("Cleanup failed:", e);
      }
      return { cleanedLogs: 0, cleanedOrders: 0 };
  },

  // SUBSCRIPTION
  buySubscription: async (userId: string, tierName: MembershipTier) => {
      const user = await StorageService.findUser(userId);
      if(!user) return false;
      
      const plan = MEMBERSHIP_PLANS.find(p => p.tier === tierName);
      if(!plan) return false;

      const now = new Date();
      let endDate = new Date();
      
      // If already active same tier, extend. If different tier, overwrite (simplified)
      if (user.subscriptionEndsAt && new Date(user.subscriptionEndsAt) > now && user.membershipTier === tierName) {
          endDate = new Date(user.subscriptionEndsAt);
      }
      
      endDate.setDate(endDate.getDate() + plan.duration);
      user.subscriptionEndsAt = endDate.toISOString();
      user.membershipTier = tierName;
      
      await StorageService.saveUser(user);
      
      // We don't record transaction here because that is handled by the "payment" function calling this
      // But we log the activity
      await StorageService.logActivity(userId, user.username, "SUBSCRIPTION", `Mengaktifkan ${plan.name}.`);
      return true;
  },

  // EVENT CONFIG
  getEventConfig: async (): Promise<EventConfig> => {
      if (isRemoteEnabled && db) {
          try {
             const snap = await getDoc(doc(db, 'config', 'event'));
             if(snap.exists()) return snap.data() as EventConfig;
          } catch(e) { handleRemoteError(e); }
      }
      // Default Mock Config
      return {
          isActive: true,
          spinCost: 100,
          prizes: [
              { id: '1', type: 'POINT', name: '20 Poin', value: 20, probability: 40 },
              { id: '2', type: 'POINT', name: '50 Poin', value: 50, probability: 30 },
              { id: '3', type: 'ZONK', name: 'Zonk', value: 0, probability: 20 },
              { id: '4', type: 'POINT', name: '100 Poin', value: 100, probability: 9 },
              { id: '5', type: 'SUBSCRIPTION', name: 'Elite Member', value: 0, probability: 1 }
          ]
      };
  },
  
  saveEventConfig: async (config: EventConfig) => {
      await setDocument('config', 'event', config);
  }
};
