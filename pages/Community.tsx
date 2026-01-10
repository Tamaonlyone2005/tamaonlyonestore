
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { User, UserRole, VipLevel } from '../types';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../components/UserAvatar';
import { Search, MessageCircle, Users, Sparkles, Crown, Gamepad2, Store, Zap, Trophy, Flame } from 'lucide-react';
import { useToast } from '../components/Toast';

const Community: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'ALL' | 'VIP' | 'SELLER'>('ALL');

    useEffect(() => {
        const load = async () => {
            const session = StorageService.getSession();
            if(!session) return navigate('/login');
            
            const users = await StorageService.getUsers();
            // Filter out admin and current user from the list
            setAllUsers(users.filter(u => u.role !== UserRole.ADMIN && u.id !== session.id));
        };
        load();
    }, [navigate]);

    const handleMessage = (e: React.MouseEvent, targetId: string) => {
        e.stopPropagation();
        navigate(`/chat?userId=${targetId}`);
    };

    const handleMabar = (e: React.MouseEvent, targetUser: User) => {
        e.stopPropagation();
        addToast(`Mengajak ${targetUser.username} mabar!`, "success");
        navigate(`/chat?userId=${targetUser.id}`);
    };

    // Filter Logic
    const filteredUsers = allUsers.filter(u => {
        const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase());
        if (activeTab === 'VIP') return matchesSearch && u.vipLevel !== VipLevel.NONE;
        if (activeTab === 'SELLER') return matchesSearch && u.isSeller;
        return matchesSearch;
    });

    // Top 3 "Sultans" based on totalOrders or Points
    const topUsers = [...allUsers].sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0)).slice(0, 3);

    // Helper to simulate game badges (Since not in DB yet)
    const getGameBadges = (uid: string) => {
        const games = ['MLBB', 'PUBG', 'FF', 'Genshin'];
        // Deterministic random based on ID char code
        const idx = uid.charCodeAt(0) % games.length;
        return [games[idx], games[(idx + 1) % games.length]];
    };

    return (
        <div className="min-h-screen bg-[#0f172a] pb-24">
            {/* HERO & LEADERBOARD SECTION */}
            <div className="bg-[#1e293b] pt-12 pb-16 border-b border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold mb-4">
                            <Users size={14}/> GAMING COMMUNITY
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">Hall of Fame</h1>
                        <p className="text-gray-400">Top Sultan & Member Teraktif Komunitas Kami</p>
                    </div>

                    {/* TOP 3 PODIUM */}
                    <div className="flex justify-center items-end gap-4 md:gap-8 mb-8">
                        {/* 2nd Place */}
                        {topUsers[1] && (
                            <div className="flex flex-col items-center cursor-pointer group" onClick={() => navigate(`/u/${topUsers[1].id}`)}>
                                <div className="relative">
                                    <UserAvatar user={topUsers[1]} size="lg" className="border-4 border-gray-400 shadow-lg group-hover:scale-105 transition-transform"/>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gray-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-[#1e293b]">#2</div>
                                </div>
                                <div className="mt-4 text-center">
                                    <p className="font-bold text-white text-sm truncate max-w-[100px]">{topUsers[1].username}</p>
                                    <p className="text-gray-500 text-xs">{topUsers[1].totalOrders} Trx</p>
                                </div>
                            </div>
                        )}

                        {/* 1st Place */}
                        {topUsers[0] && (
                            <div className="flex flex-col items-center cursor-pointer group -mt-8" onClick={() => navigate(`/u/${topUsers[0].id}`)}>
                                <div className="relative">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce"><Crown size={32} fill="currentColor"/></div>
                                    <UserAvatar user={topUsers[0]} className="w-24 h-24 md:w-32 md:h-32 border-4 border-yellow-500 shadow-2xl shadow-yellow-500/20 group-hover:scale-105 transition-transform"/>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-black px-3 py-1 rounded-full border-4 border-[#1e293b]">#1 SULTAN</div>
                                </div>
                                <div className="mt-5 text-center">
                                    <p className="font-black text-white text-lg truncate max-w-[150px]">{topUsers[0].username}</p>
                                    <p className="text-brand-400 text-sm font-bold">{topUsers[0].totalOrders} Transaksi</p>
                                </div>
                            </div>
                        )}

                        {/* 3rd Place */}
                        {topUsers[2] && (
                            <div className="flex flex-col items-center cursor-pointer group" onClick={() => navigate(`/u/${topUsers[2].id}`)}>
                                <div className="relative">
                                    <UserAvatar user={topUsers[2]} size="lg" className="border-4 border-orange-700 shadow-lg group-hover:scale-105 transition-transform"/>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-[#1e293b]">#3</div>
                                </div>
                                <div className="mt-4 text-center">
                                    <p className="font-bold text-white text-sm truncate max-w-[100px]">{topUsers[2].username}</p>
                                    <p className="text-gray-500 text-xs">{topUsers[2].totalOrders} Trx</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-20">
                {/* SEARCH & TABS */}
                <div className="bg-[#1e293b] rounded-3xl p-4 shadow-xl border border-white/5 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Tabs */}
                    <div className="flex p-1 bg-black/20 rounded-xl overflow-hidden w-full md:w-auto">
                        {['ALL', 'VIP', 'SELLER'].map((tab) => (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                {tab === 'ALL' ? 'Semua' : tab === 'VIP' ? 'VIP Member' : 'Top Seller'}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18}/>
                        <input 
                            placeholder="Cari member..." 
                            className="w-full bg-dark-bg border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-brand-500 outline-none transition-all text-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* USER GRID */}
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 border border-dashed border-white/5 rounded-3xl bg-[#1e293b]/50">
                        <Sparkles size={40} className="mx-auto mb-4 opacity-20"/>
                        <p>Belum ada member yang ditemukan.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredUsers.map(u => (
                            <div 
                                key={u.id} 
                                onClick={() => navigate(`/u/${u.id}`)}
                                className="group bg-[#1e293b] rounded-2xl p-4 border border-white/5 hover:border-brand-500/50 transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer flex items-center gap-4 relative overflow-hidden"
                            >
                                {/* Decorative Glow for VIP */}
                                {u.isVip && <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 blur-xl rounded-full pointer-events-none"></div>}

                                <div className="relative shrink-0">
                                    <UserAvatar user={u} size="md" className="border-2 border-white/10" />
                                    {/* Online Indicator (Simulation) */}
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1e293b] rounded-full"></div>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 mb-0.5">
                                        <h3 className="font-bold text-white text-sm truncate">{u.username}</h3>
                                        {u.vipLevel !== VipLevel.NONE && <Crown size={12} className="text-yellow-500 fill-current shrink-0"/>}
                                        {u.isSeller && <Store size={12} className="text-blue-400 shrink-0"/>}
                                    </div>
                                    
                                    {/* Simulated Game Badges */}
                                    <div className="flex gap-1 mb-2">
                                        {getGameBadges(u.id).map((game, idx) => (
                                            <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded border border-white/5 text-gray-400 font-mono">
                                                {game}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-2 shrink-0">
                                    <button 
                                        onClick={(e) => handleMabar(e, u)}
                                        className="p-2 bg-brand-600/20 text-brand-400 hover:bg-brand-600 hover:text-white rounded-xl transition-colors"
                                        title="Ajak Mabar"
                                    >
                                        <Gamepad2 size={18}/>
                                    </button>
                                    <button 
                                        onClick={(e) => handleMessage(e, u.id)}
                                        className="p-2 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white rounded-xl transition-colors"
                                        title="Chat"
                                    >
                                        <MessageCircle size={18}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Community;
