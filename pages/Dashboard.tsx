
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Product, User, UserRole, Order, ActivityLog, OrderStatus, VipLevel, Coupon, ProductType, SiteProfile } from '../types';
import { Plus, Trash2, Save, User as UserIcon, Package, LayoutDashboard, CheckCircle, Ban, Image as ImageIcon, Coins, ShoppingCart, FileText, BadgeCheck, Ticket, TrendingUp, Users, DollarSign, Loader2, Search, X, Settings, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string, icon: any, color: string }) => (
    <div className="bg-dark-card border border-white/5 p-6 rounded-3xl shadow-xl hover:border-white/10 transition-all relative overflow-hidden group">
        <div className={`absolute -right-6 -top-6 w-32 h-32 bg-${color}-500/10 rounded-full blur-2xl group-hover:bg-${color}-500/20 transition-all`}></div>
        <div className="relative z-10">
            <div className={`p-3 rounded-2xl bg-${color}-500/10 text-${color}-400 w-fit mb-4`}>
                <Icon size={24} />
            </div>
            <h4 className="text-3xl font-extrabold text-white mb-1">{value}</h4>
            <p className="text-gray-400 text-sm font-medium tracking-wide uppercase">{title}</p>
        </div>
    </div>
);

const Dashboard: React.FC<{ user: User | null }> = ({ user }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'members' | 'coupons' | 'logs' | 'settings'>('overview');
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [siteProfile, setSiteProfile] = useState<SiteProfile | null>(null);

  // Form States
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ type: 'ITEM' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Stats
  const [stats, setStats] = useState({ revenue: 0, pendingOrders: 0, totalMembers: 0, totalOrders: 0 });

  useEffect(() => {
    if (!user || user.role !== UserRole.ADMIN) {
      navigate('/login');
      return;
    }
    
    fetchStaticData();
    
    const unsubscribeOrders = StorageService.subscribeToOrders((updatedOrders) => {
        setOrders(updatedOrders);
        const rev = updatedOrders.filter(x => x.status === OrderStatus.COMPLETED).reduce((acc, curr) => acc + curr.price, 0);
        const pend = updatedOrders.filter(x => x.status === OrderStatus.PENDING).length;
        setStats(prev => ({
            ...prev,
            revenue: rev,
            pendingOrders: pend,
            totalOrders: updatedOrders.length
        }));
    });

    return () => {
        unsubscribeOrders();
    };
  }, [user]);

  const fetchStaticData = async () => {
    try {
        const [p, allUsers, l, c, prof] = await Promise.all([
            StorageService.getProducts(),
            StorageService.getUsers(),
            StorageService.getLogs(),
            StorageService.getCoupons(),
            StorageService.getProfile()
        ]);
        
        setProducts(p);
        const onlyMembers = allUsers.filter(u => u.role !== UserRole.ADMIN);
        setMembers(onlyMembers);
        setLogs(l);
        setCoupons(c);
        setSiteProfile(prof);
        setStats(prev => ({ ...prev, totalMembers: onlyMembers.length }));
    } catch (err) {}
  };
  
  const refreshData = async () => {
      setLoading(true);
      await fetchStaticData();
      setLoading(false);
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsUploading(true);
          try {
              const compressedBase64 = await StorageService.compressImage(file, 300); // Max 300KB for Products
              setNewProduct(prev => ({ ...prev, image: compressedBase64 }));
              addToast("Gambar produk berhasil diupload!", "success");
          } catch (error) {
              addToast("Gagal memproses gambar.", "error");
          } finally {
              setIsUploading(false);
          }
      }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) return addToast("Nama dan Harga wajib diisi", "error");
    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name!,
      price: Number(newProduct.price),
      category: newProduct.category || 'General',
      description: newProduct.description || '',
      stock: 999,
      image: newProduct.image,
      type: newProduct.type || 'ITEM',
    };
    await StorageService.saveProduct(product);
    setNewProduct({ type: 'ITEM' });
    addToast("Produk berhasil ditambahkan!", "success");
    refreshData();
  };

  const handleDeleteProduct = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // FIX: Prevent row click bubbling
    if (confirm("Hapus produk ini?")) {
      await StorageService.deleteProduct(id);
      addToast("Produk dihapus", "info");
      setProducts(prev => prev.filter(p => p.id !== id)); // Optimistic UI Update
    }
  };

  const handleOrderStatus = async (orderId: string, status: OrderStatus) => {
    await StorageService.updateOrderStatus(orderId, status, user?.username || 'Admin');
    addToast(`Order updated to ${status}`, "success");
  };

  const handleUserAction = async (e: React.MouseEvent, userId: string, action: 'verify' | 'ban' | 'delete') => {
      e.stopPropagation(); // FIX: Prevent bubbling
      
      const target = await StorageService.findUser(userId);
      if(!target) return;

      if(action === 'delete') {
          if(confirm("Hapus user ini secara permanen?")) {
              await StorageService.deleteUser(userId);
              addToast("User dihapus", "info");
              setMembers(prev => prev.filter(m => m.id !== userId));
          }
      } else {
          if(action === 'verify') target.isVerified = !target.isVerified;
          if(action === 'ban') target.isBanned = !target.isBanned;
          await StorageService.saveUser(target);
          addToast("Status user diperbarui", "success");
          refreshData();
      }
  };
  
  const handleManagePoints = async (userId: string, amount: number, type: 'ADD' | 'SUBTRACT') => {
      await StorageService.managePoints(user!.username, userId, amount, type);
      addToast("Poin user diperbarui", "success");
      refreshData();
  };

  const handleSaveProfile = async () => {
      if(siteProfile) {
          await StorageService.saveProfile(siteProfile);
          addToast("Pengaturan toko disimpan!", "success");
      }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8 sm:px-6 lg:px-8 min-h-screen">
      {loading && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm">
              <div className="bg-dark-card p-6 rounded-3xl flex flex-col items-center gap-4 border border-white/10">
                  <Loader2 className="animate-spin text-brand-500" size={40}/>
                  <p className="text-white font-bold">Sinkronisasi Data...</p>
              </div>
          </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="w-full lg:w-72 bg-dark-card/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 h-fit lg:sticky lg:top-24 shadow-2xl">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="p-3 bg-brand-600 rounded-xl shadow-lg shadow-brand-500/30 text-white"><LayoutDashboard size={24} /></div>
            <div><h2 className="font-extrabold text-xl text-white">Owner Panel</h2><p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest">Store Management</p></div>
          </div>
          
          <nav className="space-y-2">
            {[
                { id: 'overview', label: 'Ringkasan', icon: TrendingUp },
                { id: 'products', label: 'Katalog Produk', icon: Package },
                { id: 'orders', label: 'Pesanan Masuk', icon: ShoppingCart, badge: stats.pendingOrders },
                { id: 'members', label: 'Daftar Member', icon: Users },
                { id: 'coupons', label: 'Promo & Kupon', icon: Ticket },
                { id: 'logs', label: 'Log Aktivitas', icon: FileText },
                { id: 'settings', label: 'Pengaturan Toko', icon: Settings }
            ].map(item => (
                <button 
                    key={item.id} 
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                    <item.icon size={18} /> {item.label}
                    {item.badge ? <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">{item.badge}</span> : null}
                </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-8">
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
              <div className="animate-fade-in space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <StatCard title="Pendapatan" value={`Rp ${stats.revenue.toLocaleString()}`} icon={DollarSign} color="green" />
                      <StatCard title="Pending" value={stats.pendingOrders.toString()} icon={ShoppingCart} color="yellow" />
                      <StatCard title="Member" value={stats.totalMembers.toString()} icon={Users} color="blue" />
                      <StatCard title="Total Order" value={stats.totalOrders.toString()} icon={CheckCircle} color="purple" />
                  </div>

                  <div className="bg-dark-card border border-white/5 rounded-3xl p-8">
                      <h3 className="text-white font-bold mb-6">Aktivitas Terbaru (Semua User)</h3>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {logs.slice(0, 20).map(log => (
                              <div key={log.id} className="flex items-center gap-4 p-4 bg-dark-bg/50 rounded-2xl border border-white/5">
                                  <div className="text-brand-400"><FileText size={18}/></div>
                                  <div className="flex-1">
                                      <p className="text-sm text-white font-medium"><span className="text-brand-400 font-bold">{log.username}</span> <span className="text-gray-400 text-xs">({log.action})</span>: {log.details}</p>
                                      <p className="text-[10px] text-gray-500">{new Date(log.timestamp).toLocaleString()}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* TAB: PRODUCTS */}
          {activeTab === 'products' && (
              <div className="animate-fade-in space-y-8">
                  <div className="bg-dark-card border border-white/5 rounded-3xl p-8">
                      <h3 className="text-xl font-bold text-white mb-6">Tambah Produk Baru</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <input placeholder="Nama Produk" className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white" value={newProduct.name || ''} onChange={e => setNewProduct({...newProduct, name: e.target.value})}/>
                          <input placeholder="Harga Dasar (Rp)" type="number" className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}/>
                          <select className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white" value={newProduct.type} onChange={e => setNewProduct({...newProduct, type: e.target.value as ProductType})}>
                              <option value="ITEM">Digital Item</option>
                              <option value="SKIN">Gift Skin</option>
                              <option value="JOKI">Jasa Joki</option>
                              <option value="REKBER">Rekber</option>
                              <option value="VOUCHER">Voucher</option>
                              <option value="OTHER">Lainnya</option>
                          </select>
                          
                          {/* File Input for Product Image */}
                          <div className="relative group">
                              <input 
                                  type="file" 
                                  onChange={handleProductImageUpload} 
                                  className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                  accept="image/*"
                              />
                              <div className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white flex items-center gap-3">
                                  <Upload size={18} className="text-gray-400"/>
                                  <span className="text-sm text-gray-400 truncate">
                                      {newProduct.image ? 'Gambar Terupload (Klik ubah)' : 'Upload Gambar Produk (Max 300KB)'}
                                  </span>
                              </div>
                              {newProduct.image && (
                                  <div className="absolute top-1/2 right-2 -translate-y-1/2 w-8 h-8 rounded border border-white/10 overflow-hidden">
                                      <img src={newProduct.image} className="w-full h-full object-cover"/>
                                  </div>
                              )}
                              {isUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl z-20"><Loader2 className="animate-spin text-white"/></div>}
                          </div>

                          <textarea placeholder="Deskripsi Produk" className="md:col-span-2 bg-dark-bg border border-white/10 rounded-xl p-3 text-white h-24" value={newProduct.description || ''} onChange={e => setNewProduct({...newProduct, description: e.target.value})}/>
                          <button onClick={handleAddProduct} className="md:col-span-2 bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"><Plus className="inline mr-2"/>Simpan Produk</button>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {products.map(p => (
                          <div key={p.id} className="bg-dark-card border border-white/5 p-4 rounded-2xl flex items-center gap-4 group">
                              <img src={p.image || "https://picsum.photos/100"} className="w-16 h-16 rounded-xl object-cover"/>
                              <div className="flex-1 min-w-0">
                                  <h4 className="text-white font-bold text-sm truncate">{p.name}</h4>
                                  <p className="text-brand-400 font-bold text-xs">Rp {p.price.toLocaleString()}</p>
                              </div>
                              {/* FIX: Stop Propagation */}
                              <button onClick={(e) => handleDeleteProduct(e, p.id)} className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 transition-all rounded-lg z-10">
                                  <Trash2 size={18}/>
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* TAB: ORDERS */}
          {activeTab === 'orders' && (
              <div className="animate-fade-in space-y-6">
                  {/* ... Existing Order Search & List ... */}
                  <div className="flex items-center gap-4 bg-dark-card p-4 rounded-2xl border border-white/5">
                      <Search className="text-gray-500" size={20}/>
                      <input placeholder="Cari ID Transaksi atau Nama User..." className="bg-transparent border-none outline-none text-white w-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                  </div>
                  
                  <div className="space-y-4">
                      {orders.filter(o => o.id.includes(searchTerm) || o.username.toLowerCase().includes(searchTerm.toLowerCase())).map(order => (
                          <div key={order.id} className="bg-dark-card border border-white/5 p-6 rounded-3xl flex flex-col md:flex-row justify-between gap-6 hover:border-brand-500/30 transition-all">
                              <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                      <span className="text-brand-400 font-mono text-xs">#{order.id}</span>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${order.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}>{order.status}</span>
                                      {order.paymentProof && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 rounded flex items-center gap-1"><ImageIcon size={10}/> Bukti Ada</span>}
                                  </div>
                                  <h3 className="text-white font-bold text-lg">{order.productName}</h3>
                                  <p className="text-gray-400 text-sm">{order.username} • {order.whatsapp}</p>
                                  <div className="mt-3 flex gap-2 flex-wrap">
                                      {order.gameData && Object.entries(order.gameData).map(([k,v]) => (
                                          <span key={k} className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[10px] text-gray-300">{k}: {v}</span>
                                      ))}
                                  </div>
                                  {order.paymentProof && (
                                      <div className="mt-3">
                                          <a href={order.paymentProof} target="_blank" className="text-xs text-blue-400 hover:underline">Lihat Bukti Pembayaran</a>
                                      </div>
                                  )}
                              </div>
                              <div className="flex flex-col justify-between items-end gap-4">
                                  <div className="text-right">
                                      <p className="text-white font-bold text-xl">Rp {order.price.toLocaleString()}</p>
                                      <p className="text-[10px] text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                                  </div>
                                  <div className="flex gap-2">
                                      {order.status === OrderStatus.PENDING && <button onClick={() => handleOrderStatus(order.id, OrderStatus.PROCESSED)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Proses</button>}
                                      {order.status === OrderStatus.PROCESSED && <button onClick={() => handleOrderStatus(order.id, OrderStatus.COMPLETED)} className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold">Selesai</button>}
                                      <button onClick={() => handleOrderStatus(order.id, OrderStatus.CANCELLED)} className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-xs font-bold">Batal</button>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* TAB: MEMBERS */}
          {activeTab === 'members' && (
              <div className="animate-fade-in space-y-6">
                  <div className="bg-dark-card border border-white/5 rounded-3xl overflow-hidden">
                      <div className="p-6 border-b border-white/5 flex justify-between items-center">
                          <h3 className="text-white font-bold">Daftar Member Terdaftar ({members.length})</h3>
                          <div className="text-xs text-gray-500 italic">*Admin tidak ditampilkan</div>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left">
                              <thead className="bg-white/5 text-[10px] uppercase font-bold text-gray-500">
                                  <tr>
                                      <th className="p-4">User</th>
                                      <th className="p-4">Email</th>
                                      <th className="p-4">Poin</th>
                                      <th className="p-4">Status</th>
                                      <th className="p-4 text-right">Aksi</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                  {members.map(m => (
                                      <tr key={m.id} className="hover:bg-white/5 transition-colors">
                                          <td className="p-4">
                                              <div className="flex items-center gap-3">
                                                  <img src={m.avatar || "https://picsum.photos/40"} className="w-8 h-8 rounded-full border border-white/10"/>
                                                  <div>
                                                      <span className="text-white font-bold text-sm block">{m.username}</span>
                                                      <span className="text-xs text-gray-500">Followers: {m.followers?.length || 0}</span>
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="p-4 text-gray-400 text-xs">{m.email}</td>
                                          <td className="p-4 text-brand-400 font-bold">
                                              {m.points.toLocaleString()}
                                              <div className="flex gap-1 mt-1">
                                                  <button onClick={() => handleManagePoints(m.id, 10, 'ADD')} className="text-[10px] bg-green-500/20 text-green-500 px-1 rounded hover:bg-green-500/40">+</button>
                                                  <button onClick={() => handleManagePoints(m.id, 10, 'SUBTRACT')} className="text-[10px] bg-red-500/20 text-red-500 px-1 rounded hover:bg-red-500/40">-</button>
                                              </div>
                                          </td>
                                          <td className="p-4">
                                              <div className="flex gap-2">
                                                  {m.isVerified ? <BadgeCheck className="text-green-500" size={16}/> : <X className="text-gray-600" size={16}/>}
                                                  {m.isBanned && <Ban className="text-red-500" size={16}/>}
                                              </div>
                                          </td>
                                          <td className="p-4 text-right">
                                              <div className="flex justify-end gap-2">
                                                  {/* FIX: Stop Propagation for Actions */}
                                                  <button onClick={(e) => handleUserAction(e, m.id, 'verify')} className={`p-2 rounded-lg ${m.isVerified ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-400'}`} title="Toggle Verifikasi"><CheckCircle size={14}/></button>
                                                  <button onClick={(e) => handleUserAction(e, m.id, 'ban')} className={`p-2 rounded-lg ${m.isBanned ? 'bg-red-500/20 text-red-500' : 'bg-gray-500/10 text-gray-400'}`} title="Ban/Unban"><Ban size={14}/></button>
                                                  <button onClick={(e) => handleUserAction(e, m.id, 'delete')} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white" title="Hapus"><Trash2 size={14}/></button>
                                              </div>
                                          </td>
                                      </tr>
                                  ))}
                                  {members.length === 0 && (
                                      <tr><td colSpan={5} className="p-10 text-center text-gray-500">Belum ada member terdaftar selain Admin.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          )}

           {/* TAB: LOGS */}
           {activeTab === 'logs' && (
              <div className="animate-fade-in bg-dark-card border border-white/5 rounded-3xl overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex justify-between items-center">
                      <h3 className="text-white font-bold">Audit Logs (System History)</h3>
                      <button onClick={refreshData} className="text-xs text-brand-400 font-bold">Refresh</button>
                  </div>
                  <div className="p-6 space-y-2">
                      {logs.map(l => (
                          <div key={l.id} className="text-[11px] font-mono border-b border-white/5 pb-2 flex gap-4">
                              <span className="text-gray-600 min-w-[140px]">[{new Date(l.timestamp).toLocaleString()}]</span>
                              <span className="text-brand-500 font-bold">{l.username}</span>
                              <span className="text-white"><span className="text-yellow-500 font-bold">[{l.action}]</span> {l.details}</span>
                          </div>
                      ))}
                  </div>
              </div>
          )}
          
          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && siteProfile && (
            <div className="animate-fade-in space-y-8">
                <div className="bg-dark-card border border-white/5 rounded-3xl p-8">
                     {/* ... Settings Form ... */}
                     <div className="flex justify-between items-center mb-6">
                         <h3 className="text-xl font-bold text-white">Pengaturan Umum Toko</h3>
                         <button onClick={handleSaveProfile} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Save size={16}/> Simpan Perubahan</button>
                     </div>
                     <div className="grid grid-cols-1 gap-6">
                         <div>
                             <label className="block text-sm text-gray-400 mb-2">Nama Toko</label>
                             <input value={siteProfile.name} onChange={e => setSiteProfile({...siteProfile, name: e.target.value})} className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white"/>
                         </div>
                         <div>
                             <label className="block text-sm text-gray-400 mb-2">Deskripsi Toko</label>
                             <textarea value={siteProfile.description} onChange={e => setSiteProfile({...siteProfile, description: e.target.value})} className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white" rows={3}/>
                         </div>
                         <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center gap-4">
                             <div className="p-3 bg-blue-500 rounded-xl text-white"><CheckCircle size={24}/></div>
                             <div>
                                 <p className="text-sm text-blue-400 font-bold uppercase tracking-wider">Akses Owner Terverifikasi</p>
                                 <p className="text-xs text-gray-400 mt-1">Email Login Admin: <span className="text-white font-mono bg-black/30 px-2 py-1 rounded">aldipranatapratama2005@gmail.com</span></p>
                             </div>
                         </div>
                     </div>
                </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
