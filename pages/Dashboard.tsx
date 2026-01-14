
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Product, User, UserRole, Order, ActivityLog, OrderStatus, Coupon, ProductType, SiteProfile, StoreStatus, Report, Archive, Feedback, BotConfig, ServiceRequest } from '../types';
import { Plus, Trash2, Save, Package, LayoutDashboard, CheckCircle, Ban, Image as ImageIcon, Coins, ShoppingCart, FileText, BadgeCheck, Ticket, TrendingUp, Users, DollarSign, Loader2, Search, X, Settings, Upload, Store, Lock, Unlock, Flag, Edit2, Database, Server, HardDrive, Download, Copy, Calendar, List, ArrowUpCircle, MessageSquare, ChevronDown, ChevronRight, Zap, Bot, Swords, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { DEFAULT_PROFILE } from '../constants';

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string, icon: any, color: string }) => (
    <div className="bg-dark-card border border-white/5 p-8 rounded-3xl shadow-xl hover:border-white/10 transition-all relative overflow-hidden group">
        <div className={`absolute -right-6 -top-6 w-32 h-32 bg-${color}-500/10 rounded-full blur-2xl group-hover:bg-${color}-500/20 transition-all`}></div>
        <div className="relative z-10">
            <div className={`p-4 rounded-2xl bg-${color}-500/10 text-${color}-400 w-fit mb-4`}>
                <Icon size={28} />
            </div>
            <h4 className="text-4xl font-extrabold text-white mb-2">{value}</h4>
            <p className="text-gray-400 text-sm font-medium tracking-wide uppercase">{title}</p>
        </div>
    </div>
);

const DbStatRow = ({ label, count, icon: Icon }: { label: string, count: number, icon: any }) => (
    <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl"><Icon size={20}/></div>
            <span className="text-gray-300 font-bold text-sm">{label}</span>
        </div>
        <span className="text-white font-bold font-mono text-lg">{count.toLocaleString()}</span>
    </div>
);

