
import React from 'react';
import { Megaphone, Moon } from 'lucide-react';

const NewsTicker: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-brand-900 to-[#0f172a] border-b border-white/5 h-8 flex items-center overflow-hidden relative z-50">
      <div className="bg-brand-600 h-full px-3 flex items-center z-10 shrink-0">
        <Moon size={14} className="text-gold-400 animate-pulse fill-current" />
      </div>
      <div className="whitespace-nowrap overflow-hidden flex-1">
        <div className="animate-marquee inline-block text-xs font-bold text-gray-300">
          <span className="mx-4">🌙 Marhaban Ya Ramadhan! Diskon Berkah Sahur s/d 50% untuk Top Up Mobile Legends & PUBG!</span>
          <span className="mx-4 text-gold-500">★</span>
          <span className="mx-4">🕌 Open Recruitment Mitra Seller: Jadilah Sultan di Bulan Suci! Buka Toko Gratis & Raih Cuan Jutaan Rupiah.</span>
          <span className="mx-4 text-gold-500">★</span>
          <span className="mx-4">Ngabuburit makin seru dengan Voucher Game Hemat di Tamaonlyone Store.</span>
          <span className="mx-4 text-gold-500">★</span>
          <span className="mx-4">Sahur Sale dimulai pukul 03.00 - 05.00 WIB setiap hari. Jangan lewatkan!</span>
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
