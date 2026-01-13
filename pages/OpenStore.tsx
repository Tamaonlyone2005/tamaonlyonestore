
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { User, Product, ProductType, StoreStatus, UserRole, STORE_LEVELS, Order, OrderStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import { Store, Loader2, CheckCircle, Package, ArrowRight, Plus, Upload, Trash2, AlertTriangle, Zap, ShoppingCart, DollarSign, TrendingUp, Clock, FileText } from 'lucide-react';
import { useToast } from '../components/Toast';

const OpenStore: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'stats'>('products');
    
    // Seller Data State
    const [myProducts, setMyProducts] = useState<Product[]>([]);
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState({ revenue: 0, pending: 0, completed: 0 });
    
    // Form State (Register)
    const [storeName, setStoreName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [agreedToRules, setAgreedToRules] = useState(false);

    // Form State (Add Product)
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [newProduct, setNewProduct] = useState<Partial<Product>>({ type: 'ITEM' });
    const [isUploading, setIsUploading] = useState(false);
    
    // Rules Modal State
    const [showRulesModal, setShowRulesModal] = useState(false);

    useEffect(() => {
        const load = async () => {
            const session = StorageService.getSession();
            if(!session) return navigate('/login');
            
            // STRICT CHECK: Admin tidak boleh masuk sini
            if(session.role === UserRole.ADMIN) {
                navigate('/admin');
                return;
            }

            const freshUser = await StorageService.findUser(session.id);
            setUser(freshUser || session);
            
            if (freshUser?.isSeller) {
                // Check if existing seller has accepted new rules
                if (!freshUser.hasAcceptedSellerRules) {
                    setShowRulesModal(true);
                }

                const [products, orders] = await Promise.all([
                    StorageService.getSellerProducts(freshUser.id),
                    StorageService.getOrders()
                ]);
                setMyProducts(products);
                
                // Filter orders specifically for this seller
                const sellerOrders = orders.filter(o => o.sellerId === freshUser.id);
                setMyOrders(sellerOrders);
                
                // Calculate Stats
                const revenue = sellerOrders.filter(o => o.status === OrderStatus.COMPLETED).reduce((acc, o) => acc + o.price, 0);
                const pending = sellerOrders.filter(o => o.status === OrderStatus.PENDING).length;
                const completed = sellerOrders.filter(o => o.status === OrderStatus.COMPLETED).length;
                setStats({ revenue, pending, completed });
            }
            
            setLoading(false);
        };
        load();
    }, [navigate]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!user) return;
        if(!storeName.trim()) return addToast("Nama toko wajib diisi", "error");
        if(!agreedToRules) return addToast("Anda wajib menyetujui Peraturan Seller.", "error");

        setIsSubmitting(true);
        const success = await StorageService.registerSeller(user.id, storeName, description);
        if(success) {
            addToast("Selamat! Toko berhasil dibuat.", "success");
            window.location.reload();
        } else {
            addToast("Gagal membuat toko.", "error");
        }
        setIsSubmitting(false);
    };
    
    const handleAcceptRules = async () => {
        if(!user) return;
        await StorageService.acceptSellerRules(user.id);
        setShowRulesModal(false);
        addToast("Terima kasih telah menyetujui peraturan.", "success");
    };
    
    const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                const uploadedUrl = await StorageService.uploadFile(file);
                setNewProduct(prev => ({ ...prev, image: uploadedUrl }));
                addToast("Gambar berhasil diupload!", "success");
            } catch (error) {
                addToast("Gagal upload gambar.", "error");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleAddProduct = async () => {
        if(!user || !user.isSeller) return;
        
        // CHECK STORE LEVEL LIMIT
        const currentLevel = user.storeLevel || 1;
        const levelConfig = STORE_LEVELS.find(l => l.level === currentLevel);
        const maxProducts = levelConfig ? levelConfig.maxProducts : 5;

        if (myProducts.length >= maxProducts) {
            return addToast(`Limit produk tercapai untuk Level ${currentLevel}. Tingkatkan penjualan untuk naik level!`, "error");
        }

        if (!newProduct.name || !newProduct.price) return addToast("Nama dan Harga wajib diisi", "error");
        
        const product: Product = {
            id: Date.now().toString(),
            name: newProduct.name!,
            price: Number(newProduct.price),
            category: newProduct.category || 'General',
            description: newProduct.description || '',
            stock: 99,
            image: newProduct.image,
            type: newProduct.type || 'ITEM',
            sellerId: user.id, // VITAL: Mark as seller product
            sellerName: user.storeName,
            sellerLevel: currentLevel
        };

        await StorageService.saveProduct(product);
        setMyProducts(prev => [product, ...prev]);
        setShowAddProduct(false);
        setNewProduct({ type: 'ITEM' });
        addToast("Produk berhasil ditambahkan ke tokomu!", "success");
    };

    const handleDeleteProduct = async (id: string) => {
        if(confirm("Hapus produk ini dari toko?")) {
            await StorageService.deleteProduct(id);
            setMyProducts(prev => prev.filter(p => p.id !== id));
            addToast("Produk dihapus.", "info");
        }
    };

    const handleProcessOrder = async (orderId: string) => {
        await StorageService.updateOrderStatus(orderId, OrderStatus.PROCESSED, user?.username || 'Seller');
        setMyOrders(prev => prev.map(o => o.id === orderId ? {...o, status: OrderStatus.PROCESSED} : o));
        addToast("Pesanan diproses. Segera kirim item ke pembeli!", "success");
    };

    // RULES CONTENT
    const RulesContent = () => (
        <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-sm text-gray-300 space-y-3 h-64 overflow-y-auto mb-4">
            <p>1. <strong>Produk Legal:</strong> Seller dilarang menjual produk ilegal, carding, cheat/script berbahaya, atau konten yang melanggar hukum.</p>
            <p>2. <strong>Kecepatan Proses:</strong> Pesanan wajib diproses maksimal 1x24 jam. Jika tidak, pesanan akan dibatalkan otomatis dan reputasi toko turun.</p>
            <p>3. <strong>Anti Fraud:</strong> Dilarang melakukan manipulasi order palsu untuk menaikkan rating.</p>
            <p>4. <strong>Data Pembeli:</strong> Dilarang menyalahgunakan data pembeli untuk kepentingan di luar transaksi.</p>
            <p>5. <strong>Sanksi:</strong> Pelanggaran aturan dapat menyebabkan penangguhan (suspend) atau pemblokiran permanen akun toko.</p>
        </div>
    );

    if(loading) return <div className="p-10 text-center text-white"><Loader2 className="animate-spin mx-auto"/> Memuat...</div>;

    // IF ALREADY SELLER -> SHOW DASHBOARD
    if (user?.isSeller) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8 pb-32">
                {/* Rules Modal for Existing Sellers */}
                {showRulesModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md px-4">
                        <div className="bg-dark-card w-full max-w-lg rounded-3xl p-8 border border-white/10 shadow-2xl animate-slide-up">
                            <div className="flex items-center gap-3 mb-4 text-brand-400">
                                <FileText size={32}/>
                                <h2 className="text-2xl font-bold text-white">Update Peraturan Seller</h2>
                            </div>
                            <p className="text-gray-400 mb-4">Demi menjaga keamanan komunitas, kami telah memperbarui peraturan untuk Seller. Mohon baca dan setujui untuk melanjutkan.</p>
                            
                            <RulesContent />

                            <button onClick={handleAcceptRules} className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-all">
                                Saya Setuju & Lanjutkan
                            </button>
                        </div>
                    </div>
                )}

                {/* Seller Dashboard Content (Same as before) */}
                {/* Store Header Info */}
                <div className="bg-gradient-to-r from-brand-900 to-blue-900 rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-2xl">
                     {/* ... (Existing code for header) ... */}
                     <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                     <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Store size={32} className="text-brand-300"/>
                                <h1 className="text-3xl font-bold">{user.storeName}</h1>
                                {user.storeStatus === StoreStatus.PENDING && <span className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded">Menunggu Verifikasi</span>}
                            </div>
                            <p className="text-gray-200 max-w-xl">{user.storeDescription || "Kelola produk dan pesananmu di sini."}</p>
                        </div>
                        
                        <div className="bg-white/10 p-4 rounded-2xl border border-white/10 w-full md:w-auto min-w-[200px]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-yellow-400 flex items-center gap-1"><Zap size={14}/> Level {user.storeLevel || 1}</span>
                                <span className="text-xs text-gray-300">{user.storeExp || 0} / {STORE_LEVELS.find(l => l.level === (user.storeLevel || 1) + 1)?.expRequired || 'MAX'} EXP</span>
                            </div>
                            <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-500 transition-all" style={{ width: `${Math.min(100, ((user.storeExp || 0) / (STORE_LEVELS.find(l => l.level === (user.storeLevel || 1) + 1)?.expRequired || 100)) * 100)}%` }}></div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 text-center">Slot Produk: {myProducts.length} / {STORE_LEVELS.find(l => l.level === (user.storeLevel || 1))?.maxProducts}</p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Tabs */}
                <div className="flex bg-[#1e293b] rounded-xl p-1 mb-8 border border-white/5">
                    {[
                        { id: 'products', label: 'Produk Saya', icon: Package },
                        { id: 'orders', label: 'Pesanan Masuk', icon: ShoppingCart, badge: stats.pending },
                        { id: 'stats', label: 'Statistik', icon: TrendingUp }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                                activeTab === tab.id ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <tab.icon size={16}/> {tab.label}
                            {tab.badge ? <span className="bg-red-500 text-white px-2 rounded-full text-[10px]">{tab.badge}</span> : null}
                        </button>
                    ))}
                </div>

                {/* STATS TAB */}
                {activeTab === 'stats' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                        <div className="bg-[#1e293b] p-6 rounded-2xl border border-white/5">
                            <div className="bg-green-500/10 w-12 h-12 rounded-xl flex items-center justify-center text-green-500 mb-4"><DollarSign size={24}/></div>
                            <h3 className="text-gray-400 text-sm font-bold uppercase">Total Pendapatan</h3>
                            <p className="text-3xl font-black text-white">Rp {stats.revenue.toLocaleString()}</p>
                        </div>
                        <div className="bg-[#1e293b] p-6 rounded-2xl border border-white/5">
                            <div className="bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center text-blue-500 mb-4"><CheckCircle size={24}/></div>
                            <h3 className="text-gray-400 text-sm font-bold uppercase">Pesanan Selesai</h3>
                            <p className="text-3xl font-black text-white">{stats.completed}</p>
                        </div>
                        <div className="bg-[#1e293b] p-6 rounded-2xl border border-white/5">
                            <div className="bg-yellow-500/10 w-12 h-12 rounded-xl flex items-center justify-center text-yellow-500 mb-4"><Clock size={24}/></div>
                            <h3 className="text-gray-400 text-sm font-bold uppercase">Menunggu Proses</h3>
                            <p className="text-3xl font-black text-white">{stats.pending}</p>
                        </div>
                    </div>
                )}

                {/* ORDERS TAB */}
                {activeTab === 'orders' && (
                    <div className="space-y-4 animate-fade-in">
                        {myOrders.length === 0 ? (
                            <div className="text-center py-20 bg-[#1e293b] rounded-3xl border border-white/5 text-gray-500">
                                <ShoppingCart size={40} className="mx-auto mb-4 opacity-30"/>
                                <p>Belum ada pesanan masuk.</p>
                            </div>
                        ) : (
                            myOrders.map(order => (
                                <div key={order.id} className="bg-[#1e293b] border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row justify-between gap-6 hover:border-brand-500/30 transition-all">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                order.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' :
                                                order.status === 'PROCESSED' ? 'bg-blue-500/20 text-blue-500' :
                                                'bg-green-500/20 text-green-500'
                                            }`}>{order.status}</span>
                                            <span className="text-xs text-gray-500">#{order.id}</span>
                                            <span className="text-xs text-gray-500">• {new Date(order.createdAt).toLocaleString()}</span>
                                        </div>
                                        <h3 className="text-white font-bold text-lg mb-1">{order.productName}</h3>
                                        <div className="bg-black/30 p-3 rounded-lg border border-white/5 text-sm space-y-1 mb-3">
                                            <p className="text-gray-300"><span className="text-gray-500">Buyer:</span> {order.username}</p>
                                            <p className="text-gray-300"><span className="text-gray-500">Data:</span> {JSON.stringify(order.gameData)}</p>
                                            {order.paymentProof && (
                                                <a href={order.paymentProof} target="_blank" className="text-brand-400 text-xs hover:underline">Lihat Bukti Bayar Buyer</a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end justify-between">
                                        <p className="text-xl font-bold text-brand-400">Rp {order.price.toLocaleString()}</p>
                                        
                                        {order.status === OrderStatus.PENDING && (
                                            <button 
                                                onClick={() => handleProcessOrder(order.id)}
                                                className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20"
                                            >
                                                Proses Pesanan
                                            </button>
                                        )}
                                        {order.status === OrderStatus.PROCESSED && (
                                            <div className="text-xs text-blue-400 font-bold bg-blue-500/10 px-3 py-2 rounded-lg text-center max-w-[200px]">
                                                Pesanan diproses. Tunggu Buyer konfirmasi selesai atau Admin menyelesaikan.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* PRODUCTS TAB */}
                {activeTab === 'products' && (
                    <div className="animate-fade-in">
                        {/* Add Product Form Toggle */}
                        <div className="mb-8">
                            {!showAddProduct ? (
                                <button onClick={() => setShowAddProduct(true)} className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg">
                                    <Plus size={20}/> Tambah Produk Baru
                                </button>
                            ) : (
                                <div className="bg-dark-card border border-white/5 rounded-3xl p-8 animate-slide-up">
                                    <h3 className="text-xl font-bold text-white mb-6">Input Produk Baru</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <input placeholder="Nama Produk" className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white" value={newProduct.name || ''} onChange={e => setNewProduct({...newProduct, name: e.target.value})}/>
                                        <input placeholder="Harga (Rp)" type="number" className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}/>
                                        <select className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white" value={newProduct.type} onChange={e => setNewProduct({...newProduct, type: e.target.value as ProductType})}>
                                            <option value="ITEM">Item Digital</option>
                                            <option value="SKIN">Skin / Gift</option>
                                            <option value="JOKI">Jasa Joki</option>
                                            <option value="OTHER">Lainnya</option>
                                        </select>
                                        
                                        <div className="relative group">
                                            <input type="file" onChange={handleProductImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*"/>
                                            <div className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white flex items-center gap-3">
                                                <Upload size={18} className="text-gray-400"/>
                                                <span className="text-sm text-gray-400 truncate">{newProduct.image ? 'Gambar Siap' : 'Upload Gambar'}</span>
                                            </div>
                                            {isUploading && <Loader2 className="animate-spin absolute right-2 top-3 text-white"/>}
                                        </div>

                                        <textarea placeholder="Deskripsi" className="md:col-span-2 bg-dark-bg border border-white/10 rounded-xl p-3 text-white h-24" value={newProduct.description || ''} onChange={e => setNewProduct({...newProduct, description: e.target.value})}/>
                                        
                                        <div className="md:col-span-2 flex gap-3">
                                            <button onClick={() => setShowAddProduct(false)} className="px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 font-bold">Batal</button>
                                            <button onClick={handleAddProduct} className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl shadow-lg">Publish Produk</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {myProducts.length === 0 && !showAddProduct && (
                                <div className="col-span-full text-center py-10 text-gray-500">Belum ada produk.</div>
                            )}
                            {myProducts.map(p => (
                                <div key={p.id} className="bg-dark-card border border-white/5 p-4 rounded-2xl flex flex-col gap-3 group relative hover:border-brand-500/30 transition-all">
                                    <div className="h-32 w-full bg-gray-800 rounded-xl overflow-hidden">
                                        <img src={p.image || "https://picsum.photos/200"} className="w-full h-full object-cover"/>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-bold truncate">{p.name}</h4>
                                        <p className="text-brand-400 font-bold text-sm">Rp {p.price.toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => handleDeleteProduct(p.id)} className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // IF NOT SELLER -> SHOW REGISTRATION FORM
    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-bold mb-6 border border-brand-500/20">
                        <Store size={14}/> MITRA SELLER
                    </div>
                    <h1 className="text-4xl font-extrabold text-white mb-4 leading-tight">
                        Mulai Bisnis Digitalmu Bersama Kami
                    </h1>
                    <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                        Jangkau ribuan gamers dan jual produk digitalmu dengan mudah. Gratis pendaftaran dan fitur kelola toko yang lengkap.
                    </p>
                    
                    <ul className="space-y-4 mb-8">
                        {['Buka Toko Gratis Selamanya', 'Jangkauan Luas ke Komunitas', 'Dashboard Pengelolaan Mudah', 'Dukungan Promosi'].map((item, idx) => (
                            <li key={idx} className="flex items-center gap-3 text-gray-300">
                                <CheckCircle size={20} className="text-green-500 shrink-0"/> {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-dark-card border border-white/5 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    
                    <h2 className="text-2xl font-bold text-white mb-6">Form Pendaftaran Toko</h2>
                    <form onSubmit={handleRegister} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">Nama Toko</label>
                            <input 
                                required
                                value={storeName}
                                onChange={e => setStoreName(e.target.value)}
                                className="w-full bg-dark-bg border border-white/10 rounded-xl p-4 text-white focus:border-brand-500 outline-none transition-all"
                                placeholder="Contoh: Pro Gamers Shop"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">Deskripsi Singkat</label>
                            <textarea 
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full bg-dark-bg border border-white/10 rounded-xl p-4 text-white focus:border-brand-500 outline-none transition-all"
                                placeholder="Jelaskan apa yang kamu jual..."
                                rows={4}
                            />
                        </div>

                        {/* Agreement Checkbox */}
                        <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
                            <input 
                                type="checkbox" 
                                checked={agreedToRules}
                                onChange={e => setAgreedToRules(e.target.checked)}
                                className="mt-1 w-5 h-5 accent-brand-500"
                            />
                            <div>
                                <label className="text-sm text-gray-300">
                                    Saya menyetujui semua <strong className="text-white">Peraturan Seller</strong> yang berlaku.
                                </label>
                                <div className="text-xs text-gray-500 mt-1 cursor-pointer underline hover:text-brand-400" onClick={() => alert("Lihat bagian Update Peraturan Seller di popup nanti.")}>
                                    Baca Peraturan
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin"/> : <>Buka Toko Sekarang <ArrowRight size={18}/></>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OpenStore;
