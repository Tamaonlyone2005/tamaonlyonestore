import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Product, User, UserRole, Order, ActivityLog, OrderStatus, Coupon, ProductType, SiteProfile, StoreStatus, Report, Archive, Feedback, ServiceRequest } from '../types';
import { Plus, Trash2, Save, Package, LayoutDashboard, CheckCircle, Ban, Image as ImageIcon, Coins, ShoppingCart, FileText, BadgeCheck, Ticket, TrendingUp, Users, DollarSign, Loader2, Search, X, Settings, Upload, Store, Lock, Unlock, Flag, Edit2, Database, Server, HardDrive, Download, Copy, Calendar, List, ArrowUpCircle, MessageSquare, ChevronDown, ChevronRight, Zap, Bot, Swords, AlertTriangle, Key, Clock, Moon, Sparkles, Crown } from 'lucide-react';
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

// Countdown Helper Component
const CountdownTimer = ({ targetDate, label, icon: Icon, colorClass }: { targetDate: Date, label: string, icon: any, colorClass: string }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const calculate = () => {
            const diff = targetDate.getTime() - new Date().getTime();
            if (diff > 0) {
                setTimeLeft({
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((diff % (1000 * 60)) / 1000),
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        };
        calculate();
        const interval = setInterval(calculate, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    return (
        <div className={`p-6 rounded-2xl border bg-black/20 ${colorClass} flex flex-col items-center justify-center text-center`}>
            <div className="mb-3 p-3 rounded-full bg-white/5">
                <Icon size={24} className="fill-current" />
            </div>
            <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">{label}</h4>
            <div className="text-2xl font-black font-mono text-white flex gap-2">
                <span>{timeLeft.days}d</span>:
                <span>{timeLeft.hours.toString().padStart(2,'0')}h</span>:
                <span>{timeLeft.minutes.toString().padStart(2,'0')}m</span>:
                <span>{timeLeft.seconds.toString().padStart(2,'0')}s</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-2">{targetDate.toLocaleDateString()}</p>
        </div>
    );
};

const Dashboard: React.FC<{ user: User | null }> = ({ user }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'members' | 'stores' | 'coupons' | 'logs' | 'reports' | 'feedback' | 'settings'>('overview');
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
  const [siteProfile, setSiteProfile] = useState<SiteProfile | null>(null);
  
  // Log Grouping State
  const [groupedLogs, setGroupedLogs] = useState<{[key: string]: ActivityLog[]}>({});
  const [expandedLogDates, setExpandedLogDates] = useState<string[]>([]);

  // Form States
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ type: 'ITEM' });
  const [editingProductId, setEditingProductId] = useState<string | null>(null); // Track if editing
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false); // New state for logo upload
  
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
        const [p, allUsers, l, c, rep, feed, prof, arch] = await Promise.all([
            StorageService.getProducts(),
            StorageService.getUsers(),
            StorageService.getLogs(),
            StorageService.getCoupons(),
            StorageService.getReports(),
            StorageService.getFeedbacks(),
            StorageService.getProfile(),
            StorageService.getArchives()
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && siteProfile) {
          setIsUploadingLogo(true);
          try {
              const uploadedUrl = await StorageService.uploadFile(file);
              setSiteProfile(prev => prev ? ({ ...prev, avatar: uploadedUrl }) : null);
              addToast("Logo berhasil diupload! Klik 'Simpan Perubahan' untuk menerapkan.", "success");
          } catch (error) {
              addToast("Gagal upload logo.", "error");
          } finally {
              setIsUploadingLogo(false);
          }
      }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price) return addToast("Nama dan Harga wajib diisi", "error");
    const product: Product = {
      id: editingProductId ? editingProductId : Date.now().toString(),
      name: newProduct.name!,
      price: Number(newProduct.price),
      category: newProduct.category || 'General',
      description: newProduct.description || '',
      stock: 999,
      image: newProduct.image,
      type: newProduct.type || 'ITEM',
      // Maintain flags if editing
      isFlashSale: editingProductId ? products.find(p=>p.id===editingProductId)?.isFlashSale : false,
      isBoosted: editingProductId ? products.find(p=>p.id===editingProductId)?.isBoosted : false
    };
    
    await StorageService.saveProduct(product);
    
    setNewProduct({ type: 'ITEM' });
    setEditingProductId(null);
    addToast(editingProductId ? "Produk berhasil diupdate!" : "Produk berhasil ditambahkan!", "success");
    refreshData();
  };

  const handleEditProduct = (product: Product) => {
      setNewProduct(product);
      setEditingProductId(product.id);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
  };

  const handleCancelEdit = () => {
      setNewProduct({ type: 'ITEM' });
      setEditingProductId(null);
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
          // Reload page to reflect layout changes
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
  
  // Calculate Image Count (Approximation based on non-default strings)
  const imageCount = allProducts.filter(p => p.image && !p.image.includes('picsum')).length + members.filter(u => u.avatar && !u.avatar.includes('picsum')).length;

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
                           <DbStatRow label="Uploaded Media" count={imageCount} icon={ImageIcon}/>
                           <DbStatRow label="Activity Logs" count={logs.length} icon={FileText}/>
                           <DbStatRow label="Active Coupons" count={coupons.length} icon={Ticket}/>
                           <DbStatRow label="Reports" count={reports.length} icon={Flag}/>
                           <DbStatRow label="Feedbacks" count={feedbacks.length} icon={MessageSquare}/>
                      </div>
                  </div>
              </div>
          )}

          {/* TAB: ORDERS - RESTORED */}
          {activeTab === 'orders' && (
              <div className="animate-fade-in space-y-6">
                  <h1 className="text-2xl font-bold text-white mb-6">Manajemen Pesanan</h1>
                  {orders.length === 0 ? (
                      <div className="text-center py-20 text-gray-500 bg-dark-card rounded-3xl border border-white/5">
                          Belum ada pesanan masuk.
                      </div>
                  ) : (
                      <div className="bg-dark-card border border-white/5 rounded-3xl overflow-hidden">
                          <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                  <thead className="bg-white/5 border-b border-white/5">
                                      <tr>
                                          <th className="p-4 text-xs font-bold text-gray-400 uppercase">ID</th>
                                          <th className="p-4 text-xs font-bold text-gray-400 uppercase">User</th>
                                          <th className="p-4 text-xs font-bold text-gray-400 uppercase">Produk</th>
                                          <th className="p-4 text-xs font-bold text-gray-400 uppercase">Harga</th>
                                          <th className="p-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                                          <th className="p-4 text-xs font-bold text-gray-400 uppercase">Bukti</th>
                                          <th className="p-4 text-xs font-bold text-gray-400 uppercase">Aksi</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5">
                                      {orders.map(order => (
                                          <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                              <td className="p-4 text-xs font-mono text-gray-500">#{order.id.slice(-6)}</td>
                                              <td className="p-4">
                                                  <div className="font-bold text-white text-sm">{order.username}</div>
                                                  <div className="text-[10px] text-gray-500">{order.whatsapp}</div>
                                              </td>
                                              <td className="p-4">
                                                  <div className="text-white text-sm font-bold">{order.productName}</div>
                                                  <div className="text-[10px] text-gray-500">{order.gameData ? Object.values(order.gameData).join(', ') : '-'}</div>
                                              </td>
                                              <td className="p-4 text-brand-400 font-bold text-sm">Rp {order.price.toLocaleString()}</td>
                                              <td className="p-4">
                                                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                                      order.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' :
                                                      order.status === 'PROCESSED' ? 'bg-blue-500/20 text-blue-500' :
                                                      order.status === 'COMPLETED' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                                                  }`}>{order.status}</span>
                                              </td>
                                              <td className="p-4">
                                                  {order.paymentProof ? (
                                                      <a href={order.paymentProof} target="_blank" className="text-blue-400 text-xs hover:underline flex items-center gap-1"><ImageIcon size={12}/> Lihat</a>
                                                  ) : <span className="text-gray-600 text-xs">-</span>}
                                              </td>
                                              <td className="p-4">
                                                  <select 
                                                      className="bg-black/30 border border-white/10 rounded text-xs text-white p-1 outline-none"
                                                      value={order.status}
                                                      onChange={(e) => handleOrderStatus(order.id, e.target.value as OrderStatus)}
                                                  >
                                                      <option value="PENDING">PENDING</option>
                                                      <option value="PROCESSED">PROCESSED</option>
                                                      <option value="COMPLETED">COMPLETED</option>
                                                      <option value="CANCELLED">CANCELLED</option>
                                                  </select>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  )}
              </div>
          )}

          {/* TAB: MEMBERS - RESTORED */}
          {activeTab === 'members' && (
              <div className="animate-fade-in space-y-6">
                  <div className="flex justify-between items-center mb-6">
                      <h1 className="text-2xl font-bold text-white">Daftar Member ({members.length})</h1>
                      <div className="flex gap-2">
                          <input 
                              placeholder="Cari member (UID/Username)" 
                              className="bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-brand-500"
                              onChange={(e) => {
                                  // Simple local filter logic could go here, or handled via state
                              }}
                          />
                      </div>
                  </div>

                  {/* Manual Points Tool */}
                  <div className="bg-dark-card border border-white/5 rounded-2xl p-6 mb-8 flex flex-col md:flex-row gap-4 items-center">
                      <h3 className="font-bold text-white whitespace-nowrap mr-4"><Coins className="inline mr-2 text-yellow-500"/> Kelola Poin Manual</h3>
                      <input placeholder="UID Member" className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white text-sm flex-1 w-full" value={pointUid} onChange={e=>setPointUid(e.target.value)}/>
                      <input type="number" placeholder="Jumlah Poin" className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white text-sm w-32" value={pointAmount} onChange={e=>setPointAmount(e.target.value)}/>
                      <div className="flex gap-2">
                          <button onClick={() => handleManagePointsByUID('ADD')} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold">Tambah</button>
                          <button onClick={() => handleManagePointsByUID('SUBTRACT')} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold">Kurang</button>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {members.map(member => (
                          <div key={member.id} className="bg-dark-card border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-brand-500/30 transition-all">
                              <img src={member.avatar || "https://picsum.photos/50"} className="w-12 h-12 rounded-full object-cover bg-white/5"/>
                              <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-white text-sm truncate">{member.username}</h4>
                                      {member.isVip && <Crown size={12} className="text-yellow-500 fill-current"/>}
                                  </div>
                                  <p className="text-xs text-gray-500 font-mono" onClick={() => copyToClipboard(member.id)} title="Klik untuk salin UID">UID: {member.id}</p>
                                  <div className="flex gap-2 mt-1">
                                      <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-1.5 rounded">{member.points} Poin</span>
                                      <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 rounded">{member.totalOrders} Order</span>
                                  </div>
                              </div>
                              <div className="flex gap-1">
                                  <button onClick={(e) => handleUserAction(e, member.id, 'verify')} className={`p-2 rounded-lg transition-colors ${member.isVerified ? 'text-green-500 bg-green-500/10' : 'text-gray-500 bg-white/5 hover:bg-white/10'}`} title="Toggle Verified">
                                      <BadgeCheck size={16}/>
                                  </button>
                                  <button onClick={(e) => handleUserAction(e, member.id, 'ban')} className={`p-2 rounded-lg transition-colors ${member.isBanned ? 'text-red-500 bg-red-500/10' : 'text-gray-500 bg-white/5 hover:bg-white/10'}`} title="Ban/Unban">
                                      <Ban size={16}/>
                                  </button>
                                  <button onClick={(e) => handleUserAction(e, member.id, 'delete')} className="p-2 text-gray-500 hover:text-red-500 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete User">
                                      <Trash2 size={16}/>
                                  </button>
                              </div>
                          </div>
                      ))}
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
                        {/* SCHEDULE & THEME COUNTDOWN CARD */}
                        <div className="bg-dark-card border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="flex items-center gap-3 mb-6">
                                <Clock className="text-brand-400" size={24}/>
                                <h3 className="text-xl font-bold text-white">Schedule System</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CountdownTimer 
                                    targetDate={new Date('2026-02-01T00:00:00')} 
                                    label="Auto Switch to Ramadan Theme" 
                                    icon={Sparkles} 
                                    colorClass="border-cyan-500/30 text-cyan-400"
                                />
                                <CountdownTimer 
                                    targetDate={new Date('2026-02-18T00:00:00')} 
                                    label="Ramadan 1447H Begins" 
                                    icon={Moon} 
                                    colorClass="border-green-500/30 text-green-400"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-4 text-center">
                                *Sistem akan otomatis merubah tema visual website dari "Midnight Aurora" ke "Ramadhan" pada tanggal 1 Februari 2026.
                            </p>
                        </div>

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
                                 </div>
                             </div>

                             <div className="grid grid-cols-1 gap-6 mb-8">
                                 <div>
                                     <label className="block text-sm text-gray-400 mb-2">Logo Toko (Navbar)</label>
                                     <div className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                                         {siteProfile.avatar ? (
                                             <img src={siteProfile.avatar} alt="Logo" className="w-16 h-16 rounded-xl object-cover bg-white/5"/>
                                         ) : (
                                             <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
                                                 <ImageIcon size={24}/>
                                             </div>
                                         )}
                                         <div className="flex-1">
                                             <p className="text-xs text-gray-500 mb-2">Upload logo baru untuk mengganti icon "T" default di navbar. Format: JPG/PNG, Max 500KB.</p>
                                             <label className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold cursor-pointer transition-all">
                                                 {isUploadingLogo ? <Loader2 size={16} className="animate-spin"/> : <Upload size={16}/>}
                                                 {isUploadingLogo ? 'Uploading...' : 'Upload Logo Baru'}
                                                 <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploadingLogo}/>
                                             </label>
                                         </div>
                                     </div>
                                 </div>
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
          
          {/* ... (Existing code for products, stores, coupons, feedback, reports, logs) ... */}
          {/* TAB: PRODUCTS */}
          {activeTab === 'products' && (
              <div className="animate-fade-in flex flex-col xl:flex-row gap-8">
                  {/* FORM INPUT PRODUCT */}
                  <div className="xl:w-1/3 xl:order-2">
                      <div className="bg-dark-card border border-white/5 rounded-3xl p-6 sticky top-4 shadow-xl">
                          <h3 className="text-xl font-bold text-white mb-4">
                              {editingProductId ? 'Edit Produk' : 'Input Produk Official'}
                          </h3>
                          <div className="space-y-4">
                              <input placeholder="Nama Produk" className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={newProduct.name || ''} onChange={e => setNewProduct({...newProduct, name: e.target.value})}/>
                              <div className="grid grid-cols-2 gap-4">
                                  <input placeholder="Harga (Rp)" type="number" className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}/>
                                  <select className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white focus:border-brand-500 outline-none" value={newProduct.type} onChange={e => setNewProduct({...newProduct, type: e.target.value as ProductType})}>
                                      <option value="ITEM">Digital Item</option>
                                      <option value="SKIN">Gift Skin</option>
                                      <option value="JOKI">Jasa Joki</option>
                                      <option value="REKBER">Rekber</option>
                                      <option value="VOUCHER">Voucher</option>
                                      <option value="OTHER">Lainnya</option>
                                  </select>
                              </div>
                              <div className="relative group">
                                  <input type="file" onChange={handleProductImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
                                  <div className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white flex items-center gap-3">
                                      <Upload size={18} className="text-gray-400"/>
                                      <span className="text-sm text-gray-400 truncate">{newProduct.image ? 'Gambar Terupload (Ganti?)' : 'Upload Gambar'}</span>
                                  </div>
                                  {isUploading && <Loader2 className="animate-spin absolute right-4 top-3 text-white"/>}
                              </div>
                              <textarea placeholder="Deskripsi Produk" className="w-full bg-dark-bg border border-white/10 rounded-xl p-3 text-white h-24 focus:border-brand-500 outline-none" value={newProduct.description || ''} onChange={e => setNewProduct({...newProduct, description: e.target.value})}/>
                              
                              <div className="flex gap-2">
                                  {editingProductId && (
                                      <button onClick={handleCancelEdit} className="bg-white/10 text-white font-bold py-3 px-4 rounded-xl">
                                          Batal
                                      </button>
                                  )}
                                  <button onClick={handleAddProduct} className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2">
                                      <Plus className="inline mr-2"/>
                                      {editingProductId ? 'Update Produk' : 'Simpan Produk'}
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
                  
                  {/* PRODUCT LIST */}
                  <div className="flex-1 xl:order-1">
                      <div className="bg-dark-card border border-white/5 rounded-3xl p-6">
                          <h3 className="text-xl font-bold text-white mb-6">List Produk Official</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {products.map(p => (
                                  <div key={p.id} className="bg-dark-bg/50 border border-white/5 p-4 rounded-2xl flex items-center gap-4 group hover:border-brand-500/30 transition-all">
                                      <img src={p.image || "https://picsum.photos/100"} className="w-16 h-16 rounded-xl object-cover"/>
                                      <div className="flex-1 min-w-0">
                                          <h4 className="text-white font-bold text-sm truncate">{p.name}</h4>
                                          <p className="text-brand-400 font-bold text-xs">Rp {p.price.toLocaleString()}</p>
                                          {p.isFlashSale && <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">FLASH SALE</span>}
                                      </div>
                                      <div className="flex flex-col gap-1">
                                          <div className="flex gap-1">
                                              <button onClick={() => handleEditProduct(p)} className="p-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all rounded-lg" title="Edit">
                                                  <Edit2 size={14}/>
                                              </button>
                                              <button onClick={(e) => handleDeleteProduct(e, p.id)} className="p-1.5 bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 transition-all rounded-lg z-10"><Trash2 size={14}/></button>
                                          </div>
                                          <button onClick={() => handleToggleFlashSale(p)} className={`p-1.5 rounded-lg ${p.isFlashSale ? 'bg-yellow-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-yellow-500 hover:text-black'}`} title="Toggle Flash Sale">
                                              <Zap size={14}/>
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* TAB: STORES */}
          {activeTab === 'stores' && (
              <div className="animate-fade-in space-y-6">
                  <div className="bg-dark-card border border-white/5 rounded-3xl p-6">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-white flex items-center gap-2"><Store size={24}/> Manajemen Toko Seller</h3>
                          
                          {/* Manual Level Tool */}
                          <div className="flex gap-2 bg-black/30 p-2 rounded-xl border border-white/5">
                              <select className="bg-dark-bg border border-white/10 rounded px-2 py-1 text-white text-xs w-32" onChange={e => setManualExpId(e.target.value)} value={manualExpId || ''}>
                                  <option value="">Pilih Seller...</option>
                                  {sellers.map(s => <option key={s.id} value={s.id}>{s.storeName}</option>)}
                              </select>
                              <input type="number" placeholder="EXP" className="bg-dark-bg border border-white/10 rounded px-2 py-1 text-white text-xs w-16" value={manualExpVal} onChange={e=>setManualExpVal(e.target.value)}/>
                              <input type="number" placeholder="LVL" className="bg-dark-bg border border-white/10 rounded px-2 py-1 text-white text-xs w-12" value={manualLevelVal} onChange={e=>setManualLevelVal(e.target.value)}/>
                              <button onClick={handleUpdateStoreLevel} className="bg-brand-600 px-3 py-1 rounded text-xs text-white font-bold">Set</button>
                          </div>
                      </div>

                      <div className="space-y-4">
                          {sellers.length === 0 ? <p className="text-gray-500 text-center py-8">Belum ada seller terdaftar.</p> : null}
                          {sellers.map(seller => (
                              <div key={seller.id} className="bg-white/5 p-4 rounded-xl border border-white/5">
                                  <div className="flex justify-between items-start mb-4">
                                      <div className="flex items-center gap-3">
                                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center font-bold text-white text-xl">
                                              {seller.storeName?.charAt(0)}
                                          </div>
                                          <div>
                                              <h4 className="font-bold text-white flex items-center gap-2">
                                                  {seller.storeName}
                                                  <span className={`px-2 py-0.5 rounded text-[10px] ${seller.storeStatus === 'ACTIVE' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>{seller.storeStatus}</span>
                                              </h4>
                                              <p className="text-xs text-gray-400">Owner: {seller.username} (Lvl {seller.storeLevel})</p>
                                          </div>
                                      </div>
                                      <div className="flex gap-2">
                                          <button onClick={() => handleViewStoreProducts(seller.id)} className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded text-xs font-bold hover:bg-blue-600 hover:text-white transition-all">Lihat Produk</button>
                                          {seller.storeStatus === 'PENDING' && <button onClick={() => handleStoreAction(seller.id, 'VERIFY')} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold">Terima</button>}
                                          {seller.storeStatus === 'ACTIVE' && <button onClick={() => handleStoreAction(seller.id, 'SUSPEND')} className="bg-yellow-600 text-white px-3 py-1 rounded text-xs font-bold">Suspend</button>}
                                          <button onClick={() => handleStoreAction(seller.id, 'DELETE')} className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold">Hapus</button>
                                      </div>
                                  </div>
                                  
                                  {viewingStoreId === seller.id && (
                                      <div className="mt-4 pt-4 border-t border-white/5 animate-slide-up">
                                          <h5 className="font-bold text-white text-sm mb-2">Produk Toko ({selectedStoreProducts.length})</h5>
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                              {selectedStoreProducts.map(p => (
                                                  <div key={p.id} className="bg-black/30 p-2 rounded-lg border border-white/5 relative group">
                                                      <img src={p.image} className="w-full h-24 object-cover rounded mb-2 opacity-70 group-hover:opacity-100"/>
                                                      <p className="text-white text-xs font-bold truncate">{p.name}</p>
                                                      <p className="text-brand-400 text-xs">Rp {p.price.toLocaleString()}</p>
                                                      <button onClick={() => handleToggleBoost(p)} className={`absolute top-2 right-2 p-1 rounded ${p.isBoosted ? 'bg-yellow-500 text-black' : 'bg-black/50 text-gray-400'}`} title="Boost"><Zap size={12}/></button>
                                                      <button onClick={() => handleToggleFlashSale(p)} className={`absolute top-8 right-2 p-1 rounded ${p.isFlashSale ? 'bg-red-500 text-white' : 'bg-black/50 text-gray-400'}`} title="Flash Sale"><TrendingUp size={12}/></button>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* TAB: COUPONS */}
          {activeTab === 'coupons' && (
              <div className="animate-fade-in space-y-6">
                  <div className="bg-dark-card border border-white/5 rounded-3xl p-6">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-white flex items-center gap-2"><Ticket size={24}/> Promo & Kupon</h3>
                      </div>
                      
                      {/* Create Coupon Form */}
                      <div className="bg-black/20 p-4 rounded-2xl border border-white/5 mb-8">
                          <h4 className="text-sm font-bold text-gray-300 mb-4">Buat Kupon Baru</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <input placeholder="Kode Kupon (ex: RAMADHAN)" className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white" value={newCoupon.code || ''} onChange={e=>setNewCoupon({...newCoupon, code:e.target.value.toUpperCase()})}/>
                              <input placeholder="Nama Promo" className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white" value={newCoupon.name || ''} onChange={e=>setNewCoupon({...newCoupon, name:e.target.value})}/>
                              <input type="number" placeholder="Nominal Diskon (Rp)" className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white" value={newCoupon.discountAmount || ''} onChange={e=>setNewCoupon({...newCoupon, discountAmount:Number(e.target.value)})}/>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <input type="number" placeholder="Max Usage" className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white" value={newCoupon.maxUsage || ''} onChange={e=>setNewCoupon({...newCoupon, maxUsage:Number(e.target.value)})}/>
                              <input type="date" className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white" value={newCoupon.expiresAt || ''} onChange={e=>setNewCoupon({...newCoupon, expiresAt:e.target.value})}/>
                              <div className="flex items-center gap-2 bg-dark-bg border border-white/10 rounded-xl px-3">
                                  <input type="checkbox" checked={newCoupon.isPublic} onChange={e=>setNewCoupon({...newCoupon, isPublic:e.target.checked})}/>
                                  <span className="text-sm text-gray-300">Publik?</span>
                              </div>
                              <button onClick={handleAddCoupon} className="bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl shadow-lg">Buat Kupon</button>
                          </div>
                      </div>

                      {/* Coupon List */}
                      <div className="space-y-4">
                          {coupons.length === 0 ? <p className="text-gray-500 text-center py-8">Belum ada kupon.</p> : null}
                          {coupons.map(coupon => (
                              <div key={coupon.id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                                  <div>
                                      <div className="flex items-center gap-2">
                                          <span className="text-xl font-black text-white">{coupon.code}</span>
                                          <span className={`text-[10px] px-2 py-0.5 rounded ${coupon.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{coupon.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                                          {coupon.isPublic && <span className="text-[10px] bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded">PUBLIC</span>}
                                      </div>
                                      <p className="text-sm text-gray-400">{coupon.name} • Potongan Rp {coupon.discountAmount.toLocaleString()}</p>
                                      <p className="text-xs text-gray-500">Terpakai: {coupon.currentUsage || 0} / {coupon.maxUsage || '∞'} • Exp: {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Selamanya'}</p>
                                  </div>
                                  <button onClick={() => handleDeleteCoupon(coupon.id)} className="p-2 bg-white/10 hover:bg-red-500 text-gray-400 hover:text-white rounded-lg transition-colors"><Trash2 size={18}/></button>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* TAB: FEEDBACK */}
          {activeTab === 'feedback' && (
              <div className="animate-fade-in space-y-4">
                  <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2"><MessageSquare size={24} className="text-brand-400"/> Kotak Saran & Kritik ({feedbacks.length})</h3>
                  {feedbacks.length === 0 ? (
                      <div className="text-center p-12 bg-dark-card rounded-2xl border border-white/5 text-gray-500">
                          <p>Belum ada masukan dari publik.</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {feedbacks.map(f => (
                              <div key={f.id} className="bg-dark-card border border-white/5 p-6 rounded-2xl relative group hover:border-brand-500/30 transition-all">
                                  <div className="flex justify-between items-start mb-3">
                                      <div>
                                          <h4 className="text-white font-bold">{f.name}</h4>
                                          <p className="text-xs text-gray-500">{new Date(f.createdAt).toLocaleString()}</p>
                                      </div>
                                      <button onClick={() => handleDeleteFeedback(f.id)} className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                          <Trash2 size={16}/>
                                      </button>
                                  </div>
                                  <div className="bg-white/5 p-4 rounded-xl text-gray-300 text-sm leading-relaxed border border-white/5">
                                      "{f.message}"
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}

          {/* TAB: REPORTS */}
          {activeTab === 'reports' && (
              <div className="animate-fade-in space-y-6">
                  <div className="bg-dark-card border border-white/5 rounded-3xl overflow-hidden">
                      <div className="p-6 border-b border-white/5 flex justify-between items-center">
                          <h3 className="text-white font-bold flex items-center gap-2"><Flag size={20} className="text-red-500"/> Laporan Masuk ({reports.length})</h3>
                      </div>
                      <div className="p-4">
                          {reports.length === 0 ? (
                              <div className="text-center py-12 text-gray-500">Tidak ada laporan.</div>
                          ) : (
                              <div className="space-y-4">
                                  {reports.map(rep => (
                                      <div key={rep.id} className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col md:flex-row gap-4 justify-between items-start">
                                          <div>
                                              <div className="flex items-center gap-2 mb-2">
                                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                      rep.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'
                                                  }`}>{rep.status}</span>
                                                  <span className="text-xs text-gray-400">{new Date(rep.createdAt).toLocaleString()}</span>
                                              </div>
                                              <h4 className="text-white font-bold text-sm">Target: {rep.targetId} ({rep.targetType})</h4>
                                              <p className="text-gray-400 text-xs">Alasan: {rep.reason}</p>
                                              <p className="text-gray-300 text-sm mt-2 p-2 bg-black/20 rounded">"{rep.description}"</p>
                                          </div>
                                          <button onClick={() => handleDeleteReport(rep.id)} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all self-end md:self-start">
                                              Hapus Laporan
                                          </button>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          )}

          {/* TAB: LOGS */}
          {activeTab === 'logs' && (
              <div className="animate-fade-in space-y-6">
                  <div className="bg-dark-card border border-white/5 rounded-3xl overflow-hidden p-6">
                      <h3 className="text-white font-bold flex items-center gap-2 mb-6"><FileText size={20} className="text-brand-400"/> Log Aktivitas Harian</h3>
                      
                      {Object.keys(groupedLogs).length === 0 ? (
                          <div className="text-center py-12 text-gray-500">Belum ada aktivitas tercatat.</div>
                      ) : (
                          <div className="space-y-4">
                              {Object.entries(groupedLogs).map(([date, uncastedLogs]) => {
                                  const dayLogs = uncastedLogs as ActivityLog[];
                                  return (
                                  <div key={date} className="border border-white/5 rounded-xl overflow-hidden">
                                      {/* Header Date Group */}
                                      <button 
                                          onClick={() => toggleLogDate(date)}
                                          className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
                                      >
                                          <div className="flex items-center gap-3">
                                              <Calendar size={18} className="text-brand-400"/>
                                              <span className="text-white font-bold text-sm">{date}</span>
                                              <span className="bg-black/30 px-2 py-0.5 rounded text-[10px] text-gray-400">{dayLogs.length} Aktivitas</span>
                                          </div>
                                          {expandedLogDates.includes(date) ? <ChevronDown size={18} className="text-gray-400"/> : <ChevronRight size={18} className="text-gray-400"/>}
                                      </button>

                                      {/* Log Items */}
                                      {expandedLogDates.includes(date) && (
                                          <div className="bg-black/20 divide-y divide-white/5">
                                              {dayLogs.map(log => (
                                                  <div key={log.id} className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-white/5 transition-colors">
                                                      <div className="flex items-center gap-3">
                                                          <div className="text-[10px] text-gray-500 font-mono min-w-[60px]">
                                                              {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                          </div>
                                                          <div>
                                                              <div className="flex items-center gap-2">
                                                                  <span className="text-brand-400 font-bold text-xs">{log.username}</span>
                                                                  <span className="text-[10px] bg-white/10 px-1.5 rounded text-gray-400 uppercase">{log.action}</span>
                                                              </div>
                                                              <p className="text-gray-300 text-xs mt-0.5">{log.details}</p>
                                                          </div>
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                              )})}
                          </div>
                      )}
                  </div>
              </div>
          )}
          
          </div>
      </main>
    </div>
  );
};

export default Dashboard;