
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { User, Product, ProductType, StoreStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import { Store, Loader2, CheckCircle, Package, ArrowRight, Wallet, ShoppingBag, Plus, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '../components/Toast';

const OpenStore: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Seller Data State
    const [myProducts, setMyProducts] = useState<Product[]>([]);
    
    // Form State (Register)
    const [storeName, setStoreName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State (Add Product)
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [newProduct, setNewProduct] = useState<Partial<Product>>({ type: 'ITEM' });
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const load = async () => {
            const session = StorageService.getSession();
            if(!session) return navigate('/login');
            const freshUser = await StorageService.findUser(session.id);
            setUser(freshUser || session);
            
            if (freshUser?.isSeller) {
                const products = await StorageService.getSellerProducts(freshUser.id);
                setMyProducts(products);
            }
            
            setLoading(false);
        };
        load();
    }, [navigate]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!user) return;
        if(!storeName.trim()) return addToast("Nama toko wajib diisi", "error");

        setIsSubmitting(true);
        const success = await StorageService.registerSeller(user.id, storeName, description);
        if(success) {
            addToast("Selamat! Toko berhasil dibuat.", "success");
            // Refresh
            const updatedUser = await StorageService.findUser(user.id);
            if(updatedUser) {
                 StorageService.setSession(updatedUser);
                 setUser(updatedUser);
            }
        } else {
            addToast("Gagal membuat toko.", "error");
        }
        setIsSubmitting(false);
    };
    
    const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                const compressedBase64 = await StorageService.compressImage(file, 300);
                setNewProduct(prev => ({ ...prev, image: compressedBase64 }));
            } catch (error) {
                addToast("Gagal upload gambar.", "error");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleAddProduct = async () => {
        if(!user) return;
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
            sellerName: user.storeName
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

    if(loading) return <div className="p-10 text-center text-white"><Loader2 className="animate-spin mx-auto"/> Memuat...</div>;

    // IF ALREADY SELLER -> SHOW DASHBOARD
    if (user?.isSeller) {
        if (user.storeStatus === StoreStatus.SUSPENDED) {
            return (
                <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                    <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl inline-block">
                        <AlertTriangle size={48} className="text-red-500 mx-auto mb-4"/>
                        <h1 className="text-2xl font-bold text-white mb-2">Toko Diblokir Admin</h1>
                        <p className="text-gray-400">Silahkan hubungi support untuk informasi lebih lanjut.</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="max-w-6xl mx-auto px-4 py-8 pb-32">
                <div className="bg-gradient-to-r from-brand-900 to-blue-900 rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Store size={32} className="text-brand-300"/>
                                <h1 className="text-3xl font-bold">{user.storeName}</h1>
                                {user.storeStatus === StoreStatus.PENDING && <span className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded">Menunggu Verifikasi</span>}
                            </div>
                            <p className="text-gray-200 max-w-xl">{user.storeDescription || "Kelola produk dan pesananmu di sini."}</p>
                        </div>
                        <button onClick={() => navigate(`/u/${user.id}`)} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold border border-white/10">Lihat Halaman Toko</button>
                    </div>
                </div>

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
                <div>
                    <h3 className="text-white font-bold text-xl mb-4">Produk Saya ({myProducts.length})</h3>
                    {myProducts.length === 0 ? (
                        <div className="bg-dark-card border border-white/5 rounded-3xl p-10 text-center">
                            <Package size={48} className="mx-auto text-gray-600 mb-4"/>
                            <p className="text-gray-400">Kamu belum memiliki produk.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                    )}
                </div>
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
                        
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-300">
                            Dengan mendaftar, kamu menyetujui Syarat & Ketentuan seller yang berlaku di platform ini.
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
