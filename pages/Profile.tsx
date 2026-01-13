
import React, { useState, useEffect } from 'react';
import { User, UserRole, PointHistory, Order, VipLevel, Product, OrderStatus, ActivityLog, MEMBERSHIP_PLANS, MembershipTier } from '../types';
import { StorageService } from '../services/storageService';
import { AuthService } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { Save, Lock, User as UserIcon, Shield, Coins, Eye, EyeOff, Share2, BadgeCheck, Crown, Download, Upload, Receipt, Heart, Activity, Image as ImageIcon, Loader2, Store, Trash2, Camera, LogOut, Zap, Check } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'wishlist' | 'points' | 'activity' | 'subscription'>('overview');
  
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [myLogs, setMyLogs] = useState<ActivityLog[]>([]);
  
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const loadData = async () => {
        const u = await StorageService.findUser(user.id);
        const freshUser = u || user;
        setCurrentUser(freshUser);
        
        const ph = await StorageService.getPointHistory(user.id);
        setPointHistory(ph);
        
        const allOrders = await StorageService.getOrders();
        setMyOrders(allOrders.filter(o => o.userId === user.id).reverse());
        
        const allProds = await StorageService.getProducts();
        if(freshUser.wishlist) {
            setWishlistItems(allProds.filter(p => freshUser.wishlist.includes(p.id)));
        }

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
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file || !currentUser) return;

      setIsUploadingAvatar(true);
      try {
          const uploadedUrl = await StorageService.uploadFile(file);
          const updatedUser = { ...currentUser, avatar: uploadedUrl };
          await StorageService.saveUser(updatedUser);
          setCurrentUser(updatedUser);
          addToast("Foto profil diperbarui!", "success");
      } catch (error) {
          addToast("Gagal upload foto.", "error");
      } finally {
          setIsUploadingAvatar(false);
      }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file || !currentUser) return;

      setIsUploadingBanner(true);
      try {
          const uploadedUrl = await StorageService.uploadFile(file);
          const updatedUser = { ...currentUser, banner: uploadedUrl };
          await StorageService.saveUser(updatedUser);
          setCurrentUser(updatedUser);
          addToast("Banner profil diperbarui!", "success");
      } catch (error) {
          addToast("Gagal upload banner.", "error");
      } finally {
          setIsUploadingBanner(false);
      }
  };

  const handleDeleteAvatar = async () => {
      if(!currentUser) return;
      if(confirm("Hapus foto profil?")) {
          const updatedUser = { ...currentUser, avatar: '' };
          await StorageService.saveUser(updatedUser);
          setCurrentUser(updatedUser);
          addToast("Foto profil dihapus.", "info");
      }
  };

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>, orderId: string) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              addToast("Sedang mengupload...", "info");
              const uploadedUrl = await StorageService.uploadFile(file);
              await StorageService.uploadPaymentProof(orderId, uploadedUrl);
              addToast("Bukti pembayaran berhasil diupload!", "success");
              setMyOrders(prev => prev.map(o => o.id === orderId ? {...o, paymentProof: uploadedUrl} : o));
          } catch(e) {
              addToast("Gagal upload bukti.", "error");
          }
      }
  };

  const handleBuySubscription = async (tier: MembershipTier) => {
      if (!currentUser) return;
      
      const plan = MEMBERSHIP_PLANS.find(p => p.tier === tier);
      if(!plan) return;

      if (currentUser.points < plan.price) {
          return addToast(`Poin tidak cukup! Butuh ${plan.price} poin.`, "error");
      }

      if (confirm(`Beli membership ${plan.name} seharga ${plan.price} Poin?`)) {
          // Transaction Helper Handles Point History and Balance
          await StorageService.addPointTransaction(currentUser.id, plan.price, 'SUBTRACT', `Pembelian ${plan.name}`);
          
          // Activate Sub
          await StorageService.buySubscription(currentUser.id, tier);
          
          // Refresh
          const updated = await StorageService.findUser(currentUser.id);
          setCurrentUser(updated || currentUser);
          addToast(`Berhasil berlangganan ${plan.name}!`, "success");
      }
  };

  const handleLogout = async () => {
      await AuthService.logout();
      window.location.href = '/#/login'; 
      window.location.reload();
  };
  
  if (!currentUser) return null;
  const isAdmin = currentUser.role === UserRole.ADMIN;
  
  const isSubscribed = currentUser.subscriptionEndsAt && new Date(currentUser.subscriptionEndsAt) > new Date();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 mb-20">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* LEFT SIDEBAR: PROFILE & NAVIGATION */}
          <div className="lg:col-span-1 space-y-6">
              {/* User Card - Full Banner Style */}
              <div className="bg-dark-card border border-white/5 rounded-3xl overflow-hidden shadow-xl text-center relative group/banner min-h-[320px] flex flex-col justify-center">
                  
                  {/* Full Background Banner */}
                  <div className="absolute inset-0 z-0">
                      {currentUser.banner ? (
                          <img src={currentUser.banner} className="w-full h-full object-cover transition-transform duration-700 group-hover/banner:scale-105"/>
                      ) : (
                          <div className="w-full h-full bg-gradient-to-b from-brand-900 via-[#1e293b] to-[#0f172a]"></div>
                      )}
                      {/* Gradient Overlay for Readability */}
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-black/30"></div>
                  </div>

                  {/* Banner Upload Trigger (Top Right) */}
                  <label className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white cursor-pointer opacity-0 group-hover/banner:opacity-100 transition-all backdrop-blur-md border border-white/10 hover:scale-110">
                      {isUploadingBanner ? <Loader2 size={16} className="animate-spin"/> : <ImageIcon size={16}/>}
                      <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} disabled={isUploadingBanner}/>
                  </label>
                  
                  {/* Profile Content (Sitting on top of banner) */}
                  <div className="relative z-10 px-6 py-8 flex flex-col items-center">
                      <div className="relative inline-block mb-4">
                          <UserAvatar user={currentUser} size="xl" className="border-4 border-white/10 shadow-2xl ring-4 ring-black/20"/>
                          
                          {/* Avatar Controls */}
                          <div className="absolute bottom-0 right-0 flex gap-2 translate-y-1/2">
                              <label className="p-2 bg-brand-600 hover:bg-brand-500 rounded-full text-white cursor-pointer shadow-lg transition-colors border-2 border-[#1e293b] hover:scale-110">
                                  {isUploadingAvatar ? <Loader2 size={14} className="animate-spin"/> : <Camera size={14}/>}
                                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploadingAvatar}/>
                              </label>
                              {currentUser.avatar && (
                                  <button onClick={handleDeleteAvatar} className="p-2 bg-red-600 hover:bg-red-500 rounded-full text-white shadow-lg transition-colors border-2 border-[#1e293b] hover:scale-110">
                                      <Trash2 size={14}/>
                                  </button>
                              )}
                          </div>
                      </div>

                      <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2 mt-4 drop-shadow-md tracking-tight">
                          {currentUser.username}
                          {currentUser.isVerified && <BadgeCheck size={22} className="text-green-400 fill-current drop-shadow-sm"/>}
                      </h2>
                      
                      {isSubscribed && currentUser.membershipTier && (
                          <div className={`mt-2 bg-gradient-to-r text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg ${
                              currentUser.membershipTier === 'MASTER' ? 'from-yellow-600 to-yellow-400' :
                              currentUser.membershipTier === 'EPIC' ? 'from-purple-600 to-purple-400' :
                              'from-blue-600 to-blue-400'
                          }`}>
                              <Crown size={12}/> {currentUser.membershipTier} MEMBER
                          </div>
                      )}
                      
                      {/* Points Summary (Glassmorphism Card) */}
                      {!isAdmin && (
                          <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-4 mt-6 border border-white/10 shadow-xl ring-1 ring-white/5">
                              <div className="flex flex-col items-center justify-center gap-1">
                                  <div className="flex items-center gap-2 text-yellow-400 drop-shadow-sm">
                                      <Coins size={24} className="fill-yellow-500 text-yellow-200"/>
                                      <span className="font-extrabold text-3xl tracking-tight">{currentUser.points.toLocaleString()}</span>
                                  </div>
                                  <p className="text-[10px] text-gray-200 font-bold uppercase tracking-widest opacity-90">Total Poin Saya</p>
                              </div>
                          </div>
                      )}
                  </div>
              </div>

              {/* Navigation Menu */}
              <div className="bg-dark-card border border-white/5 rounded-3xl overflow-hidden">
                  <div className="p-2 space-y-1">
                      {[
                          { id: 'overview', label: 'Overview', icon: UserIcon },
                          { id: 'orders', label: 'Pesanan Saya', icon: Receipt },
                          { id: 'wishlist', label: 'Wishlist', icon: Heart },
                          !isAdmin && { id: 'points', label: 'History Poin', icon: Coins },
                          !isAdmin && { id: 'subscription', label: 'Langganan', icon: Crown },
                          { id: 'activity', label: 'Log Aktivitas', icon: Activity },
                      ].filter(Boolean).map((item: any) => (
                          <button
                              key={item.id}
                              onClick={() => setActiveTab(item.id)}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                          >
                              <item.icon size={18}/> {item.label}
                          </button>
                      ))}
                      
                      <div className="my-2 border-t border-white/5"></div>
                      
                      {!isAdmin && !currentUser.isSeller && (
                          <button onClick={() => navigate('/open-store')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-purple-400 hover:bg-purple-500/10 transition-all">
                              <Store size={18}/> Buka Toko
                          </button>
                      )}
                      
                      {!isAdmin && currentUser.isSeller && (
                          <button onClick={() => navigate('/open-store')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-brand-400 hover:bg-brand-500/10 transition-all">
                              <Store size={18}/> Toko Saya
                          </button>
                      )}

                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all">
                          <LogOut size={18}/> Logout
                      </button>
                  </div>
              </div>
          </div>

          {/* RIGHT CONTENT: DYNAMIC TABS */}
          <div className="lg:col-span-3">
              {activeTab === 'overview' && (
                  <div className="space-y-6 animate-fade-in">
                      <h2 className="text-2xl font-bold text-white mb-6">Overview Akun</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
                              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Lock size={16} /> Ganti Password</h3>
                              <div className="relative mb-3">
                                  <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-dark-bg border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-brand-500" placeholder="Password Baru"/>
                                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-white">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                              </div>
                              <button onClick={handleChangePassword} className="w-full bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2"><Save size={18} /> Update Password</button>
                          </div>

                          <div className="bg-dark-card border border-white/5 rounded-2xl p-6">
                              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Shield size={16} /> Keamanan & Status</h3>
                              <div className="space-y-3">
                                  <div className="flex justify-between items-center p-3 bg-dark-bg rounded-xl border border-white/5">
                                      <span className="text-sm text-gray-400">Status Akun</span>
                                      <span className={`px-2 py-1 rounded text-xs font-bold ${currentUser.isBanned ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>{currentUser.isBanned ? 'BANNED' : 'ACTIVE'}</span>
                                  </div>
                                  <div className="flex justify-between items-center p-3 bg-dark-bg rounded-xl border border-white/5">
                                      <span className="text-sm text-gray-400">Verifikasi</span>
                                      <span className={`px-2 py-1 rounded text-xs font-bold ${currentUser.isVerified ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>{currentUser.isVerified ? 'VERIFIED' : 'UNVERIFIED'}</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {activeTab === 'subscription' && (
                  <div className="space-y-6 animate-fade-in">
                      <div className="flex justify-between items-end mb-6">
                          <div>
                              <h2 className="text-2xl font-bold text-white">Membership</h2>
                              <p className="text-gray-400 text-sm mt-1">Upgrade akunmu untuk fitur eksklusif.</p>
                          </div>
                          {isSubscribed && (
                              <div className="text-right">
                                  <span className="text-green-400 font-bold text-sm block">Status: Aktif</span>
                                  <span className="text-xs text-gray-500">Exp: {new Date(currentUser.subscriptionEndsAt!).toLocaleDateString()}</span>
                              </div>
                          )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {MEMBERSHIP_PLANS.map((plan) => (
                              <div key={plan.tier} className="bg-dark-card border border-white/5 rounded-3xl p-6 relative overflow-hidden hover:-translate-y-2 transition-all duration-300 shadow-xl group">
                                  {/* Decorative Bg */}
                                  <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-b ${plan.color} opacity-20`}></div>
                                  <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${plan.color} blur-3xl opacity-30 group-hover:opacity-50 transition-opacity`}></div>

                                  <div className="relative z-10 text-center">
                                      <h3 className="text-xl font-black text-white uppercase italic tracking-wider mb-2">{plan.name}</h3>
                                      <div className="flex items-center justify-center gap-1 mb-6">
                                          <Coins size={18} className="text-yellow-500"/>
                                          <span className="text-2xl font-bold text-brand-400">{plan.price.toLocaleString()}</span>
                                          <span className="text-xs text-gray-400">/{plan.duration} Hari</span>
                                      </div>

                                      <div className="space-y-3 mb-8 text-left bg-black/20 p-4 rounded-xl border border-white/5">
                                          {plan.benefits.map((b, i) => (
                                              <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                                  <Check size={16} className="text-green-400 shrink-0 mt-0.5"/>
                                                  <span>{b}</span>
                                              </div>
                                          ))}
                                      </div>

                                      <button 
                                          onClick={() => handleBuySubscription(plan.tier)}
                                          disabled={isSubscribed && currentUser.membershipTier === plan.tier}
                                          className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                                              isSubscribed && currentUser.membershipTier === plan.tier 
                                              ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                                              : `bg-gradient-to-r ${plan.color} text-white hover:brightness-110 shadow-lg`
                                          }`}
                                      >
                                          {isSubscribed && currentUser.membershipTier === plan.tier ? 'Paket Saat Ini' : 'Beli Sekarang'}
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* ... (Existing orders, wishlist, points, activity tabs remain unchanged) ... */}
              {activeTab === 'orders' && (
                  <div className="space-y-4 animate-fade-in">
                      <h2 className="text-2xl font-bold text-white mb-6">Riwayat Pesanan</h2>
                      {myOrders.length === 0 ? (
                          <div className="text-center py-12 text-gray-500 bg-dark-card rounded-3xl border border-white/5"><Receipt size={48} className="mx-auto mb-4 opacity-20" /><p>Belum ada riwayat pesanan.</p></div>
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
                                          <p className="text-xs text-gray-500">{order.variantName || 'Regular Pack'}</p>
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
                                               <div className="relative group w-full">
                                                   <button className="w-full bg-white/5 hover:bg-white/10 text-gray-300 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 border border-white/10"><Upload size={16}/> {order.paymentProof ? 'Bukti Terkirim' : 'Upload Bukti Bayar'}</button>
                                                   <input type="file" onChange={(e) => handleUploadProof(e, order.id)} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                               </div>
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

              {activeTab === 'wishlist' && (
                  <div className="animate-fade-in">
                      <h2 className="text-2xl font-bold text-white mb-6">Wishlist Saya</h2>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                          {wishlistItems.length === 0 ? (
                              <div className="col-span-full text-center py-12 text-gray-500 bg-dark-card rounded-3xl border border-white/5"><Heart size={48} className="mx-auto mb-4 opacity-20" /><p>Wishlist kosong.</p></div>
                          ) : (
                              wishlistItems.map(p => (
                                  <ProductCard key={p.id} product={p} canBuy={true} onBuy={() => navigate(`/shop?product=${p.id}`)} />
                              ))
                          )}
                      </div>
                  </div>
              )}

              {activeTab === 'points' && !isAdmin && (
                  <div className="space-y-4 animate-fade-in">
                       <h2 className="text-2xl font-bold text-white mb-6">Riwayat Poin</h2>
                       {pointHistory.length === 0 ? (
                           <div className="text-center py-12 text-gray-500 bg-dark-card rounded-3xl border border-white/5"><Coins size={48} className="mx-auto mb-4 opacity-20" /><p>Belum ada riwayat transaksi poin.</p></div>
                       ) : (
                           pointHistory.map(h => (
                               <div key={h.id} className="flex items-center justify-between bg-dark-card border border-white/5 p-4 rounded-xl">
                                   <div className="flex items-center gap-4">
                                       <div className={`w-10 h-10 rounded-full flex items-center justify-center ${h.type === 'ADD' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                           {h.type === 'ADD' ? <PlusIcon /> : <MinusIcon />}
                                       </div>
                                       <div>
                                           <p className="font-bold text-white text-sm">{h.reason}</p>
                                           <p className="text-xs text-gray-500">{new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString()}</p>
                                       </div>
                                   </div>
                                   <span className={`font-bold ${h.type === 'ADD' ? 'text-green-400' : 'text-red-400'}`}>{h.type === 'ADD' ? '+' : '-'}{h.amount}</span>
                               </div>
                           ))
                       )}
                  </div>
              )}

              {activeTab === 'activity' && (
                  <div className="space-y-2 animate-fade-in">
                       <h2 className="text-2xl font-bold text-white mb-6">Log Aktivitas</h2>
                       <div className="bg-dark-card border border-white/5 rounded-3xl overflow-hidden">
                           {myLogs.length === 0 ? (
                               <div className="text-center py-12 text-gray-500"><Activity size={48} className="mx-auto mb-4 opacity-20" /><p>Belum ada aktivitas.</p></div>
                           ) : (
                               myLogs.map(l => (
                                   <div key={l.id} className="flex gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors last:border-0">
                                       <div className="text-gray-500 text-xs min-w-[80px] pt-1">{new Date(l.timestamp).toLocaleDateString()}</div>
                                       <div>
                                           <span className="text-brand-400 font-bold text-xs uppercase mr-2">{l.action}</span>
                                           <span className="text-gray-300 text-sm">{l.details}</span>
                                       </div>
                                   </div>
                               ))
                           )}
                       </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

const PlusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
const MinusIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>;
const CheckCircle = ({size}:{size:number}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;

export default Profile;
