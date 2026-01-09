
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { User, UserRole, VipLevel } from '../types';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../components/UserAvatar';
import { Search, UserPlus, UserCheck, MessageCircle, Users, Sparkles, Crown } from 'lucide-react';
import { useToast } from '../components/Toast';

const Community: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const load = async () => {
            const session = StorageService.getSession();
            if(!session) return navigate('/login');
            
            const freshUser = await StorageService.findUser(session.id);
            setCurrentUser(freshUser || session);

            const users = await StorageService.getUsers();
            setAllUsers(users.filter(u => u.role !== UserRole.ADMIN && u.id !== session.id));
        };
        load();
    }, [navigate]);

    const handleFollow = async (e: React.MouseEvent, targetId: string) => {
        e.stopPropagation();
        if(!currentUser) return;
        const success = await StorageService.followUser(currentUser.id, targetId);
        if(success) {
            addToast("Berhasil mengikuti user!", "success");
            setCurrentUser(prev => prev ? {...prev, following: [...(prev.following || []), targetId]} : null);
        }
    };

    const handleUnfollow = async (e: React.MouseEvent, targetId: string) => {
        e.stopPropagation();
        if(!currentUser) return;
        const success = await StorageService.unfollowUser(currentUser.id, targetId);
        if(success) {
            addToast("Berhenti mengikuti user.", "info");
            setCurrentUser(prev => prev ? {...prev, following: prev.following?.filter(id => id !== targetId)} : null);
        }
    };

    const handleMessage = (e: React.MouseEvent, targetId: string) => {
        e.stopPropagation();
        navigate(`/chat?userId=${targetId}`);
    };

    const isFollowing = (targetId: string) => currentUser?.following?.includes(targetId);

    const filteredUsers = allUsers.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="min-h-screen bg-[#0f172a] pb-24">
            {/* HERO SECTION */}
            <div className="bg-[#1e293b] py-12 border-b border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none"></div>
                
                <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold mb-4">
                        <Users size={14}/> GAMING COMMUNITY
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Temukan Teman Mabar</h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
                        Jalin pertemanan dengan ribuan gamers lainnya. Follow, chat, dan bangun squad impianmu di sini.
                    </p>
                    
                    <div className="max-w-xl mx-auto relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
                        <input 
                            placeholder="Cari Username..." 
                            className="w-full bg-dark-bg/80 backdrop-blur-sm border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all shadow-xl"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* GRID USERS */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 border border-dashed border-white/5 rounded-3xl bg-[#1e293b]/50">
                        <Sparkles size={40} className="mx-auto mb-4 opacity-20"/>
                        <p>Belum ada member yang ditemukan.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredUsers.map(u => (
                            <div 
                                key={u.id} 
                                onClick={() => navigate(`/u/${u.id}`)}
                                className="group bg-[#1e293b] rounded-3xl overflow-hidden border border-white/5 hover:border-brand-500/50 transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer relative"
                            >
                                {/* Banner Placeholder */}
                                <div className={`h-20 w-full ${u.isVip ? 'bg-gradient-to-r from-yellow-600/40 to-yellow-800/40' : 'bg-gradient-to-r from-brand-900/40 to-blue-900/40'}`}></div>
                                
                                <div className="px-6 pb-6 -mt-10 flex flex-col items-center">
                                    <div className="relative">
                                        <UserAvatar user={u} size="lg" className="border-4 border-[#1e293b]" />
                                        {u.vipLevel !== VipLevel.NONE && (
                                            <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black p-1 rounded-full border-2 border-[#1e293b]" title={`VIP ${u.vipLevel}`}>
                                                <Crown size={12} fill="currentColor"/>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <h3 className="text-lg font-bold text-white mt-3 group-hover:text-brand-400 transition-colors flex items-center gap-1">
                                        {u.username}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium mb-4">{u.followers?.length || 0} Followers</p>
                                    
                                    <div className="flex w-full gap-2">
                                        {isFollowing(u.id) ? (
                                            <button onClick={(e) => handleUnfollow(e, u.id)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-white/5">
                                                <UserCheck size={14}/> Following
                                            </button>
                                        ) : (
                                            <button onClick={(e) => handleFollow(e, u.id)} className="flex-1 bg-brand-600 hover:bg-brand-500 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                                                <UserPlus size={14}/> Follow
                                            </button>
                                        )}
                                        <button onClick={(e) => handleMessage(e, u.id)} className="p-2 bg-white/5 hover:bg-white/10 text-brand-400 rounded-xl border border-white/5">
                                            <MessageCircle size={16}/>
                                        </button>
                                    </div>
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
