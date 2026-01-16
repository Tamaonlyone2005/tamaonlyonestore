import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { User, Product, ProductType, StoreStatus, UserRole, STORE_LEVELS, Order, OrderStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import { Store, Loader2, CheckCircle, Package, ArrowRight, Plus, Upload, Trash2, AlertTriangle, Zap, ShoppingCart, DollarSign, TrendingUp, Clock, FileText, Menu, X, Settings, LogOut, Edit2 } from 'lucide-react';
import { useToast } from '../components/Toast';

const OpenStore: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    
    // NAVIGATION STATE (Replaces Tabs)
    const [activeView, setActiveView] = useState<'products' | 'orders' | 'stats' | 'settings'>('products');
    
    // Seller Data State
    const [myProducts, setMyProducts] = useState<Product[]>([]);
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState({ revenue: 0, pending: 0, completed: 0 });
    
    // Form State (Register)
    const [storeName, setStoreName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [agreedToRules, setAgreedToRules] = useState(false);

    // Form State (Add/Edit Product)
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productForm, setProductForm] = useState<Partial<Product>>({ type: 'ITEM' });
    const [isUploading, setIsUploading] = useState(false);
    
    // Rules Modal State
    const [showRulesModal, setShowRulesModal] = useState(false);

    // Menu State
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
                setProductForm(prev => ({ ...prev, image: uploadedUrl }));
                addToast("Gambar berhasil diupload!", "success");
            } catch (error) {
                addToast("Gagal upload gambar.", "error");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleSaveProduct = async () => {
        if(!user || !user.isSeller) return;
        
        // CHECK STORE LEVEL LIMIT (Only for new products)
        if (!editingProduct) {
            const currentLevel = user.storeLevel || 1;
            const levelConfig = STORE_LEVELS.find(l => l.level === currentLevel);
            const maxProducts = levelConfig ? levelConfig.maxProducts : 5;

            if (myProducts.length >= maxProducts) {
                return addToast(`Limit produk tercapai untuk Level ${currentLevel}. Tingkatkan penjualan untuk naik level!`, "error");
            }
        }

        if (!productForm.name || !productForm.price) return addToast("Nama dan Harga wajib diisi", "error");
        
        const product: Product = {
            id: editingProduct ? editingProduct.id : Date.now().toString(),
            name: productForm.name!,
            price: Number(productForm.price),
            category: productForm.category || 'General',
            description: productForm.description || '',
            stock: 99,
            image: productForm.image,
            type: productForm.type || 'ITEM',
            sellerId: user.id, 
            sellerName: user.storeName,
            sellerLevel: user.storeLevel || 1,
            // Keep existing fields if editing
            isFlashSale: editingProduct?.isFlashSale || false,
            isBoosted: editingProduct?.isBoosted || false
        };

        await StorageService.saveProduct(product);
        
        if (editingProduct) {
            setMyProducts(prev => prev.map(p => p.id === product.id ? product : p));
            addToast("Produk berhasil diperbarui!", "success");
        } else {
            setMyProducts(prev => [product, ...prev]);
            addToast("Produk berhasil ditambahkan ke tokomu!", "success");
        }
        
        setShowProductForm(false);
        setEditingProduct(null);
        setProductForm({ type: 'ITEM' });
    };

    const handleEditClick = (product: Product) => {
        setEditingProduct(product);
        setProductForm(product);
        setShowProductForm(true);
        // Ensure we are in settings or appropriate view, or show modal on top
        // Since prompt asked to put "Add Product" in settings, let's keep form logic tied to settings or just modal
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
            <div className="max-w-6xl mx-auto px-4 py-8 pb-32 relative">
                {/* HAMBURGER MENU DRAWER (Fixed Overlay Z-60) */}
                {isMenuOpen && (
                    <div className="fixed inset-0 z-[60] flex h-full">
                        {/* Backdrop - High Z-Index, covers everything */}
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsMenuOpen(false)}></div>
                        
                        {/* Drawer Content */}
                        <div className="relative w-72 bg-[#1e293b] border-r border-white/10 h-full p-6 animate-slide-right flex flex-col shadow-2xl z-50">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center font-bold text-white">
                                        {user.storeName?.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-white text-sm truncate max-w-[140px]">{user.storeName}</span>
                                        <span className="text-[10px] text-gray-400">Seller Dashboard</span>
                                    </div>
                                </div>
                                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-white"><X size={20}/></button>
                            </div>
                            
                            {/* MENU NAVIGATION ITEMS */}
                            <nav className="space-y-2 flex-1">
                                <button 
                                    onClick={() => { setActiveView('products'); setIsMenuOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${activeView === 'products' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Package size={18}/> Produk Saya
                                </button>
                                <button 
                                    onClick={() => { setActiveView('orders'); setIsMenuOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${activeView === 'orders' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <ShoppingCart size={18}/> Pesanan Masuk
                                    {stats.pending > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{stats.pending}</span>}
                                </button>
                                <button 
                                    onClick={() => { setActiveView('stats'); setIsMenuOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${activeView === 'stats' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <TrendingUp size={18}/> Statistik Toko
                                </button>
                                <button 
                                    onClick={() => { setActiveView('settings'); setIsMenuOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${activeView === 'settings' ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Settings size={18}/> Pengaturan Toko
                                </button>
                            </nav>

                            <div className="pt-4 border-t border-white/5">
                                <button onClick={() => navigate('/shop')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 text-left">
                                    <LogOut size={18}/> Kembali ke Shop
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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

                {/* Store Header Info */}
                <div className="bg-gradient-to-r from-brand-900 to-blue-900 rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-2xl">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                     <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                {/* MENU BUTTON */}
                                <button 
                                    onClick={() => setIsMenuOpen(true)}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10"
                                >
                                    <Menu size={24} className="text-white"/>
                                </button>

                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold">{user.storeName}</h1>
                                    {user.storeStatus === StoreStatus.PENDING && <span className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded">Menunggu Verifikasi</span>}
                                </div>
                            </div>
                            <p className="text-gray-200 max-w-xl pl-14">{user.storeDescription || "Kelola produk dan pesananmu di sini."}</p>
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

                {/* --- VIEWS --- */}

                {/* STATS VIEW */}
                {activeView === 'stats' && (
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

                {/* ORDERS VIEW */}
                {activeView === 'orders' && (
                    <div className="space-y-4 animate-fade-in">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><ShoppingCart size={20}/> Pesanan Masuk</h2>
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

                {/* PRODUCTS VIEW */}
                {activeView === 'products' && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Package size={20}/> Produk Saya</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {myProducts.length === 0 ? (
                                <div className="col-span-full text-center py-20 text-gray-500 bg-[#1e293b] rounded-3xl border border-white/5 border-dashed">
                                    <Package size={48} className="mx-auto mb-4 opacity-30"/>
                                    <p>Belum ada produk. Tambahkan produk di menu Pengaturan Toko.</p>
                                </div>
                            ) : (
                                myProducts.map(p => (
                                    // MATCHED STYLE TO ProductCard.tsx (Aspect Video, same padding logic)
                                    <div key={p.id} className="bg-dark-card border border-white/5 rounded-xl overflow-hidden flex flex-col gap-0 group relative hover:border-brand-500/30 transition-all hover:-translate-y-1">
                                        <div className="w-full aspect-video bg-gray-800 overflow-hidden relative">
                                            <img src={p.image || "https://picsum.photos/200"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>
                                            {/* Edit/Delete Overlay */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                                                <button onClick={() => handleEditClick(p)} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500" title="Edit"><Edit2 size={16}/></button>
                                                <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-500" title="Hapus"><Trash2 size={16}/></button>
                                            </div>
                                            <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-md">{p.type}</div>
                                        </div>
                                        <div className="p-3 flex-1 flex flex-col">
                                            <h4 className="text-white font-bold text-sm truncate mb-1">{p.name}</h4>
                                            <div className="mt-auto flex items-center justify-between">
                                                <p className="text-brand-400 font-bold text-sm">Rp {p.price.toLocaleString()}</p>
                                                <span className="text-[10px] text-gray-500">{p.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* SETTINGS VIEW (Includes Add/Edit Product) */}
                {activeView === 'settings' && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Settings size={20}/> Pengaturan Toko</h2>
                            {!showProductForm && (
                                <button onClick={() => { setEditingProduct(null); setProductForm({type:'ITEM'}); setShowProductForm(true); }} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg">
                                    <Plus size={16}/> Tambah Produk
                                </button>
                            )}
                        </div>

                        {/* ADD/EDIT PRODUCT FORM */}
                        {showProductForm ? (
                            <div className="bg-dark-card border border-white/5 rounded-3xl p-8 animate-slide-up mb-8">
                                <h3 className="text-xl font-bold text-white mb-6 border-b border-white/5 pb-4">
                                    {editingProduct ? 'Edit Produk' : 'Input Produk Baru'}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Nama Produk</label>
                                        <input className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white w-full" value={productForm.name || ''} onChange={e => setProductForm({...productForm, name: e.target.value})}/>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Harga (Rp)</label>
                                        <input type="number" className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white w-full" value={productForm.price || ''} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})}/>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Kategori / Tipe</label>
                                        <select className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white w-full" value={productForm.type} onChange={e => setProductForm({...productForm, type: e.target.value as ProductType})}>
                                            <option value="ITEM">Item Digital</option>
                                            <option value="SKIN">Skin / Gift</option>
                                            <option value="JOKI">Jasa Joki</option>
                                            <option value="OTHER">Lainnya</option>
                                        </select>
                                    </div>
                                    
                                    <div className="relative group">
                                        <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Gambar Produk</label>
                                        <input type="file" onChange={handleProductImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10 mt-6" accept="image/*" />
                                        <div className="bg-dark-bg border border-white/10 rounded-xl p-3 text-white flex items-center gap-3">
                                            <Upload size={18} className="text-gray-400"/>
                                            <span className="text-sm text-gray-400 truncate">{productForm.image ? 'Gambar Siap (Ganti?)' : 'Upload Gambar'}</span>
                                        </div>
                                        {isUploading && <Loader2 className="animate-spin absolute right-2 top-9 text-white"/>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Deskripsi</label>
                                        <textarea className="md:col-span-2 bg-dark-bg border border-white/10 rounded-xl p-3 text-white h-24 w-full" value={productForm.description || ''} onChange={e => setProductForm({...productForm, description: e.target.value})}/>
                                    </div>
                                    
                                    <div className="md:col-span-2 flex gap-3 pt-4 border-t border-white/5">
                                        <button onClick={() => setShowProductForm(false)} className="px-6 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 font-bold">Batal</button>
                                        <button onClick={handleSaveProduct} className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl shadow-lg">
                                            {editingProduct ? 'Update Produk' : 'Publish Produk'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#1e293b] p-8 rounded-3xl border border-white/5 text-center text-gray-400">
                                <Settings size={48} className="mx-auto mb-4 opacity-30"/>
                                <p>Pengaturan detail toko lainnya akan segera hadir.</p>
                                <p className="text-sm">Gunakan tombol "Tambah Produk" diatas untuk mengelola etalase toko.</p>
                            </div>
                        )}
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