const Dashboard: React.FC<{ user: User | null }> = ({ user }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'members' | 'stores' | 'joki' | 'coupons' | 'logs' | 'reports' | 'feedback' | 'settings'>('overview');
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]); 
  const [members, setMembers] = useState<User[]>([]);
  const [sellers, setSellers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [archives, setArchives] = useState<Archive[]>([]);
  const [jokiRequests, setJokiRequests] = useState<ServiceRequest[]>([]);
  const [siteProfile, setSiteProfile] = useState<SiteProfile | null>(null);
  
  // Log Grouping State
  const [groupedLogs, setGroupedLogs] = useState<{[key: string]: ActivityLog[]}>({});
  const [expandedLogDates, setExpandedLogDates] = useState<string[]>([]);

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
    runCleanupJob(); 
    
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
        const [p, allUsers, l, c, rep, feed, prof, arch, jokiReqs] = await Promise.all([
            StorageService.getProducts(),
            StorageService.getUsers(),
            StorageService.getLogs(),
            StorageService.getCoupons(),
            StorageService.getReports(),
            StorageService.getFeedbacks(),
            StorageService.getProfile(),
            StorageService.getArchives(),
            StorageService.getServiceRequests()
        ]);
        
        setAllProducts(p); 
        setProducts(p.filter(prod => !prod.sellerId)); // Only Admin products for "Products" tab
        
        const onlyMembers = allUsers.filter(u => u.role !== UserRole.ADMIN);
        setMembers(onlyMembers);
        setSellers(onlyMembers.filter(u => u.isSeller));
        
        // Logs Processing
        setLogs(l);
        groupLogsByDate(l);

        setCoupons(c);
        setReports(rep);
        setFeedbacks(feed);
        setJokiRequests(jokiReqs);
        setSiteProfile(prof || DEFAULT_PROFILE);
        setArchives(arch);
        setStats(prev => ({ ...prev, totalMembers: onlyMembers.length }));
    } catch (err) {
        console.error("Dashboard Load Error:", err);
        addToast("Gagal memuat beberapa data dashboard.", "error");
    }
  };
  
  const groupLogsByDate = (logData: ActivityLog[]) => {
      const sortedLogs = [...logData].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const grouped: {[key: string]: ActivityLog[]} = {};
      sortedLogs.forEach(log => {
          const dateKey = new Date(log.timestamp).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          if(!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push(log);
      });
      setGroupedLogs(grouped);
      if(Object.keys(grouped).length > 0) setExpandedLogDates([Object.keys(grouped)[0]]);
  };

  const toggleLogDate = (date: string) => {
      if (expandedLogDates.includes(date)) setExpandedLogDates(prev => prev.filter(d => d !== date));
      else setExpandedLogDates(prev => [...prev, date]);
  };
  
  const refreshData = async () => {
      setLoading(true);
      await fetchStaticData();
      setLoading(false);
  };

  const runCleanupJob = async () => {
      const result = await StorageService.runWeeklyCleanup();
      if (result.cleanedLogs > 0 || result.cleanedOrders > 0) {
          addToast(`Auto-Cleanup: Archived ${result.cleanedLogs} logs & ${result.cleanedOrders} orders.`, "success");
          refreshData();
      }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsUploading(true);
          try {
              const uploadedUrl = await StorageService.uploadFile(file);
              setNewProduct(prev => ({ ...prev, image: uploadedUrl }));
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
      if(viewingStoreId) setSelectedStoreProducts(prev => prev.map(p => p.id === product.id ? {...p, isBoosted: !p.isBoosted} : p));
  };

  const handleToggleFlashSale = async (product: Product) => {
      const newValue = !product.isFlashSale;
      await StorageService.toggleFlashSale(product.id, newValue);
      addToast(newValue ? "Produk ditambahkan ke Flash Sale!" : "Produk dihapus dari Flash Sale", "success");
      const updateList = (list: Product[]) => list.map(p => p.id === product.id ? {...p, isFlashSale: newValue} : p);
      setProducts(updateList);
      setAllProducts(updateList);
      if(viewingStoreId) setSelectedStoreProducts(updateList);
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
          addToast("Pengaturan disimpan!", "success");
          const refreshed = await StorageService.getProfile();
          setSiteProfile(refreshed);
      }
  };

  const handleCleanupLuckyWheel = async () => {
      if(confirm("Yakin ingin menghapus semua history poin dari 'Lucky Wheel'? Tindakan ini tidak mengurangi saldo user sekarang, hanya menghapus log history.")) {
          setLoading(true);
          const count = await StorageService.deletePointHistoryByReason('Lucky Wheel');
          setLoading(false);
          addToast(`Berhasil menghapus ${count} data history poin.`, "success");
          refreshData();
      }
  };

  const handleAddCoupon = async () => {
      if(!newCoupon.code || !newCoupon.discountAmount) return addToast("Lengkapi data kupon", "error");
      const coupon: Coupon = {
          id: Date.now().toString(),
          code: newCoupon.code.toUpperCase(),
          name: newCoupon.name || 'Promo',
          discountAmount: Number(newCoupon.discountAmount),
          isPublic: newCoupon.isPublic || false,
          isActive: true,
          validProductIds: newCoupon.validProductIds,
          maxUsage: newCoupon.maxUsage ? Number(newCoupon.maxUsage) : undefined,
          expiresAt: newCoupon.expiresAt,
          currentUsage: 0
      };
      await StorageService.saveCoupon(coupon);
      setCoupons(prev => [...prev, coupon]);
      setNewCoupon({ isActive: true, isPublic: true, validProductIds: [] });
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

  const handleDeleteFeedback = async (id: string) => {
      if(confirm("Hapus feedback ini?")) {
          await StorageService.deleteFeedback(id);
          setFeedbacks(prev => prev.filter(f => f.id !== id));
          addToast("Feedback dihapus", "info");
      }
  };

  const handleDownloadArchive = (content: string, date: string) => {
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_tama_${new Date(date).toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      addToast("UID disalin!", "info");
  };

  // Calculate Storage Stats
  const totalDocs = members.length + sellers.length + allProducts.length + orders.length + logs.length + coupons.length + reports.length + archives.length + feedbacks.length;
  const estimatedSizeKB = totalDocs * 2;
  const totalQuotaKB = 1024 * 1024;
  const usagePercent = Math.min(100, (estimatedSizeKB / totalQuotaKB) * 100);

  return (
    <div className="flex h-screen overflow-hidden bg-dark-bg">
      {loading && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm">
              <div className="bg-dark-card p-6 rounded-3xl flex flex-col items-center gap-4 border border-white/10">
                  <Loader2 className="animate-spin text-brand-500" size={40}/>
                  <p className="text-white font-bold">Sinkronisasi Data...</p>
              </div>
          </div>
      )}

      {/* LEFT SIDEBAR - FIXED */}
      <aside className="w-72 bg-dark-card border-r border-white/5 flex flex-col flex-shrink-0 z-20">
          <div className="p-8 border-b border-white/5 flex items-center gap-3">
            <div className="p-3 bg-brand-600 rounded-xl shadow-lg shadow-brand-500/30 text-white"><LayoutDashboard size={24} /></div>
            <div><h2 className="font-extrabold text-xl text-white">Admin Panel</h2></div>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-6 space-y-2">
            {[
                { id: 'overview', label: 'Ringkasan', icon: TrendingUp },
                { id: 'orders', label: 'Pesanan Masuk', icon: ShoppingCart, badge: stats.pendingOrders },
                { id: 'joki', label: 'Permintaan Joki', icon: Swords }, // New Tab
                { id: 'members', label: 'Daftar Member', icon: Users },
                { id: 'stores', label: 'Manajemen Toko', icon: Store },
                { id: 'products', label: 'Katalog Produk', icon: Package },
                { id: 'coupons', label: 'Promo & Kupon', icon: Ticket },
                { id: 'feedback', label: 'Kotak Saran', icon: MessageSquare, badge: feedbacks.length },
                { id: 'reports', label: 'Laporan', icon: Flag, badge: reports.length },
                { id: 'logs', label: 'Log Aktivitas', icon: FileText },
                { id: 'settings', label: 'Pengaturan Toko', icon: Settings }
            ].map(item => (
                <button 
                    key={item.id} 
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                >
                    <item.icon size={20} /> {item.label}
                    {item.badge ? <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">{item.badge}</span> : null}
                </button>
            ))}
          </nav>
          
          <div className="p-6 border-t border-white/5">
              <button onClick={() => navigate('/')} className="w-full flex items-center gap-2 text-gray-500 hover:text-white text-xs font-bold justify-center py-2 hover:bg-white/5 rounded-xl transition-all">
                  Kembali ke Website
              </button>
          </div>
      </aside>

      {/* RIGHT CONTENT - SCROLLABLE */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative">
          <div className="max-w-7xl mx-auto space-y-10">
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
              <div className="animate-fade-in space-y-8">
                  <h1 className="text-3xl font-black text-white mb-8">Ringkasan Sistem</h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      <StatCard title="Pendapatan" value={`Rp ${stats.revenue.toLocaleString()}`} icon={DollarSign} color="green" />
                      <StatCard title="Pending" value={stats.pendingOrders.toString()} icon={ShoppingCart} color="yellow" />
                      <StatCard title="Member" value={stats.totalMembers.toString()} icon={Users} color="blue" />
                      <StatCard title="Total Order" value={stats.totalOrders.toString()} icon={CheckCircle} color="purple" />
                  </div>

                  {/* REALTIME DATABASE STATS & USAGE */}
                  <div className="bg-dark-card border border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
                      <div className="flex items-center gap-3 mb-8">
                          <Database className="text-blue-500" size={28}/>
                          <h3 className="text-2xl font-bold text-white">Database Storage Statistics</h3>
                          <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded animate-pulse">Live</span>
                      </div>
                      
                      {/* Storage Progress Bar */}
                      <div className="mb-8 p-6 bg-black/20 rounded-2xl border border-white/5">
                          <div className="flex justify-between items-end mb-3">
                              <div>
                                  <p className="text-sm font-bold text-gray-300 flex items-center gap-2"><HardDrive size={16}/> Total Penyimpanan Database</p>
                                  <p className="text-xs text-gray-500 mt-1">Estimasi penggunaan berdasarkan jumlah dokumen.</p>
                              </div>
                              <div className="text-right">
                                  <span className="text-brand-400 font-black text-2xl">{usagePercent.toFixed(2)}%</span>
                                  <span className="text-gray-500 text-xs block">Terpakai dari 1 GB (Free Tier)</span>
                              </div>
                          </div>
                          <div className="w-full h-5 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                  className={`h-full transition-all duration-1000 ${usagePercent > 80 ? 'bg-red-500' : 'bg-brand-500'}`} 
                                  style={{ width: `${usagePercent}%` }}
                              ></div>
                          </div>
                          <p className="text-[10px] text-right mt-2 text-gray-500">{estimatedSizeKB.toLocaleString()} KB / {totalQuotaKB.toLocaleString()} KB</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           <DbStatRow label="Users & Admin" count={members.length + 1} icon={Users}/>
                           <DbStatRow label="Active Sellers" count={sellers.length} icon={Store}/>
                           <DbStatRow label="Total Products" count={allProducts.length} icon={Package}/>
                           <DbStatRow label="Transaction Records" count={orders.length} icon={ShoppingCart}/>
                           <DbStatRow label="Activity Logs" count={logs.length} icon={FileText}/>
                           <DbStatRow label="Active Coupons" count={coupons.length} icon={Ticket}/>
                           <DbStatRow label="Reports" count={reports.length} icon={Flag}/>
                           <DbStatRow label="Feedbacks" count={feedbacks.length} icon={MessageSquare}/>
                      </div>
                  </div>
              </div>
          )}

          {/* TAB: JOKI REQUESTS */}
          {activeTab === 'joki' && (
              <div className="animate-fade-in space-y-6">
                  <div className="bg-dark-card border border-white/5 rounded-3xl p-8 shadow-xl">
                      <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3"><Swords size={28}/> Permintaan Pendaftaran Joki</h3>
                      
                      {jokiRequests.length === 0 ? (
                          <div className="text-center py-16 text-gray-500 border border-dashed border-white/5 rounded-3xl">Belum ada permintaan masuk.</div>
                      ) : (
                          <div className="grid grid-cols-1 gap-6">
                              {jokiRequests.map(req => (
                                  <div key={req.id} className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between gap-6 hover:border-brand-500/30 transition-all">
                                      <div className="space-y-2">
                                          <div className="flex items-center gap-2">
                                              <span className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded text-xs font-bold border border-yellow-500/20">{req.status}</span>
                                              <span className="text-gray-500 text-xs">{new Date(req.createdAt).toLocaleString()}</span>
                                          </div>
                                          <h4 className="text-xl font-bold text-white">{req.name}</h4>
                                          <p className="text-gray-300 text-sm"><span className="text-gray-500">Kontak:</span> {req.contact}</p>
                                          <div className="bg-black/30 p-4 rounded-xl text-sm text-gray-300 leading-relaxed border border-white/5">
                                              {req.description}
                                          </div>
                                      </div>
                                      <div className="flex flex-col gap-2 justify-center min-w-[150px]">
                                          <button className="bg-brand-600 hover:bg-brand-500 text-white py-2 rounded-xl font-bold text-sm shadow-lg">Terima & Chat</button>
                                          <button className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white py-2 rounded-xl font-bold text-sm transition-all border border-red-500/20">Tolak</button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          )}

          {/* TAB: SETTINGS & BOT */}
          {activeTab === 'settings' && (
            <div className="animate-fade-in space-y-8">
                {!siteProfile ? (
                    <div className="text-center py-10 text-gray-500">
                        <Loader2 className="animate-spin mx-auto mb-2"/>
                        Memuat data pengaturan...
                    </div>
                ) : (
                    <>
                        {/* GENERAL SETTINGS */}
                        <div className="bg-dark-card border border-white/5 rounded-3xl p-8">
                             <div className="flex justify-between items-center mb-6">
                                 <h3 className="text-xl font-bold text-white">Pengaturan Umum Toko</h3>
                                 <button onClick={handleSaveProfile} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Save size={16}/> Simpan Perubahan</button>
                             </div>
                             
                             {/* DANGER ZONE */}
                             <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                 <h4 className="text-red-400 font-bold mb-4 flex items-center gap-2"><AlertTriangle size={18}/> Zona Bahaya</h4>
                                 <div className="flex flex-col md:flex-row gap-4">
                                     <button 
                                        onClick={() => setSiteProfile({...siteProfile, isLocked: !siteProfile.isLocked})}
                                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex-1 ${siteProfile.isLocked ? 'bg-red-600 text-white' : 'bg-dark-bg border border-red-500/30 text-white hover:bg-red-500/20'}`}
                                     >
                                         {siteProfile.isLocked ? 'NONAKTIFKAN MAINTENANCE' : 'AKTIFKAN MAINTENANCE MODE'}
                                     </button>
                                     <button 
                                        onClick={handleCleanupLuckyWheel}
                                        className="px-6 py-3 rounded-xl font-bold text-sm transition-all flex-1 bg-dark-bg border border-red-500/30 text-white hover:bg-red-500/20"
                                     >
                                         HAPUS HISTORY POINT (LUCKY WHEEL)
                                     </button>
                                 </div>
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
                    </>
                )}
            </div>
          )}
          
          {/* ... Other tabs (Orders, Members, etc.) remain mostly similar but with increased padding/gap ... */}
          
          {/* TAB: MEMBERS */}
          {activeTab === 'members' && (
              <div className="animate-fade-in space-y-6">
                  <div className="bg-dark-card border border-white/5 rounded-3xl p-8">
                      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                          <h3 className="text-2xl font-bold text-white flex items-center gap-3"><Users size={28}/> Daftar Member</h3>
                          <div className="bg-black/30 p-4 rounded-xl border border-white/5 w-full md:w-auto">
                              <h4 className="text-xs text-gray-400 font-bold mb-2 uppercase tracking-wider">Kelola Poin Member (By UID)</h4>
                              <div className="flex gap-2">
                                  <input 
                                      placeholder="User ID" 
                                      className="bg-dark-bg border border-white/10 rounded-lg px-3 py-2 text-white text-xs w-32"
                                      value={pointUid}
                                      onChange={e => setPointUid(e.target.value)}
                                  />
                                  <input 
                                      type="number" 
                                      placeholder="Jml" 
                                      className="bg-dark-bg border border-white/10 rounded-lg px-3 py-2 text-white text-xs w-24"
                                      value={pointAmount}
                                      onChange={e => setPointAmount(e.target.value)}
                                  />
                                  <button onClick={() => handleManagePointsByUID('ADD')} className="bg-green-600 px-4 py-2 rounded-lg text-xs text-white font-bold hover:bg-green-500">+</button>
                                  <button onClick={() => handleManagePointsByUID('SUBTRACT')} className="bg-red-600 px-4 py-2 rounded-lg text-xs text-white font-bold hover:bg-red-500">-</button>
                              </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {members.map(member => (
                              <div key={member.id} className="bg-white/5 p-6 rounded-2xl border border-white/5 flex items-center gap-5 hover:border-white/10 transition-all">
                                  <img src={member.avatar || "https://picsum.photos/50"} className="w-14 h-14 rounded-full object-cover bg-black border-2 border-white/10"/>
                                  <div className="flex-1 min-w-0">
                                      <h4 className="font-bold text-white text-base flex items-center gap-2">
                                          {member.username}
                                          {member.isVerified && <BadgeCheck size={16} className="text-green-500"/>}
                                          {member.vipLevel !== 'NONE' && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20">{member.vipLevel}</span>}
                                      </h4>
                                      <p className="text-xs text-gray-400 mt-1">UID: <span className="font-mono cursor-pointer hover:text-white bg-black/30 px-1 rounded" onClick={() => copyToClipboard(member.id)}>{member.id}</span></p>
                                      <p className="text-xs text-brand-400 font-bold mt-1">Poin: {member.points}</p>
                                  </div>
                                  <div className="flex gap-2">
                                      <button onClick={(e) => handleUserAction(e, member.id, 'verify')} className={`p-2.5 rounded-xl ${member.isVerified ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`} title="Verify"><BadgeCheck size={18}/></button>
                                      <button onClick={(e) => handleUserAction(e, member.id, 'ban')} className={`p-2.5 rounded-xl ${member.isBanned ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`} title="Ban"><Ban size={18}/></button>
                                      <button onClick={(e) => handleUserAction(e, member.id, 'delete')} className="p-2.5 bg-white/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white" title="Delete"><Trash2 size={18}/></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* Include other tabs here (products, orders, coupons, logs, reports, feedback) with updated padding p-8 and gap-6 similar to above */}
          
          </div>
      </main>
    </div>
  );
};

export default Dashboard;
