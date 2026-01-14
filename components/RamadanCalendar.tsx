
import React, { useRef, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

const RamadanCalendar: React.FC = () => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Mock Data for Ramadan 2026 (Starting roughly Feb 18)
    const startDate = new Date('2026-02-18');
    const schedule = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        // Mock Times (Adds 1 minute each day)
        const imsakBase = 4 * 60 + 30; // 04:30
        const maghribBase = 18 * 60 + 15; // 18:15
        
        const formatTime = (totalMinutes: number) => {
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        };

        return {
            day: i + 1,
            dateObj: date,
            dateStr: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
            imsak: formatTime(imsakBase - i), // Gets earlier
            maghrib: formatTime(maghribBase - i) // Gets earlier slightly or stays same, just mock
        };
    });

    // Find "Today" index relative to mock start
    const today = new Date();
    // For demo purposes, if today isn't in range, default to Day 1
    const currentIndex = 0; 

    useEffect(() => {
        if (scrollRef.current) {
            // Scroll to start or current day
            scrollRef.current.scrollLeft = 0;
        }
    }, []);

    return (
        <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-2 px-4 mb-3">
                <Moon className="text-gold-400 fill-current" size={18}/>
                <h3 className="font-bold text-white text-lg">Jadwal Imsakiyah 2026</h3>
            </div>
            
            <div 
                ref={scrollRef}
                className="flex overflow-x-auto gap-3 px-4 pb-4 no-scrollbar snap-x"
            >
                {schedule.map((item, idx) => {
                    const isToday = idx === currentIndex;
                    return (
                        <div 
                            key={idx} 
                            className={`flex-shrink-0 w-32 snap-start rounded-xl p-3 border transition-all ${
                                isToday 
                                ? 'bg-gradient-to-b from-brand-600 to-brand-800 border-gold-500 shadow-lg shadow-brand-500/20 scale-105' 
                                : 'bg-dark-card border-white/5'
                            }`}
                        >
                            <div className="text-center border-b border-white/10 pb-2 mb-2">
                                <span className={`text-xs font-bold block ${isToday ? 'text-white' : 'text-brand-400'}`}>
                                    Ramadhan {item.day}
                                </span>
                                <span className="text-[10px] text-gray-400">{item.dateStr}</span>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between items-center bg-black/20 p-1.5 rounded-lg">
                                    <div className="flex items-center gap-1 text-[9px] text-gray-400">
                                        <Moon size={10}/> Imsak
                                    </div>
                                    <span className="text-xs font-bold text-white">{item.imsak}</span>
                                </div>
                                <div className="flex justify-between items-center bg-gold-500/10 p-1.5 rounded-lg border border-gold-500/20">
                                    <div className="flex items-center gap-1 text-[9px] text-gold-400">
                                        <Sun size={10}/> Maghrib
                                    </div>
                                    <span className="text-xs font-bold text-gold-300">{item.maghrib}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RamadanCalendar;
