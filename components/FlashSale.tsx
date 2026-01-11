
import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

const FlashSale: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // REAL FLASH SALE LOGIC:
    // Set target to a fixed date in the future (e.g., End of Current Month or specific promo date)
    // This ensures all users see the same countdown and it doesn't reset on refresh.
    
    const now = new Date();
    // Logic: Flash sale ends at the next midnight (Daily Deal) 
    // OR set a specific date like: const target = new Date('2025-12-31T23:59:59');
    
    // Using "Next Midnight" ensures it's consistent for the day without being a "fake 24h reset" on every reload.
    const target = new Date();
    target.setHours(24, 0, 0, 0); // Sets to 00:00:00 of tomorrow

    const calculateTime = () => {
      const currentTime = new Date();
      const diff = target.getTime() - currentTime.getTime();

      if (diff <= 0) {
        // Option: Reset for next day automatically, or show "Ended"
        // For continuous engagement, we reset target to next midnight relative to *now*
        target.setDate(target.getDate() + 1);
        return; 
      }

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTime(); // Initial call to avoid delay
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-4 bg-gradient-to-r from-orange-600 to-red-600 p-4 rounded-2xl shadow-lg shadow-orange-500/20 mb-8 transform hover:scale-[1.01] transition-all cursor-pointer border border-white/10">
        <div className="p-2 bg-white/20 rounded-lg animate-pulse">
            <Zap size={24} className="text-yellow-300 fill-current"/>
        </div>
        <div className="flex-1">
            <h3 className="font-black text-white text-lg italic uppercase tracking-wider">Flash Sale</h3>
            <p className="text-white/80 text-xs font-medium">Promo Harian Berakhir Dalam:</p>
        </div>
        <div className="flex gap-2 text-white font-mono font-bold">
            <div className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/10 flex flex-col items-center min-w-[40px]">
                <span className="text-lg leading-none">{formatTime(timeLeft.hours)}</span>
                <span className="text-[8px] font-sans font-normal text-white/60">Jam</span>
            </div>
            <span className="mt-1 text-white/50">:</span>
            <div className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/10 flex flex-col items-center min-w-[40px]">
                <span className="text-lg leading-none">{formatTime(timeLeft.minutes)}</span>
                <span className="text-[8px] font-sans font-normal text-white/60">Mnt</span>
            </div>
            <span className="mt-1 text-white/50">:</span>
            <div className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/10 text-yellow-400 flex flex-col items-center min-w-[40px]">
                <span className="text-lg leading-none">{formatTime(timeLeft.seconds)}</span>
                <span className="text-[8px] font-sans font-normal text-white/60">Dtk</span>
            </div>
        </div>
    </div>
  );
};

export default FlashSale;
