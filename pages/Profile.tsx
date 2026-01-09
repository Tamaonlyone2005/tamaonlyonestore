
import React, { useState, useEffect } from 'react';
import { User, UserRole, PointHistory, Order, VipLevel, Product, OrderStatus, ActivityLog } from '../types';
import { StorageService } from '../services/storageService';
import { AuthService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { Save, Lock, User as UserIcon, Shield, Coins, Eye, EyeOff, Share2, BadgeCheck, Crown, MessageSquare, Download, Upload, Receipt, Heart, MessageCircle, Users, Activity, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '../components/Toast';
import UserAvatar from '../components/UserAvatar';
import ProductCard from '../components/ProductCard';

interface ProfileProps {
  user: User | null;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(user);
  const [activeTab, setActiveTab] = useState<'overview' | 'points' | 'orders' | 'wishlist' | 'activity'>('overview');
  
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [myLogs, setMyLogs] = useState<ActivityLog[]>([]);
  
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const loadData = async () => {
        // Refresh User Data
        const u = await StorageService.findUser(user.id);
        const freshUser = u || user;
        setCurrentUser(freshUser);
        
        // Point History
        const ph = await StorageService.getPointHistory(user.id);
        setPointHistory(ph);
        
        // Orders
        const allOrders = await StorageService.getOrders();
        setMyOrders(allOrders.filter(o => o.userId === user.id).reverse());
        
        // Wishlist
        const allProds = await StorageService.getProducts();
        if(freshUser.wishlist) {
            setWishlistItems(allProds.filter(p => freshUser.wishlist.includes(p.id)));
        }

        // Activity Logs
        const logs = await StorageService.getLogs();
        setMyLogs(logs.filter(l => l.userId === user.id));
    };
    loadData();
  }, [user, navigate]);

  const handleChangePassword = async () => {
    if (!currentUser || !newPassword) return;
    const res = await AuthService.updatePassword(currentUser.id, newPassword);
    if (res.success) {
      addToast(res.message, "success");
      setNewPassword('');
    } else {
      addToast(res.message, "error");
    }
  };
  
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file || !currentUser) return;

      setIsUploadingBanner(true);
      try {
          // Compress to max 500KB
          const compressed = await StorageService.compressImage(file, 500);
          const updatedUser = { ...currentUser, banner: compressed };
          await StorageService.saveUser(updatedUser);
          setCurrentUser(updatedUser);
          addToast("Banner berhasil diperbarui!", "success");
      } catch (error) {
          addToast("Gagal mengupload banner.", "error");
      } finally {
          setIsUploadingBanner(false);
      }
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>, orderId: string) => {
      const file = e.target.files?.[0];
      if (file) {
          // Compress Payment Proof too
          try {
              const base64 = await StorageService.compressImage(file, 1024); // 1MB max for proofs
              await StorageService.uploadPaymentProof(orderId, base64);
              addToast("Bukti pembayaran berhasil diupload!", "success");
              setMyOrders(prev => prev.map(o => o.id === orderId ? {...o, paymentProof: base64} : o));
          } catch(e) {
              addToast("Gagal upload bukti.", "error");
          }
      }
  };

  const handleShareProfile = () => { 
      navigator.clipboard.writeText(`${window.location.origin}/#/u/${currentUser?.id}`); 
      addToast("Link profil disalin!", "info"); 
  };
  
  const handleWhatsAppConfirm = (order: Order) => { 
      window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(`Halo Admin, saya mau konfirmasi pesanan #${order.id} (${order.productName})`)}`, '_blank'); 
  };

  if (!currentUser) return null;

  const isAdmin = currentUser.role === UserRole.ADMIN;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 mb-20">
      {/* Profile Card Container */}
      <div className="bg-dark-card border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-fade-in relative group/banner">
        
        {/* Banner Section */}
        <div className="relative w-full h-[320px] bg-gradient-to-b from-gray-800 to-dark-card overflow-hidden">
           {currentUser.banner ? (
               <img src={currentUser.banner} className="w-full h-full object-cover opacity-60"/>
           ) : (
               <div className="absolute inset-0 bg-black/40"></div>
           )}
           
           {/* Banner Upload Button */}
           <div className="absolute top-4 left-4 z-30 opacity-0 group-hover/banner:opacity-100 transition-opacity">
               <label className="cursor-pointer bg-black/50 hover:bg-black/70 text-white px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-bold backdrop-blur-md border border-white/10">
                   {isUploadingBanner ? <Loader2 size={16} className="animate-spin"/> : <ImageIcon size={16}/>}
                   Ganti Banner
                   <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} disabled={isUploadingBanner}/>
               </label>
           </div>

           <button onClick={handleShareProfile} className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-colors z-20 border border-white/10"><Share2 size={18}/></button>
           
           <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
               <div className="relative z-10 flex flex-col items-center gap-4 mt-4">
                  <UserAvatar user={currentUser} size="xl" className="shadow-2xl"/>
                  {currentUser.vipLevel !== VipLevel.NONE && (
                     <div className="flex items-center gap-1 bg-yellow-500 text-black text-[10px] font-extrabold px-3 py-1 rounded-full shadow-lg transform -mt-6 z-20 uppercase tracking-widest"><Crown size={12} fill="currentColor" /><span>{currentUser.vipLevel} VIP</span></div>
                  )}
               </div>
               
               <div className="relative z-10 text-center mt-3">
                   <div className="flex items-center justify-center gap-2">
                      <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight drop-shadow-md">{currentUser.username}</h1>
                      {currentUser.isVerified && <BadgeCheck size={22} className="text-white fill-green-500 drop-shadow-sm" />}
                      {isAdmin && <Shield size={22} className="text-red-500 fill-current drop-shadow-sm" />}
                   </div>
                   
                   {!isAdmin && (
                       <div className="flex items-center gap-6 mt-4 text-sm justify-center">
                           <div className="text-center bg-black/30 px-3 py-1 rounded-lg backdrop-blur-sm">
                               <span className="block font-bold text-white text-lg">{currentUser.followers?.length || 0}</span>
                               <span className="text-gray-300 text-xs uppercase tracking-wide">Followers</span>
                           </div>
                           <div className="text-center bg-black/30 px-3 py-1 rounded-lg backdrop-blur-sm">
                               <span className="block font-bold text-white text-lg">{currentUser.following?.length || 0}</span>
                               <span className="text-gray-300 text-xs uppercase tracking-wide">Following</span>
                           </div>
                       </div>
                   )}
               </div>
           </div>
        </div>

        {/* Member Action Bar (Points Only) */}
        {!isAdmin && (
            <div className="bg-dark-card border-b border-white/5 py-6 px-4">
                <div className="max-w-md mx-auto">
                     <div className="bg-gradient-to-r from-gray-800 to-gray-700 border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-inner px-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-brand-600 rounded-xl text-white shadow-lg shadow-brand-500/20"><Coins size={24} /></div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">T Points</p>
                                <p className="text-2xl font-bold text-white">{currentUser.points.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-gray-400">Exclusive Currency</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="flex border-b border-white/10 bg-dark-bg/50 px-4 overflow-x-auto justify-start md:justify-center no-scrollbar">
          <button onClick={() => setActiveTab('overview')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'overview' ? 'border-brand-500 text-brand-400' : 'border-transparent text-gray-400 hover:text-white'}`}>Overview</button>
          <button onClick={() => setActiveTab('orders')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'orders' ? 'border-brand-500 text-brand-400' : 'border-transparent text-gray-400 hover:text-white'}`}>Orders</button>
          <button onClick={() => setActiveTab('wishlist')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'wishlist' ? 'border-brand-500 text-brand-400' : 'border-transparent text-gray-400 hover:text-white'}`}>Wishlist</button>
          {!isAdmin && <button onClick={() => setActiveTab('points')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'points' ? 'border-brand-500 text-brand-400' : 'border-transparent text-gray-400 hover:text-white'}`}>History Poin</button>}
          <button onClick={() => setActiveTab('activity')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'activity' ? 'border-brand-500 text-brand-400' : 'border-transparent text-gray-400 hover:text-white'}`}>History</button>
        </div>

        <div className="p-6 sm:p-8 min-h-[300px] bg-dark-bg">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><UserIcon size={16} /> Account Details</h3>
                  <div className="space-y-4">
                     {currentUser.vipLevel !== VipLevel.NONE && (
                         <div className="p-3 rounded-lg border flex items-center justify-between bg-white/5 border-white/10"><span className="text-xs font-bold uppercase text-gray-400">Current Rank</span><span className="font-bold text-yellow-500">{currentUser.vipLevel}</span></div>
                     )}
                    <div><label className="text-xs text-gray-500 block mb-1">Display Name</label><div className="text-white font-medium bg-dark-bg p-3 rounded-lg border border-white/10">{currentUser.username}</div></div>
                    <div><label className="text-xs text-gray-500 block mb-1">Email</label><div className="text-gray-300 font-medium bg-dark-bg p-3 rounded-lg border border-white/10">{currentUser.email}</div></div>
                    {!isAdmin && <button onClick={() => navigate('/community')} className="w-full flex items-center justify-center gap-2 bg-brand-600/20 text-brand-400 py-3 rounded-xl font-bold border border-brand-500/20 transition-all mt-2 hover:bg-brand-600 hover:text-white"><Users size={18} /> Cari Teman (Community)</button>}
                  </div>
                </div>
                <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Lock size={16} /> Security</h3>
                  <div className="relative mb-3">
                      <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-dark-bg border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-brand-500" placeholder="New Password"/>
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-white">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                  <button onClick={handleChangePassword} className="w-full bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2"><Save size={18} /> Update Password</button>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
                <div className="space-y-4 animate-fade-in">
                    {myOrders.length === 0 ? (
                        <div className="text-center py-12 text-gray-500"><Receipt size={48} className="mx-auto mb-4 opacity-20" /><p>Belum ada riwayat pesanan.</p></div>
                    ) : (
                        myOrders.map(order => (
                            <div key={order.id} className="bg-dark-card border border-white/5 rounded-2xl p-5 hover:border-brand-500/30 transition-all">
                                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4 border-b border-white/5 pb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-white text-lg">{order.productName}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                order.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' : 
                                                order.status === 'COMPLETED' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'
                                            }`}>{order.status}</span>
                                        </div>
                                        <p className="text-xs text-gray-400">ID: #{order.id} • {new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-brand-400 font-bold text-xl">Rp {order.price.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">{order.variantName || 'Regular'}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-2 text-sm bg-dark-bg/50 p-3 rounded-xl border border-white/5">
                                         {order.gameData && Object.entries(order.gameData).map(([k,v]) => (
                                             <div key={k} className="flex justify-between"><span className="text-gray-500 capitalize">{k}:</span> <span className="text-white font-medium">{v}</span></div>
                                         ))}
                                     </div>
                                     <div className="space-y-2">
                                         {order.status === OrderStatus.PENDING && (
                                             <>
                                                 <button onClick={() => handleWhatsAppConfirm(order)} className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2"><MessageCircle size={16}/> Konfirmasi WA</button>
                                                 <div className="relative group w-full">
                                                     <button className="w-full bg-white/5 hover:bg-white/10 text-gray-300 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 border border-white/10"><Upload size={16}/> {order.paymentProof ? 'Bukti Terkirim' : 'Upload Bukti Bayar'}</button>
                                                     <input type="file" onChange={(e) => handleUploadProof(e, order.id)} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                                 </div>
                                             </>
                                         )}
                                         {order.downloadUrl && order.status === OrderStatus.COMPLETED && (
                                              <a href={order.downloadUrl} target="_blank" className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold text-sm"><Download size={16} className="inline mr-2"/> Download Item</a>
                                         )}
                                     </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
            
            {activeTab === 'points' && !isAdmin && (
                <div className="space-y-4 animate-fade-in">
                     {pointHistory.length === 0 ? (
                         <div className="text-center py-12 text-gray-500"><Coins size={48} className="mx-auto mb-4 opacity-20" /><p>Belum ada riwayat transaksi poin.</p></div>
                     ) : (
                         pointHistory.map(h => (
                             <div key={h.id} className="flex items-center justify-between bg-dark-card border border-white/5 p-4 rounded-xl">
                                 <div className="flex items-center gap-4">
                                     <div className={`w-10 h-10 rounded-full flex items-center justify-center ${h.type === 'ADD' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                         {h.type === 'ADD' ? <PlusIcon /> : <MinusIcon />}
                                     </div>
                                     <div>
                                         <p className="font-bold text-white text-sm">{h.reason}</p>
                                         <p className="text-xs text-gray-500">{new Date(h.timestamp).toLocaleDateString()}</p>
                                     </div>
                                 </div>
                                 <span className={`font-bold ${h.type === 'ADD' ? 'text-green-400' : 'text-red-400'}`}>{h.type === 'ADD' ? '+' : '-'}{h.amount}</span>
                             </div>
                         ))
                     )}
                </div>
            )}

            {activeTab === 'wishlist' && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                    {wishlistItems.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500"><Heart size={48} className="mx-auto mb-4 opacity-20" /><p>Wishlist kosong.</p></div>
                    ) : (
                        wishlistItems.map(p => (
                            <ProductCard key={p.id} product={p} canBuy={true} onBuy={() => navigate(`/shop?product=${p.id}`)} />
                        ))
                    )}
                </div>
            )}

            {activeTab === 'activity' && (
                <div className="space-y-2 animate-fade-in">
                     <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Aktivitas Saya</h3>
                     {myLogs.length === 0 ? (
                         <div className="text-center py-12 text-gray-500"><Activity size={48} className="mx-auto mb-4 opacity-20" /><p>Belum ada aktivitas.</p></div>
                     ) : (
                         myLogs.map(l => (
                             <div key={l.id} className="flex gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                                 <div className="text-gray-500 text-xs min-w-[60px]">{new Date(l.timestamp).toLocaleDateString()}</div>
                                 <div>
                                     <span className="text-brand-400 font-bold text-xs uppercase mr-2">{l.action}</span>
                                     <span className="text-gray-300 text-sm">{l.details}</span>
                                 </div>
                             </div>
                         ))
                     )}
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

// Icons helpers
const PlusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const MinusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>;

export default Profile;
