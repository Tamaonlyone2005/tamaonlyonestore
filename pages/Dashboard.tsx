
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Product, User, UserRole, Order, ActivityLog, OrderStatus, VipLevel, Coupon, ProductType, SiteProfile, StoreStatus, Report } from '../types';
import { Plus, Trash2, Save, User as UserIcon, Package, LayoutDashboard, CheckCircle, Ban, Image as ImageIcon, Coins, ShoppingCart, FileText, BadgeCheck, Ticket, TrendingUp, Users, DollarSign, Loader2, Search, X, Settings, Upload, Store, Lock, Unlock, Flag, AlertTriangle, Copy, Zap, ArrowUpCircle, Edit2 } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'members' | 'stores' | 'coupons' | 'logs' | 'reports' | 'settings'>('overview');
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]); // Store both admin & member
  const [members, setMembers] = useState<User[]>([]);
  const [sellers, setSellers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [siteProfile, setSiteProfile] = useState<SiteProfile | null>(null);

  // Form States
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ type: 'ITEM' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Store Management State
  const [selectedStoreProducts, setSelectedStoreProducts] = useState<Product[]>([]);
  const [viewingStoreId, setViewingStoreId] = useState<string | null>(null);
  const [manualExpId, setManualExpId] = useState<string | null>(null);
  const [manualExpVal, setManualExpVal] = useState('');
  const [manualLevelVal, setManualLevelVal] = useState('');

  // Points Management State
  const [pointUid, setPointUid] = useState('');
  const [pointAmount, setPointAmount] = useState('');

  // Coupon Form
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({ isActive: true, isPublic: true });

  // Stats
  const [stats, setStats] = useState({ revenue: 0, pendingOrders: 0, totalMembers: 0, totalOrders: 0 });

  useEffect(() => {
    if (!user || user.role !== UserRole.ADMIN) {
      navigate('/login');
      return;
    }
    
    refreshData();
    
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
        const [p, allUsers, l, c, rep, prof] = await Promise.all([
            StorageService.getProducts(),
            StorageService.getUsers(),
            StorageService.getLogs(),
            StorageService.getCoupons(),
            StorageService.getReports(),
            StorageService.getProfile()
        ]);
        
        setAllProducts(p); // ALL products
        setProducts(p.filter(prod => !prod.sellerId)); // Only Admin products for "Products" tab
        
        const onlyMembers = allUsers.filter(u => u.role !== UserRole.ADMIN);
        setMembers(onlyMembers);
        setSellers(onlyMembers.filter(u => u.isSeller));
        setLogs(l);
        setCoupons(c);
        setReports(rep);
        setSiteProfile(prof);
        setStats(prev => ({ ...prev, totalMembers: onlyMembers.length }));
    } catch (err) {
        addToast("Gagal memuat beberapa data dashboard.", "error");
    }
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
              const compressedBase64 = await StorageService.compressImage(file, 300);
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
    e.stopPropagation();
    if (confirm("Hapus produk ini?")) {
      await StorageService.deleteProduct(id);
      addToast("Produk dihapus", "info");
      refreshData();
    }
  };
  
  const handleToggleBoost = async (product: Product) => {
      await StorageService.toggleProductBoost(product.id, !product.isBoosted);
      addToast(`Status Boost produk diperbarui!`, "success");
      refreshData();
      if(viewingStoreId) {
          // Update local view state if viewing a store
          setSelectedStoreProducts(prev => prev.map(p => p.id === product.id ? {...p, isBoosted: !p.isBoosted} : p));
      }
  };

  const handleOrderStatus = async (orderId: string, status: OrderStatus) => {
    await StorageService.updateOrderStatus(orderId, status, user?.username || 'Admin');
    addToast(`Order updated to ${status}`, "success");
  };

  const handleUserAction = async (e: React.MouseEvent, userId: string, action: 'verify' | 'ban' | 'delete') => {
      e.stopPropagation();
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
  
  const handleStoreAction = async (userId: string, action: 'VERIFY' | 'SUSPEND' | 'DELETE') => {
      if(action === 'DELETE') {
          if(confirm("Hapus toko dan semua produknya?")) {
              await StorageService.deleteStore(userId);
              addToast("Toko dihapus.", "info");
          }
      } else {
          const status = action === 'VERIFY' ? StoreStatus.ACTIVE : StoreStatus.SUSPENDED;
          await StorageService.updateStoreStatus(userId, status);
          addToast("Status toko diperbarui.", "success");
      }
      refreshData();
  };
  
  const handleViewStoreProducts = (sellerId: string) => {
      if (viewingStoreId === sellerId) {
          setViewingStoreId(null);
          setSelectedStoreProducts([]);
      } else {
          setViewingStoreId(sellerId);
          setSelectedStoreProducts(allProducts.filter(p => p.sellerId === sellerId));
      }
  };
  
  const handleUpdateStoreLevel = async () => {
      if(!manualExpId) return;
      await StorageService.updateStoreExp(manualExpId, Number(manualExpVal), Number(manualLevelVal));
      addToast("Level toko diperbarui!", "success");
      setManualExpId(null);
      refreshData();
  };
  
  const handleManagePointsByUID = async (type: 'ADD' | 'SUBTRACT') => {
      if(!pointUid || !pointAmount) return addToast("Isi UID dan Jumlah", "error");
      const targetUser = await StorageService.findUser(pointUid);
      
      if(targetUser) {
          await StorageService.managePoints(user!.username, targetUser.id, Number(pointAmount), type);
          addToast(`Poin ${targetUser.username} berhasil ${type === 'ADD' ? 'ditambah' : 'dikurangi'}!`, "success");
          setPointUid('');
          setPointAmount('');
          refreshData();
      } else {
          addToast("Member dengan UID tersebut tidak ditemukan.", "error");
      }
  };

  const handleSaveProfile = async () => {
      if(siteProfile) {
          await StorageService.saveProfile(siteProfile);
          addToast("Pengaturan toko disimpan!", "success");
          window.location.reload();
      }
  };

  const handleAddCoupon = async () => {
      if(!newCoupon.code || !newCoupon.discountAmount) return addToast("Lengkapi data kupon", "error");
      const coupon: Coupon = {
          id: Date.now().toString(),
          code: newCoupon.code.toUpperCase(),
          name: newCoupon.name || 'Promo',
          discountAmount: Number(newCoupon.discountAmount),
          costPoints: Number(newCoupon.costPoints || 0),
          isPublic: newCoupon.isPublic || false,
          isActive: true
      };
      await StorageService.saveCoupon(coupon);
      setCoupons(prev => [...prev, coupon]);
      setNewCoupon({ isActive: true, isPublic: true });
      addToast("Kupon berhasil dibuat", "success");
  };

  const handleDeleteCoupon = async (id: string) => {
      if(confirm("Hapus kupon?")) {
          await StorageService.deleteCoupon(id);
          setCoupons(prev => prev.filter(c => c.id !== id));
      }
  };

  const handleDeleteReport = async (id: string) => {
      await StorageService.deleteReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
      addToast("Laporan dihapus", "info");
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      addToast("UID disalin!", "info");
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
                { id: 'stores', label: 'Manajemen Toko', icon: Store },
                { id: 'coupons', label: 'Promo & Kupon', icon: Ticket },
                { id: 'reports', label: 'Laporan', icon: Flag, badge: reports.length },
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
              </div>
          )}

          {/* TAB: PRODUCTS */}
          {activeTab === 'products' && (
              <div className="animate-fade-in space-y-8">
                  {/* ... Existing Product Form ... */}
                  <div className="bg-dark-card border border-white/5 rounded-3xl p-8">
                      <h3 className="text-xl font-bold text-white mb-6">Tambah Produk Admin (Official)</h3>
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
                          
                          <div className="relative group">
                              <input type="file" onChange={handleProductImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
                              <div className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white flex items-center gap-3">
                                  <Upload size={18} className="text-gray-400"/>
                                  <span className="text-sm text-gray-400 truncate">{newProduct.image ? 'Gambar Terupload' : 'Upload Gambar'}</span>
                              </div>
                          </div>

                          <textarea placeholder="Deskripsi Produk" className="md:col-span-2 bg-dark-bg border border-white/10 rounded-xl p-3 text-white h-24" value={newProduct.description || ''} onChange={e => setNewProduct({...newProduct, description: e.target.value})}/>
                          <button onClick={handleAddProduct} className="md:col-span-2 bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"><Plus className="inline mr-2"/>Simpan Produk Official</button>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {products.map(p => (
                          <div key={p.id} className="bg-dark-card border border-white/5 p-4 rounded-2xl flex items-center gap-4 group">
                              <img src={p.image || "https://picsum.photos/100"} className="w-16 h-16 rounded-xl object-cover"/>
                              <div className="flex-1 min-w-0">
                                  <h4 className="text-white font-bold text-sm truncate">{p.name}</h4>
                                  <p className="text-brand-400 font-bold text-xs">Rp {p.price.toLocaleString()}</p>
                                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase">Official</span>
                              </div>
                              <button onClick={(e) => handleDeleteProduct(e, p.id)} className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 transition-all rounded-lg z-10"><Trash2 size={18}/></button>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* TAB: ORDERS */}
          {activeTab === 'orders' && (
              <div className="animate-fade-in space-y-6">
                  <div className="flex items-center gap-4 bg-dark-card p-4 rounded-2xl border border-white/5">
                      <Search className="text-gray-500" size={20}/>
                      <input placeholder="Cari ID Transaksi atau Nama User..." className="bg-transparent border-none outline-none text-white w-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                  </div>
                  
                  {orders.length === 0 ? (
                      <div className="bg-dark-card p-10 rounded-3xl text-center text-gray-500 border border-white/5">
                          <ShoppingCart size={40} className="mx-auto mb-4 opacity-20"/>
                          <p>Belum ada pesanan masuk.</p>
                      </div>
                  ) : (
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
                  )}
              </div>
          )}

          {/* TAB: MEMBERS */}
          {activeTab === 'members' && (
              <div className="animate-fade-in space-y-6">
                  <div className="bg-dark-card border border-white/5 rounded-3xl overflow-hidden">
                      <div className="p-6 border-b border-white/5 flex justify-between items-center">
                          <h3 className="text-white font-bold">Daftar Member Terdaftar ({members.length})</h3>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left">
                              <thead className="bg-white/5 text-[10px] uppercase font-bold text-gray-500">
                                  <tr>
                                      <th className="p-4">User</th>
                                      <th className="p-4">UID (Untuk Poin)</th>
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
                                                      <span className="text-[10px] bg-brand-600/20 text-brand-400 px-1.5 py-0.5 rounded">Member</span>
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="p-4">
                                              {/* SHOW FIREBASE UID */}
                                              <div className="flex items-center gap-2">
                                                  <code className="text-[10px] bg-black/30 p-1 rounded text-gray-300 font-mono truncate max-w-[100px]" title={m.id}>{m.id}</code>
                                                  <button onClick={() => copyToClipboard(m.id)} className="text-gray-500 hover:text-white p-1 rounded"><Copy size={12}/></button>
                                              </div>
                                          </td>
                                          <td className="p-4 text-brand-400 font-bold">
                                              {m.points.toLocaleString()}
                                          </td>
                                          <td className="p-4">
                                              <div className="flex gap-2">
                                                  {m.isVerified ? <BadgeCheck className="text-green-500" size={16}/> : <X className="text-gray-600" size={16}/>}
                                                  {m.isBanned && <Ban className="text-red-500" size={16}/>}
                                              </div>
                                          </td>
                                          <td className="p-4 text-right">
                                              <div className="flex justify-end gap-2">
                                                  <button onClick={(e) => handleUserAction(e, m.id, 'verify')} className={`p-2 rounded-lg ${m.isVerified ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-400'}`} title="Toggle Verifikasi"><CheckCircle size={14}/></button>
                                                  <button onClick={(e) => handleUserAction(e, m.id, 'ban')} className={`p-2 rounded-lg ${m.isBanned ? 'bg-red-500/20 text-red-500' : 'bg-gray-500/10 text-gray-400'}`} title="Ban/Unban"><Ban size={14}/></button>
                                                  <button onClick={(e) => handleUserAction(e, m.id, 'delete')} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white" title="Hapus"><Trash2 size={14}/></button>
                                              </div>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          )}

          {/* TAB: COUPONS & PROMO */}
          {activeTab === 'coupons' && (
              <div className="animate-fade-in space-y-8">
                  {/* POINTS MANAGER */}
                  <div className="bg-dark-card border border-white/5 rounded-3xl p-8 mb-8">
                      <h3 className="text-white font-bold mb-6 flex items-center gap-2"><Coins className="text-yellow-500"/> Kelola Poin Member</h3>
                      <div className="flex flex-col md:flex-row gap-4 items-end">
                          <div className="flex-1 w-full">
                              <label className="block text-xs text-gray-400 mb-1">UID Member (Copy dari Daftar Member)</label>
                              <input placeholder="Tempel UID disini..." className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white" value={pointUid} onChange={e => setPointUid(e.target.value)}/>
                          </div>
                          <div className="flex-1 w-full">
                              <label className="block text-xs text-gray-400 mb-1">Jumlah Poin</label>
                              <input type="number" placeholder="0" className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white" value={pointAmount} onChange={e => setPointAmount(e.target.value)}/>
                          </div>
                          <button onClick={() => handleManagePointsByUID('ADD')} className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold">Tambah</button>
                          <button onClick={() => handleManagePointsByUID('SUBTRACT')} className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold">Tarik</button>
                      </div>
                  </div>

                  <div className="bg-dark-card border border-white/5 rounded-3xl p-8">
                      <h3 className="text-xl font-bold text-white mb-6">Buat Kupon Baru</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <input placeholder="Kode Kupon (Contoh: MERDEKA)" className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white" value={newCoupon.code || ''} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}/>
                          <input placeholder="Potongan (Rp)" type="number" className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white" value={newCoupon.discountAmount || ''} onChange={e => setNewCoupon({...newCoupon, discountAmount: Number(e.target.value)})}/>
                          <button onClick={handleAddCoupon} className="bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"><Plus size={18}/> Buat Kupon</button>
                      </div>
                  </div>

                  <div className="space-y-4">
                      {coupons.length === 0 && <p className="text-gray-500 text-center">Belum ada kupon.</p>}
                      {coupons.map(c => (
                          <div key={c.id} className="bg-dark-card border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                              <div>
                                  <h4 className="text-white font-bold text-lg tracking-wider">{c.code}</h4>
                                  <p className="text-gray-400 text-sm">Diskon Rp {c.discountAmount.toLocaleString()}</p>
                              </div>
                              <button onClick={() => handleDeleteCoupon(c.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={18}/></button>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* TAB: REPORTS */}
          {activeTab === 'reports' && (
              <div className="animate-fade-in space-y-4">
                  <h3 className="text-white font-bold text-xl mb-4">Laporan Masuk ({reports.length})</h3>
                  {reports.length === 0 ? (
                      <div className="text-center p-12 bg-dark-card rounded-2xl border border-white/5 text-gray-500">Tidak ada laporan.</div>
                  ) : (
                      reports.map(r => (
                          <div key={r.id} className="bg-dark-card border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-start">
                              <div>
                                  <div className="flex items-center gap-2 mb-2">
                                      <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{r.targetType}</span>
                                      <span className="text-gray-400 text-xs">{new Date(r.createdAt).toLocaleString()}</span>
                                  </div>
                                  <p className="text-white font-bold">{r.reason}</p>
                                  <p className="text-gray-400 text-sm mt-1">{r.description}</p>
                                  <p className="text-xs text-gray-500 mt-2">Reporter ID: {r.reporterId} • Target ID: {r.targetId}</p>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={() => handleDeleteReport(r.id)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-bold">Hapus / Selesai</button>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          )}

          {/* TAB: STORES - Updated with Product Management */}
          {activeTab === 'stores' && (
              <div className="animate-fade-in space-y-6">
                  {manualExpId && (
                      <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
                          <div className="bg-dark-card p-6 rounded-2xl border border-white/10 w-full max-w-sm">
                              <h3 className="text-white font-bold mb-4">Update Level Toko Manual</h3>
                              <div className="space-y-4">
                                  <input type="number" placeholder="New Level (1-5)" className="w-full bg-dark-bg p-3 rounded-xl border border-white/10 text-white" value={manualLevelVal} onChange={e=>setManualLevelVal(e.target.value)}/>
                                  <input type="number" placeholder="New EXP" className="w-full bg-dark-bg p-3 rounded-xl border border-white/10 text-white" value={manualExpVal} onChange={e=>setManualExpVal(e.target.value)}/>
                                  <div className="flex gap-2">
                                      <button onClick={() => setManualExpId(null)} className="flex-1 py-2 bg-white/10 rounded-lg text-white">Batal</button>
                                      <button onClick={handleUpdateStoreLevel} className="flex-1 py-2 bg-brand-600 rounded-lg text-white">Simpan</button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}

                  <div className="bg-dark-card border border-white/5 rounded-3xl overflow-hidden">
                      <div className="p-6 border-b border-white/5 flex justify-between items-center">
                          <h3 className="text-white font-bold">Daftar Toko Member ({sellers.length})</h3>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left">
                              <thead className="bg-white/5 text-[10px] uppercase font-bold text-gray-500">
                                  <tr>
                                      <th className="p-4">Nama Toko</th>
                                      <th className="p-4">Level</th>
                                      <th className="p-4">Status</th>
                                      <th className="p-4">Produk</th>
                                      <th className="p-4 text-right">Aksi</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                  {sellers.map(s => (
                                      <React.Fragment key={s.id}>
                                          <tr className="hover:bg-white/5 transition-colors">
                                              <td className="p-4">
                                                  <div className="flex items-center gap-3">
                                                      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Store size={20}/></div>
                                                      <div>
                                                          <span className="text-white font-bold text-sm flex items-center gap-1">
                                                              {s.storeName}
                                                              {s.storeStatus === StoreStatus.ACTIVE && <BadgeCheck size={14} className="text-orange-500 fill-current"/>}
                                                          </span>
                                                          <span className="text-[10px] text-gray-400">{s.username}</span>
                                                      </div>
                                                  </div>
                                              </td>
                                              <td className="p-4">
                                                  <div className="flex flex-col cursor-pointer hover:opacity-80" onClick={() => { setManualExpId(s.id); setManualLevelVal(s.storeLevel?.toString() || '1'); setManualExpVal(s.storeExp?.toString() || '0'); }}>
                                                      <span className="text-yellow-500 font-bold text-sm flex items-center gap-1">Level {s.storeLevel || 1} <Edit2 size={10} className="text-gray-500"/></span>
                                                      <span className="text-[10px] text-gray-500">{s.storeExp || 0} EXP</span>
                                                  </div>
                                              </td>
                                              <td className="p-4">
                                                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                                      s.storeStatus === 'ACTIVE' ? 'bg-green-500/20 text-green-500' :
                                                      s.storeStatus === 'SUSPENDED' ? 'bg-red-500/20 text-red-500' :
                                                      'bg-yellow-500/20 text-yellow-500'
                                                  }`}>
                                                      {s.storeStatus || 'PENDING'}
                                                  </span>
                                              </td>
                                              <td className="p-4">
                                                  <button onClick={() => handleViewStoreProducts(s.id)} className="bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10">
                                                      {viewingStoreId === s.id ? 'Tutup' : 'Lihat Produk'}
                                                  </button>
                                              </td>
                                              <td className="p-4 text-right">
                                                  <div className="flex justify-end gap-2">
                                                      {s.storeStatus !== StoreStatus.ACTIVE && (
                                                          <button onClick={() => handleStoreAction(s.id, 'VERIFY')} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg">Verifikasi</button>
                                                      )}
                                                      {s.storeStatus !== StoreStatus.SUSPENDED && (
                                                          <button onClick={() => handleStoreAction(s.id, 'SUSPEND')} className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs rounded-lg">Blokir</button>
                                                      )}
                                                      <button onClick={() => handleStoreAction(s.id, 'DELETE')} className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg"><Trash2 size={14}/></button>
                                                  </div>
                                              </td>
                                          </tr>
                                          {viewingStoreId === s.id && (
                                              <tr>
                                                  <td colSpan={5} className="p-4 bg-black/20">
                                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                          {selectedStoreProducts.length === 0 ? (
                                                              <p className="text-gray-500 text-xs italic">Toko ini belum memiliki produk.</p>
                                                          ) : (
                                                              selectedStoreProducts.map(p => (
                                                                  <div key={p.id} className="bg-[#1e293b] p-3 rounded-xl flex gap-3 relative group">
                                                                      <img src={p.image || "https://picsum.photos/100"} className="w-16 h-16 rounded-lg object-cover"/>
                                                                      <div className="flex-1 min-w-0">
                                                                          <p className="text-white text-sm font-bold truncate">{p.name}</p>
                                                                          <p className="text-brand-400 text-xs">Rp {p.price.toLocaleString()}</p>
                                                                          {p.isBoosted && <span className="text-[9px] bg-purple-500 text-white px-1 rounded inline-block mt-1">BOOSTED</span>}
                                                                      </div>
                                                                      <div className="flex flex-col gap-1">
                                                                          <button onClick={() => handleToggleBoost(p)} className={`p-1.5 rounded-lg ${p.isBoosted ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-purple-600 hover:text-white'}`} title="Iklankan ke Home">
                                                                              <ArrowUpCircle size={14}/>
                                                                          </button>
                                                                          <button onClick={(e) => handleDeleteProduct(e, p.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" title="Hapus Produk">
                                                                              <Trash2 size={14}/>
                                                                          </button>
                                                                      </div>
                                                                  </div>
                                                              ))
                                                          )}
                                                      </div>
                                                  </td>
                                              </tr>
                                          )}
                                      </React.Fragment>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          )}

           {activeTab === 'logs' && (
              <div className="animate-fade-in bg-dark-card border border-white/5 rounded-3xl overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex justify-between items-center">
                      <h3 className="text-white font-bold">Audit Logs (System History)</h3>
                      <button onClick={refreshData} className="text-xs text-brand-400 font-bold">Refresh</button>
                  </div>
                  <div className="p-6 space-y-2">
                      {logs.length === 0 ? <p className="text-gray-500 text-center">Log kosong.</p> : logs.map(l => (
                          <div key={l.id} className="text-[11px] font-mono border-b border-white/5 pb-2 flex gap-4">
                              <span className="text-gray-600 min-w-[140px]">[{new Date(l.timestamp).toLocaleString()}]</span>
                              <span className="text-brand-500 font-bold">{l.username}</span>
                              <span className="text-white"><span className="text-yellow-500 font-bold">[{l.action}]</span> {l.details}</span>
                          </div>
                      ))}
                  </div>
              </div>
          )}
          
          {/* TAB: SETTINGS WITH MAINTENANCE TOGGLE */}
          {activeTab === 'settings' && siteProfile && (
            <div className="animate-fade-in space-y-8">
                <div className="bg-dark-card border border-white/5 rounded-3xl p-8">
                     <div className="flex justify-between items-center mb-6">
                         <h3 className="text-xl font-bold text-white">Pengaturan Umum Toko</h3>
                         <button onClick={handleSaveProfile} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Save size={16}/> Simpan Perubahan</button>
                     </div>
                     <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-between">
                         <div className="flex items-center gap-3">
                             <div className={`p-3 rounded-xl ${siteProfile.isLocked ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                                 {siteProfile.isLocked ? <Lock size={20}/> : <Unlock size={20}/>}
                             </div>
                             <div>
                                 <h4 className="font-bold text-white">Maintenance Mode</h4>
                                 <p className="text-xs text-gray-400">Jika aktif, hanya Admin yang bisa mengakses website.</p>
                             </div>
                         </div>
                         <button 
                            onClick={() => setSiteProfile({...siteProfile, isLocked: !siteProfile.isLocked})}
                            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${siteProfile.isLocked ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                         >
                             {siteProfile.isLocked ? 'NONAKTIFKAN' : 'AKTIFKAN'}
                         </button>
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
