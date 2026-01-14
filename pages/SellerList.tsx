
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { User, StoreStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import UserAvatar from '../components/UserAvatar';
import { Store, Search, Zap, ArrowRight, Star, Check } from 'lucide-react';

const SellerList: React.FC = () => {
    const navigate = useNavigate();
    const [sellers, setSellers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadSellers = async () => {
            const users = await StorageService.getUsers();
            // Filter only Active Sellers
            const activeSellers = users.filter(u => u.isSeller && u.storeStatus === StoreStatus.ACTIVE);
            setSellers(activeSellers);
            setLoading(false);
        };
        loadSellers();
    }, []);

    const filteredSellers = sellers.filter(s => 
        s.storeName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#0f172a] pb-24">
            {/* Header Section */}
            <div className="bg-[#1e293b] py-12 border-b border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold mb-4">
                        <Store size={14}/> OFFICIAL SELLER DIRECTORY
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Jelajahi Toko Member</h1>
                    <p className="text-gray-400 max-w-xl mx-auto mb-8">
                        Temukan berbagai toko terpercaya dari komunitas kami. Stalking toko favoritmu dan lihat reputasi mereka.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-md mx-auto relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                            <Search size={20}/>
                        </div>
                        <input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari nama toko atau owner..." 
                            className="w-full bg-black/20 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-brand-500 outline-none backdrop-blur-sm transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Seller Grid */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="text-center text-gray-500 py-20">Memuat data toko...</div>
                ) : filteredSellers.length === 0 ? (
                    <div className="text-center py-20 bg-[#1e293b] rounded-3xl border border-white/5 border-dashed">
                        <Store size={48} className="mx-auto text-gray-600 mb-4 opacity-50"/>
                        <p className="text-gray-400">Belum ada toko yang terdaftar atau ditemukan.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSellers.map(seller => (
                            <div 
                                key={seller.id} 
                                onClick={() => navigate(`/u/${seller.id}`)}
                                className="group bg-[#1e293b] rounded-2xl overflow-hidden border border-white/5 hover:border-brand-500/50 transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col"
                            >
                                {/* Banner Area */}
                                <div className="h-24 bg-gray-800 relative">
                                    {seller.banner ? (
                                        <img src={seller.banner} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"/>
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-700"></div>
                                    )}
                                    {/* Level Badge */}
                                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-yellow-400 border border-white/10 flex items-center gap-1">
                                        <Zap size={10} className="fill-current"/> LVL {seller.storeLevel || 1}
                                    </div>
                                </div>

                                <div className="px-5 pb-5 flex-1 flex flex-col relative">
                                    {/* Avatar Overlapping Banner */}
                                    <div className="-mt-10 mb-3 relative">
                                        <UserAvatar user={seller} size="lg" className="border-4 border-[#1e293b] shadow-lg"/>
                                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-4 border-[#1e293b] rounded-full"></div>
                                    </div>

                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors flex items-center gap-2">
                                                {seller.storeName}
                                                {seller.isVerified && (
                                                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0" title="Official Store">
                                                        <Check size={12} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </h3>
                                            <p className="text-xs text-gray-500">Owner: {seller.username}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-lg">
                                            <Star size={12} className="fill-current"/>
                                            <span className="text-xs font-bold">{seller.storeRating || '5.0'}</span>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-400 line-clamp-2 mb-4 flex-1">
                                        {seller.storeDescription || "Tidak ada deskripsi toko."}
                                    </p>

                                    <div className="pt-4 border-t border-white/5 flex items-center justify-end mt-auto">
                                        <button className="text-xs font-bold text-brand-400 flex items-center gap-1 group-hover:underline">
                                            Kunjungi Toko <ArrowRight size={14}/>
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

export default SellerList;
