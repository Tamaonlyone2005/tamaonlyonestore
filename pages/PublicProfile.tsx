
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storageService';
import { User, VipLevel, Product } from '../types';
import UserAvatar from '../components/UserAvatar';
import { UserPlus, UserCheck, MessageCircle, Crown, BadgeCheck, Shield, ArrowLeft, Store } from 'lucide-react';
import { useToast } from '../components/Toast';
import ProductCard from '../components/ProductCard';

const PublicProfile: React.FC = () => {
    const { id } = useParams<{id: string}>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    
    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const session = StorageService.getSession();
            if(session) {
                const me = await StorageService.findUser(session.id);
                setCurrentUser(me || session);
            }

            if(id) {
                const target = await StorageService.findUser(id);
                setProfileUser(target || null);
                
                // Jika user adalah seller, ambil produknya
                if(target?.isSeller) {
                    const products = await StorageService.getSellerProducts(target.id);
                    setSellerProducts(products);
                }
            }
            setLoading(false);
        };
        load();
    }, [id]);

    const handleFollow = async () => {
        if(!currentUser) return navigate('/login');
        if(!profileUser) return;
        
        const success = await StorageService.followUser(currentUser.id, profileUser.id);
        if(success) {
            addToast(`Mengikuti ${profileUser.username}`, "success");
            // Manual update UI
            setCurrentUser(prev => prev ? {...prev, following: [...(prev.following || []), profileUser.id]} : null);
            setProfileUser(prev => prev ? {...prev, followers: [...(prev.followers || []), currentUser.id]} : null);
        }
    };

    const handleUnfollow = async () => {
        if(!currentUser) return;
        if(!profileUser) return;

        const success = await StorageService.unfollowUser(currentUser.id, profileUser.id);
        if(success) {
            addToast(`Unfollow ${profileUser.username}`, "info");
            setCurrentUser(prev => prev ? {...prev, following: prev.following?.filter(x => x !== profileUser.id)} : null);
            setProfileUser(prev => prev ? {...prev, followers: prev.followers?.filter(x => x !== currentUser.id)} : null);
        }
    };

    if(loading) return <div className="p-10 text-center text-white">Loading Profile...</div>;
    if(!profileUser) return <div className="p-10 text-center text-red-400">User tidak ditemukan.</div>;

    const isMe = currentUser?.id === profileUser.id;
    const isFollowing = currentUser?.following?.includes(profileUser.id);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 mb-20">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"><ArrowLeft size={20}/> Kembali</button>

            <div className="bg-dark-card border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative mb-8">
                 {/* Banner Section */}
                 <div className="h-40 bg-gradient-to-r from-brand-900 to-purple-900 relative">
                     {profileUser.banner ? (
                         <img src={profileUser.banner} className="w-full h-full object-cover opacity-60"/>
                     ) : null}
                 </div>
                 
                 <div className="px-6 pb-8 relative">
                     <div className="-mt-12 mb-4 flex justify-between items-end">
                         <div className="relative">
                            <UserAvatar user={profileUser} size="xl" className="shadow-xl border-4 border-dark-card"/>
                            {profileUser.vipLevel !== VipLevel.NONE && (
                                <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                                    <Crown size={10}/> {profileUser.vipLevel}
                                </div>
                            )}
                         </div>
                         {!isMe && (
                             <div className="flex gap-2 mb-2">
                                 {isFollowing ? (
                                     <button onClick={handleUnfollow} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                                         <UserCheck size={16}/> Mengikuti
                                     </button>
                                 ) : (
                                     <button onClick={handleFollow} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
                                         <UserPlus size={16}/> Follow
                                     </button>
                                 )}
                                 <button onClick={() => navigate(`/chat?userId=${profileUser.id}`)} className="bg-white/10 hover:bg-white/20 text-brand-400 px-4 py-2 rounded-xl font-bold text-sm">
                                     <MessageCircle size={18}/>
                                 </button>
                             </div>
                         )}
                     </div>

                     <div className="mb-6">
                         <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                             {profileUser.username}
                             {profileUser.isVerified && <BadgeCheck size={20} className="text-green-500"/>}
                         </h1>
                         {profileUser.isSeller && (
                             <div className="flex items-center gap-2 mt-1">
                                 <Store size={14} className="text-brand-400"/>
                                 <span className="text-brand-400 font-bold text-sm">{profileUser.storeName}</span>
                                 <span className="text-[10px] bg-white/5 border border-white/10 px-1.5 rounded text-gray-400">Seller</span>
                             </div>
                         )}
                         <p className="text-sm text-gray-500 mt-2">Bergabung sejak {new Date(profileUser.createdAt).toLocaleDateString()}</p>
                         {profileUser.bio && <p className="text-gray-300 mt-2 text-sm">{profileUser.bio}</p>}
                     </div>

                     <div className="flex gap-8 border-t border-white/5 pt-4">
                         <div className="text-center">
                             <span className="block font-bold text-white text-xl">{profileUser.followers?.length || 0}</span>
                             <span className="text-gray-500 text-xs uppercase">Followers</span>
                         </div>
                         <div className="text-center">
                             <span className="block font-bold text-white text-xl">{profileUser.following?.length || 0}</span>
                             <span className="text-gray-500 text-xs uppercase">Following</span>
                         </div>
                         <div className="text-center">
                             <span className="block font-bold text-white text-xl">{profileUser.totalOrders || 0}</span>
                             <span className="text-gray-500 text-xs uppercase">Transactions</span>
                         </div>
                     </div>
                 </div>
            </div>

            {/* SELLER PRODUCTS SECTION */}
            {profileUser.isSeller && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white border-l-4 border-brand-500 pl-4">Produk dari Toko {profileUser.storeName}</h2>
                    {sellerProducts.length === 0 ? (
                        <div className="p-8 text-center bg-white/5 rounded-2xl text-gray-500 border border-white/5 border-dashed">
                            Seller ini belum memiliki produk.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {sellerProducts.map(p => (
                                <ProductCard 
                                    key={p.id} 
                                    product={p} 
                                    canBuy={true} 
                                    onBuy={() => navigate(`/shop?product=${p.id}`)} 
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PublicProfile;
