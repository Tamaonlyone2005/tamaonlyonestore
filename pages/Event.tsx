
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { User, EventConfig, EventPrize } from '../types';
import { useNavigate } from 'react-router-dom';
import { Gift, Coins, Loader2, Sparkles, Crown, ArrowLeft } from 'lucide-react';
import { useToast } from '../components/Toast';

const Event: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [config, setConfig] = useState<EventConfig | null>(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [wheelRotation, setWheelRotation] = useState(0);
    const [prize, setPrize] = useState<EventPrize | null>(null);
    const [canSpinFree, setCanSpinFree] = useState(false);

    useEffect(() => {
        const init = async () => {
            const session = StorageService.getSession();
            if(!session) return navigate('/login');
            
            // Re-fetch user to get latest points/subscription status
            const freshUser = await StorageService.findUser(session.id);
            setUser(freshUser || session);
            
            const eventConfig = await StorageService.getEventConfig();
            setConfig(eventConfig);

            // Check Free Spin logic (Master/Elite/Epic Daily)
            if (freshUser) {
                const now = new Date();
                const isMember = freshUser.subscriptionEndsAt && new Date(freshUser.subscriptionEndsAt) > now;
                
                if (isMember) {
                    const lastClaim = freshUser.lastFreeSpinClaim ? new Date(freshUser.lastFreeSpinClaim) : null;
                    const isSameDay = lastClaim && lastClaim.getDate() === now.getDate() && lastClaim.getMonth() === now.getMonth() && lastClaim.getFullYear() === now.getFullYear();
                    setCanSpinFree(!isSameDay);
                }
            }
        };
        init();
    }, [navigate]);

    const handleSpin = async () => {
        if(!user || !config || isSpinning) return;
        
        const cost = config.spinCost;
        const useFreeSpin = canSpinFree;

        if (!useFreeSpin && user.points < cost) {
            return addToast(`Poin tidak cukup! Butuh ${cost} poin.`, "error");
        }

        // Logic Probabilitas (Client side simulation)
        const rand = Math.random() * 100;
        let cumulative = 0;
        let selectedPrize = config.prizes[0]; // Default

        for (const p of config.prizes) {
            cumulative += p.probability;
            if (rand <= cumulative) {
                selectedPrize = p;
                break;
            }
        }

        setIsSpinning(true);

        // Deduct Cost / Update Free Spin
        if (useFreeSpin) {
            user.lastFreeSpinClaim = new Date().toISOString();
            await StorageService.saveUser(user);
        } else {
            // Using centralized helper ensures PointHistory is created
            await StorageService.addPointTransaction(user.id, cost, 'SUBTRACT', 'Spin Lucky Wheel');
            user.points -= cost; // Optimistic update
        }
        
        setCanSpinFree(false); 

        // Calculate Angle
        const numSegments = config.prizes.length;
        const prizeIndex = config.prizes.findIndex(p => p.id === selectedPrize.id);
        const segmentAngle = 360 / numSegments;
        
        // Ensure landing logic aligns with the pointer at TOP (270deg standard offset, or 0 depends on drawing)
        // Let's assume standard 0 is at 3 o'clock. Pointer at 12 o'clock means -90 deg.
        // We need to rotate so the segment center hits -90 deg.
        
        const currentRotation = wheelRotation % 360;
        const prizeAngle = prizeIndex * segmentAngle; // Start angle of prize
        const centerOffset = segmentAngle / 2;
        
        // Calculate target rotation to bring prize to top
        // We want (rotation + prizeAngle + centerOffset) % 360 == 270 (Top)
        // Or simpler: spin roughly 5-10 times
        
        const spinCount = 5 + Math.floor(Math.random() * 5);
        const baseTarget = 360 * spinCount;
        
        // To align specific segment to TOP marker
        // If segment 0 is at [0, 45], center is 22.5. To get 22.5 to top (270), we rotate -112.5 or +247.5
        // Generic formula: Target = 270 - (Index * SegAngle + SegAngle/2)
        let targetAngle = 270 - (prizeIndex * segmentAngle + segmentAngle / 2);
        
        // Normalize
        while(targetAngle < 0) targetAngle += 360;
        
        const finalRotation = wheelRotation + baseTarget + (targetAngle - (wheelRotation % 360));
        
        setWheelRotation(finalRotation);

        setTimeout(async () => {
            setIsSpinning(false);
            setPrize(selectedPrize);
            
            // Grant Reward
            if (selectedPrize.type === 'POINT') {
                await StorageService.addPointTransaction(user.id, selectedPrize.value, 'ADD', 'Hadiah Lucky Wheel');
                user.points += selectedPrize.value;
            } else if (selectedPrize.type === 'SUBSCRIPTION') {
                // Defaulting won subscription to ELITE tier for 7 days
                await StorageService.buySubscription(user.id, 'ELITE');
                const updated = await StorageService.findUser(user.id);
                if(updated) user.subscriptionEndsAt = updated.subscriptionEndsAt;
            }
            
            setUser({...user}); // Force re-render
            addToast(`Selamat! Kamu dapat ${selectedPrize.name}`, selectedPrize.type === 'ZONK' ? 'info' : 'success');
        }, 5000); // 5s animation
    };

    if(!user || !config) return <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white"><Loader2 className="animate-spin"/></div>;

    if(!config.isActive) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white p-4 text-center">
            <div>
                <Gift size={64} className="mx-auto text-gray-600 mb-4"/>
                <h1 className="text-2xl font-bold">Event Sedang Ditutup</h1>
                <p className="text-gray-400">Nantikan event seru selanjutnya!</p>
                <button onClick={() => navigate('/')} className="mt-4 text-brand-400 underline">Kembali ke Home</button>
            </div>
        </div>
    );

    const numSegments = config.prizes.length;
    const segmentAngle = 360 / numSegments;

    // Generate Conic Gradient for background
    const gradientParts = config.prizes.map((p, i) => {
        const start = i * segmentAngle;
        const end = (i + 1) * segmentAngle;
        const color = i % 2 === 0 ? '#d946ef' : '#a855f7'; // Alternating Purple/Fuchsia like reference
        return `${color} ${start}deg ${end}deg`;
    }).join(', ');

    return (
        <div className="min-h-screen bg-[#0f172a] overflow-hidden relative pb-24">
            <button onClick={() => navigate(-1)} className="absolute top-6 left-6 z-50 p-2 bg-black/40 rounded-full text-white hover:bg-black/60"><ArrowLeft size={24}/></button>

            {/* Background FX */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(234,179,8,0.1)_360deg)] animate-[spin_10s_linear_infinite] opacity-30"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8 relative z-10 flex flex-col items-center">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-6xl font-black text-yellow-400 mb-2 drop-shadow-[0_4px_0_rgba(161,98,7,1)] tracking-wide uppercase" style={{ WebkitTextStroke: '2px #713f12' }}>
                        Wheel of Fortune
                    </h1>
                    <p className="text-gray-300 font-bold bg-black/30 px-6 py-2 rounded-full inline-block border border-white/10">
                        Putar & Menangkan Hadiah Spesial!
                    </p>
                </div>

                {/* THE WHEEL CONTAINER */}
                <div className="relative w-[340px] h-[340px] md:w-[450px] md:h-[450px] flex items-center justify-center">
                    
                    {/* Outer Rim (Wood/Gold effect) */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-yellow-700 to-yellow-900 border-4 border-yellow-600 shadow-2xl">
                        {/* Dots on Rim */}
                        {[...Array(12)].map((_, i) => (
                            <div 
                                key={i}
                                className="absolute w-3 h-3 bg-yellow-200 rounded-full shadow-[0_0_10px_rgba(253,224,71,0.8)]"
                                style={{
                                    top: '50%',
                                    left: '50%',
                                    transform: `rotate(${i * 30}deg) translate(160px) md:translate(215px)`, // Radius adjustment
                                }}
                            ></div>
                        ))}
                    </div>

                    {/* Inner Wheel (Rotating Part) */}
                    <div 
                        className="w-[90%] h-[90%] rounded-full relative overflow-hidden transition-transform cubic-bezier(0.25, 0.1, 0.25, 1) border-4 border-yellow-800 shadow-inner bg-dark-bg"
                        style={{ 
                            transform: `rotate(${wheelRotation}deg)`,
                            transitionDuration: isSpinning ? '5s' : '0s',
                            background: `conic-gradient(${gradientParts})`
                        }}
                    >
                        {/* Segments Content (Icons & Text) */}
                        {config.prizes.map((p, i) => (
                            <div 
                                key={p.id}
                                className="absolute w-full h-full top-0 left-0 flex justify-center pt-4 md:pt-8"
                                style={{
                                    transform: `rotate(${i * segmentAngle + segmentAngle/2}deg)`,
                                }}
                            >
                                <div className="flex flex-col items-center gap-1 text-white drop-shadow-md">
                                    {p.type === 'POINT' && <Coins size={24} className="fill-yellow-400 text-yellow-600"/>}
                                    {p.type === 'SUBSCRIPTION' && <Crown size={24} className="fill-yellow-200 text-yellow-500"/>}
                                    {p.type === 'ZONK' && <span className="text-xl">💣</span>}
                                    
                                    <span className="font-black text-lg md:text-xl leading-none" style={{ WebkitTextStroke: '1px #000' }}>
                                        {p.type === 'ZONK' ? '' : p.value}
                                    </span>
                                    {/* Optional Name for complex prizes */}
                                    {p.type === 'SUBSCRIPTION' && <span className="text-[8px] font-bold uppercase bg-black/50 px-1 rounded">VIP</span>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Center Cap & Button */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-yellow-600 rounded-full border-4 border-yellow-400 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center z-20">
                        {/* Button Green */}
                        <button 
                            onClick={handleSpin}
                            disabled={isSpinning}
                            className="w-20 h-20 bg-green-500 hover:bg-green-400 rounded-full shadow-[inset_0_-4px_4px_rgba(0,0,0,0.2)] border-b-4 border-green-700 flex flex-col items-center justify-center transition-all active:scale-95 active:border-b-0 disabled:grayscale disabled:cursor-not-allowed"
                        >
                            <span className="font-black text-white text-xl uppercase tracking-wider drop-shadow-md">SPIN</span>
                        </button>
                        
                        {/* Points Cost Indicator (Bottom of button area) */}
                        <div className="absolute -bottom-8 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold border border-white/20">
                            {canSpinFree ? <span className="text-green-400 animate-pulse">FREE</span> : `${config.spinCost} Poin`}
                        </div>

                        {/* User Balance Indicator (Top of button area) */}
                        <div className="absolute -top-10 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-black border-2 border-white shadow-lg flex items-center gap-1">
                            <Coins size={12} fill="black"/> {user.points}
                        </div>
                    </div>

                    {/* Pointer (Red Arrow) */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-30">
                        <div className="w-8 h-10 bg-red-600 clip-arrow shadow-lg border-2 border-red-800"></div>
                        <style>{`.clip-arrow { clip-path: polygon(50% 100%, 0 0, 100% 0); }`}</style>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-12 text-center max-w-md">
                    {canSpinFree && (
                        <div className="mb-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg animate-pulse flex items-center justify-center gap-2">
                            <Crown size={20} className="fill-yellow-300 text-yellow-500"/>
                            1x Kesempatan Spin Gratis Member!
                        </div>
                    )}
                    <p className="text-gray-400 text-sm">
                        Menangkan hadiah hingga <span className="text-yellow-400 font-bold">5000 Poin</span> atau <span className="text-purple-400 font-bold">Membership Gratis</span>!
                    </p>
                </div>
            </div>

            {/* Prize Modal */}
            {prize && !isSpinning && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/90 backdrop-blur-sm animate-fade-in" onClick={() => setPrize(null)}>
                    <div className="bg-[#1e293b] p-8 rounded-[2rem] border-2 border-yellow-500 text-center max-w-sm w-full shadow-[0_0_50px_rgba(234,179,8,0.3)] animate-slide-up relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.2),transparent)] pointer-events-none"></div>
                        
                        <div className="mb-6 relative">
                            <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full"></div>
                            <Gift size={80} className="mx-auto text-yellow-400 relative z-10 animate-bounce"/>
                        </div>
                        
                        <h2 className="text-3xl font-black text-white mb-2 uppercase italic">Selamat!</h2>
                        <p className="text-gray-300 text-sm mb-4">Kamu mendapatkan:</p>
                        
                        <div className="bg-black/40 p-4 rounded-xl border border-white/10 mb-6">
                            <p className={`text-2xl font-black ${prize.type === 'ZONK' ? 'text-gray-400' : 'text-yellow-400'}`}>
                                {prize.name}
                            </p>
                        </div>

                        <button onClick={() => setPrize(null)} className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition-all shadow-lg">
                            Ambil Hadiah
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Event;
