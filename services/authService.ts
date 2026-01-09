
import { User, UserRole, AuthResponse, VipLevel } from '../types';
import { StorageService } from './storageService';
import { auth, googleProvider } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut, sendPasswordResetEmail } from "firebase/auth";

export const AuthService = {
  
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      if (!auth) throw new Error("Authentication service unavailable");
      
      // LOGIN MELALUI FIREBASE (Aman)
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      let userData = await StorageService.findUser(firebaseUser.uid);

      // JIKA USER BELUM ADA DI DATABASE LOKAL
      if (!userData) {
          userData = {
              id: firebaseUser.uid,
              username: firebaseUser.displayName || email.split('@')[0],
              email: email,
              role: UserRole.MEMBER,
              avatar: firebaseUser.photoURL || '',
              points: 0,
              isVerified: false,
              isBanned: false,
              isVip: false,
              vipLevel: VipLevel.NONE,
              totalOrders: 0,
              createdAt: new Date().toISOString(),
              redeemedCoupons: [],
              wishlist: [],
              followers: [],
              following: []
          };
          await StorageService.saveUser(userData);
      }

      // SECURITY CHECK: BANNED USER
      if (userData.isBanned) {
          await signOut(auth);
          return { success: false, message: 'Akun ditangguhkan. Hubungi support.' };
      }

      // AUTO-PROMOTE OWNER (Email Baru: aldipranatapratama2005@gmail.com)
      if (userData.email === 'aldipranatapratama2005@gmail.com') {
          userData.role = UserRole.ADMIN;
          userData.isVip = true;
          userData.vipLevel = VipLevel.GOLD;
          await StorageService.saveUser(userData);
      }

      StorageService.setSession(userData);
      await StorageService.logActivity(userData.id, userData.username, 'LOGIN', 'Login via Email');
      
      return { success: true, message: 'Login berhasil.', user: userData };

    } catch (error: any) {
      console.error("Login Error:", error.code);
      let msg = "Login gagal. Periksa email dan password.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          msg = "Email atau password salah.";
      } else if (error.code === 'auth/too-many-requests') {
          msg = "Terlalu banyak percobaan. Silakan tunggu beberapa saat.";
      }
      return { success: false, message: msg };
    }
  },

  register: async (username: string, email: string, password: string, avatar: string): Promise<AuthResponse> => {
    try {
        if (!auth) throw new Error("Authentication service unavailable");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        const newUser: User = {
          id: firebaseUser.uid,
          username: username,
          email: email,
          role: UserRole.MEMBER,
          avatar: avatar,
          points: 0, 
          isVerified: false,
          isBanned: false,
          isVip: false,
          createdAt: new Date().toISOString(),
          vipLevel: VipLevel.NONE,
          totalOrders: 0,
          redeemedCoupons: [],
          wishlist: [],
          followers: [],
          following: []
        };

        await StorageService.saveUser(newUser);
        StorageService.setSession(newUser);
        return { success: true, message: 'Registrasi berhasil!', user: newUser };
    } catch (error: any) {
        let msg = "Gagal mendaftar.";
        if (error.code === 'auth/email-already-in-use') msg = "Email sudah digunakan.";
        if (error.code === 'auth/weak-password') msg = "Password terlalu lemah (min 6 karakter).";
        return { success: false, message: msg };
    }
  },

  loginWithGoogle: async (): Promise<AuthResponse> => {
      try {
          if (!auth || !googleProvider) throw new Error("Google Auth unavailable");
          const result = await signInWithPopup(auth, googleProvider);
          const firebaseUser = result.user;

          let userData = await StorageService.findUser(firebaseUser.uid);

          if (!userData) {
              userData = {
                  id: firebaseUser.uid,
                  username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                  email: firebaseUser.email || '',
                  role: UserRole.MEMBER,
                  avatar: firebaseUser.photoURL || '',
                  points: 0,
                  isVerified: true,
                  isBanned: false,
                  isVip: false,
                  vipLevel: VipLevel.NONE,
                  totalOrders: 0,
                  createdAt: new Date().toISOString(),
                  redeemedCoupons: [],
                  wishlist: [],
                  followers: [],
                  following: []
              };
              await StorageService.saveUser(userData);
          }

          if (userData.isBanned) return { success: false, message: 'Akun ditangguhkan.' };
          
          // Sinkronisasi khusus owner (Email Baru)
          if (userData.email === 'aldipranatapratama2005@gmail.com') {
              userData.role = UserRole.ADMIN;
              await StorageService.saveUser(userData);
          }

          StorageService.setSession(userData);
          return { success: true, message: `Halo ${userData.username}!`, user: userData };
      } catch (error: any) {
          return { success: false, message: "Login Google dibatalkan." };
      }
  },

  logout: async () => {
    if (auth) await signOut(auth);
    StorageService.clearSession();
  },

  resetPassword: async (email: string): Promise<AuthResponse> => {
      try {
          if (!auth) throw new Error("Auth unavailable");
          await sendPasswordResetEmail(auth, email);
          console.log("Reset email sent to:", email);
          return { success: true, message: "Link reset password telah dikirim ke email Anda. Cek Inbox/Spam." };
      } catch (error: any) {
          console.error("Reset Password Error Full:", error);
          let msg = "Gagal mengirim email reset.";
          
          if (error.code === 'auth/user-not-found') {
              msg = "Email tidak terdaftar di sistem Autentikasi.";
          } else if (error.code === 'auth/invalid-email') {
              msg = "Format email salah.";
          } else if (error.code === 'auth/unauthorized-domain') {
              msg = "Domain preview ini belum diizinkan oleh Firebase. Coba di Localhost atau Deploy.";
          }
          
          return { success: false, message: msg };
      }
  },

  updatePassword: async (userId: string, newPassword: string): Promise<AuthResponse> => {
      return { success: false, message: 'Gunakan fitur "Lupa Password" di halaman login untuk mengganti sandi.' };
  }
};
