import React from 'react';
import { Megaphone, Sparkles } from 'lucide-react';

const NewsTicker: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-brand-900 to-[#0f172a] border-b border-white/5 h-8 flex items-center overflow-hidden relative z-50">
      <div className="bg-brand-600 h-full px-3 flex items-center z-10 shrink-0">
        <Sparkles size={14} className="text-white animate-pulse fill-current" />
      </div>
      <div className="whitespace-nowrap overflow-hidden flex-1">
        <div className="animate-marquee inline-block text-xs font-bold text-gray-300">
          <span className="mx-4">🌌 Welcome to Midnight Aurora Season! Nikmati pengalaman belanja produk digital dengan tampilan baru yang elegan.</span>
          <span className="mx-4 text-brand-400">★</span>
          <span className="mx-4">🎮 Top Up Game Termurah & Tercepat 24 Jam Nonstop. Mobile Legends, PUBG, Free Fire, dan banyak lagi!</span>
          <span className="mx-4 text-brand-400">★</span>
          <span className="mx-4">🚀 Open Mitra Seller: Gabung komunitas kami dan mulai bisnis digitalmu sekarang juga. Gratis Pendaftaran!</span>
          <span className="mx-4 text-brand-400">★</span>
          <span className="mx-4">Dapatkan diskon spesial untuk Member VIP. Upgrade membership kamu di halaman Profil.</span>
        </div>
      </div>
      <style>{`
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};

export default NewsTicker;