
import React from 'react';
import { Megaphone } from 'lucide-react';

const NewsTicker: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-brand-900 to-[#0f172a] border-b border-white/5 h-8 flex items-center overflow-hidden relative z-50">
      <div className="bg-brand-600 h-full px-3 flex items-center z-10 shrink-0">
        <Megaphone size={14} className="text-white animate-pulse" />
      </div>
      <div className="whitespace-nowrap overflow-hidden flex-1">
        <div className="animate-marquee inline-block text-xs font-bold text-gray-300">
          <span className="mx-4">🔥 Flash Sale Diamond Mobile Legends diskon 20% hari ini!</span>
          <span className="mx-4 text-brand-400">•</span>
          <span className="mx-4">Server PUBG Mobile sedang maintenance hingga 10:00 WIB.</span>
          <span className="mx-4 text-brand-400">•</span>
          <span className="mx-4">Gunakan kode "TAMA2025" untuk diskon pengguna baru.</span>
          <span className="mx-4 text-brand-400">•</span>
          <span className="mx-4">Open Recruitment Reseller - Hubungi Admin sekarang!</span>
        </div>
      </div>
      <style>{`
        .animate-marquee {
          animation: marquee 20s linear infinite;
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
