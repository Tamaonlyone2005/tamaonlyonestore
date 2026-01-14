
import { VipLevel } from './types';

export const ADMIN_ID = "1401062606050004";
export const ADMIN_PASS = "260605";

// CLOUDINARY CONFIGURATION
export const CLOUDINARY_CONFIG = {
  cloudName: "rqm96fsd", // Pastikan ini sesuai dengan 'Cloud Name' di Dashboard Cloudinary Anda
  uploadPreset: "rqm96fsd", // SUDAH DIUPDATE: Sesuai screenshot Anda (Mode: Unsigned)
  apiKey: "" // Optional (biarkan kosong karena preset mode unsigned)
};

// UPDATE: Tambahkan detail pembayaran Anda di sini
export const PAYMENT_CONFIG = {
  qrisImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/1200px-QR_code_for_mobile_English_Wikipedia.svg.png", // GANTI dengan link foto QRIS Anda
  bankName: "DANA / BCA / MANDIRI",
  accountNumber: "0812XXXXXX / 12345678",
  accountHolder: "TAMA ONLY ONE"
};

export const DEFAULT_PROFILE = {
  name: "Tamaonlyone Store",
  description: "Pusat Top Up Game, Voucher, dan Produk Digital Terpercaya. Proses cepat, aman, dan harga bersahabat.",
  avatar: "https://picsum.photos/200",
  tags: ["Top Up Game", "Voucher Murah", "Joki Rank", "Akun Premium"],
  socials: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    discord: "https://discord.com",
    whatsapp: "https://wa.me/6281234567890", // Ganti dengan nomor WA Bisnis Asli
    email: "support@tamaonlyonestore.my.id" // Pastikan email ini aktif atau gunakan admin@...
  },
  isLocked: false,
  vipThresholds: {
    bronze: 5,
    silver: 15,
    gold: 30
  },
  botConfig: {
      isModerationActive: true,
      isAutoReplyActive: true,
      botName: "TamaBot 🤖",
      badWords: ["kasar", "anjing", "babi", "scam", "penipu"],
      autoReplyMessage: "Halo! Admin sedang tidak aktif saat ini. Mohon tinggalkan pesan, kami akan segera kembali. 🙏"
  }
};

export const APP_NAME = "Tamaonlyone Store";
export const COPYRIGHT = "@2026 Dominic Space Studio | Tamaonlyone All right reserved";
