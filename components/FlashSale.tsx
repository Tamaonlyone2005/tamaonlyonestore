
import React, { useState, useEffect } from 'react';
import { Zap, Clock } from 'lucide-react';

const FlashSale: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Set target to end of day today
    const target = new Date();
    target.setHours(23, 59, 59, 999);

    const interval = setInterval(() => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        clearInterval(interval);
        return;
      }

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-4 bg-gradient-to-r from-orange-600 to-red-600 p-4 rounded-2xl shadow-lg shadow-orange-500/20 mb-8 transform hover:scale-[1.01] transition-all cursor-pointer">
        <div className="p-2 bg-white/20 rounded-lg animate-pulse">
            <Zap size={24} className="text-yellow-300 fill-current"/>
        </div>
        <div className="flex-1">
            <h3 className="font-black text-white text-lg italic uppercase tracking-wider">Flash Sale</h3>
            <p className="text-white/80 text-xs font-medium">Diskon terbatas berakhir dalam:</p>
        </div>
        <div className="flex gap-2 text-white font-mono font-bold">
            <div className="bg-black/30 px-2 py-1 rounded-lg border border-white/10">
                {formatTime(timeLeft.hours)}<span className="text-[10px] block font-sans font-normal text-white/50 text-center">Jam</span>
            </div>
            <span className="mt-1">:</span>
            <div className="bg-black/30 px-2 py-1 rounded-lg border border-white/10">
                {formatTime(timeLeft.minutes)}<span className="text-[10px] block font-sans font-normal text-white/50 text-center">Mnt</span>
            </div>
            <span className="mt-1">:</span>
            <div className="bg-black/30 px-2 py-1 rounded-lg border border-white/10 text-yellow-400">
                {formatTime(timeLeft.seconds)}<span className="text-[10px] block font-sans font-normal text-white/50 text-center">Dtk</span>
            </div>
        </div>
    </div>
  );
};

export default FlashSale;
