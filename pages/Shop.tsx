import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { Product, User, CartItem } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeleton';
import { Search, Filter, Package, X, ShoppingCart, ArrowRight, Info, Zap, Store, Crown } from 'lucide-react';
import { useToast } from '../components/Toast';

interface ShopProps {
  user: User | null;
}

const Shop: React.FC<ShopProps> = ({ user }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Product Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [inputData, setInputData] = useState<{[key:string]: string}>({});
  const [addingToCart, setAddingToCart] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  // 1. Fetch Products Only Once
  useEffect(() => {
      const load = async () => {
          setLoading(true);
          const data = await StorageService.getGlobalProducts();
          setProducts(data);
          setLoading(false);
      };
      load();
  }, []);

  // 2. Handle URL Params (Opening Modal) - Dependent on 'products' being loaded
  useEffect(() => {
      if (loading || products.length === 0) return;

      const params = new URLSearchParams(location.search);
      const cat = params.get('category');
      const prodId = params.get('product');

      if (cat) setSelectedCategory(cat);
      
      if (prodId) {
          const found = products.find(p => p.id === prodId);
          if (found) {
              setSelectedProduct(found);
              setInputData({});
          }
      } else {
          // If no product ID in URL, close modal if open
          setSelectedProduct(null);
      }
  }, [location.search, loading, products]);

  // Unique Categories
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category || 'General')))];

  // Filtering Logic
  const filteredProducts = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
  });

  // Grouping Logic
  const adminProducts = filteredProducts.filter(p => !p.sellerId);
  const memberProducts = filteredProducts.filter(p => p.sellerId);

  const groupedMemberProducts = memberProducts.reduce((acc, product) => {
      const storeName = product.sellerName || 'Mitra Seller';
      if (!acc[storeName]) acc[storeName] = [];
      acc[storeName].push(product);
      return acc;
  }, {} as Record<string, Product[]>);

  const handleProductClick = (product: Product) => {
      // Update URL to trigger modal via useEffect
      navigate(`/shop?product=${product.id}${selectedCategory !== 'All' ? `&category=${selectedCategory}` : ''}`);
  };

  const closeModal = () => {
      // Navigate back to shop root (preserving category if desired, or clean)
      navigate(`/shop${selectedCategory !== 'All' ? `?category=${selectedCategory}` : ''}`);
  };

  const handleAddToCart = async () => {
      if(!user) return navigate('/login');
      if(!selectedProduct) return;
      
      setAddingToCart(true);
      
      const cartItem: CartItem = {
          id: Date.now().toString(),
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          price: selectedProduct.isFlashSale ? selectedProduct.price : selectedProduct.price, // Price is already display price
          image: selectedProduct.image,
          quantity: 1,
          inputData: inputData, 
          sellerId: selectedProduct.sellerId
      };

      await StorageService.addToCart(user.id, cartItem);
      setAddingToCart(false);
      addToast("Produk masuk keranjang!", "success");
      closeModal();
  };

  const SectionTitle = ({ title, icon: Icon, colorClass }: { title: string, icon: any, colorClass: string }) => (
      <div className="flex items-center justify-center my-8 animate-fade-in">
          <div className={`h-px w-12 md:w-24 bg-gradient-to-r from-transparent to-${colorClass}-500/50`}></div>
          <div className={`mx-4 px-6 py-2 rounded-full bg-${colorClass}-500/10 border border-${colorClass}-500/20 backdrop-blur-sm flex items-center gap-3`}>
              <Icon size={20} className={`text-${colorClass}-400`} />
              <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-wider">{title}</h2>
          </div>
          <div className={`h-px w-12 md:w-24 bg-gradient-to-l from-transparent to-${colorClass}-500/50`}></div>
      </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] pb-24">
        {/* Header Search & Filter */}
        <div className="bg-[#1e293b] border-b border-white/5 sticky top-0 z-30 pt-4 pb-4 px-4 shadow-xl">
            <div className="max-w-7xl mx-auto space-y-4">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20}/>
                        <input 
                            placeholder="Cari produk game, voucher, atau item..." 
                            className="w-full bg-[#0f172a] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:border-brand-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Categories Scroll */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => {
                                setSelectedCategory(cat);
                                navigate(`/shop?category=${cat}`);
                            }}
                            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                selectedCategory === cat 
                                ? 'bg-brand-600 border-brand-500 text-white' 
                                : 'bg-[#0f172a] border-white/10 text-gray-400 hover:text-white'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Product Content */}
        <div className="max-w-7xl mx-auto px-4 py-2">
            
            {loading ? (
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => <ProductSkeleton key={i} />)}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="mt-12 text-center py-20 bg-[#1e293b] rounded-3xl border border-white/5 border-dashed">
                    <Package size={48} className="mx-auto text-gray-600 mb-4 opacity-50"/>
                    <p className="text-gray-400 font-bold">Produk tidak ditemukan.</p>
                    <p className="text-gray-600 text-sm">Coba kata kunci lain atau kategori berbeda.</p>
                </div>
            ) : (
                <>
                    {/* SECTION 1: ADMIN PRODUCTS (MY STORE) */}
                    {adminProducts.length > 0 && (
                        <div className="mb-12">
                            <SectionTitle title="My Store" icon={Crown} colorClass="brand" />
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {adminProducts.map(p => (
                                    <ProductCard 
                                        key={p.id} 
                                        product={p} 
                                        canBuy={true} 
                                        onBuy={() => handleProductClick(p)} 
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECTION 2: MEMBER PRODUCTS GROUPED BY STORE */}
                    {Object.entries(groupedMemberProducts).map(([storeName, products]) => (
                        <div key={storeName} className="mb-12">
                            <SectionTitle title={storeName} icon={Store} colorClass="blue" />
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {(products as Product[]).map(p => (
                                    <ProductCard 
                                        key={p.id} 
                                        product={p} 
                                        canBuy={true} 
                                        onBuy={() => handleProductClick(p)} 
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>

        {/* PRODUCT DETAIL MODAL */}
        {selectedProduct && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-fade-in p-4 overflow-y-auto">
                <div className="bg-[#1e293b] w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
                    
                    {/* Header Image */}
                    <div className="h-40 bg-gray-800 relative shrink-0">
                        <img src={selectedProduct.image || "https://picsum.photos/400"} className="w-full h-full object-cover opacity-80"/>
                        <button onClick={closeModal} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-red-500 text-white rounded-full transition-colors backdrop-blur-md">
                            <X size={20}/>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto">
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-1">
                                {selectedProduct.isFlashSale && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-bold flex items-center gap-1"><Zap size={10} fill="currentColor"/> FLASH SALE</span>}
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-1">{selectedProduct.name}</h2>
                            <p className="text-brand-400 font-bold text-xl">Rp {selectedProduct.price.toLocaleString()}</p>
                            <div className="flex gap-2 mt-2">
                                <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400 uppercase">{selectedProduct.type}</span>
                                {selectedProduct.sellerName ? (
                                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded flex items-center gap-1"><Store size={10}/> {selectedProduct.sellerName}</span>
                                ) : (
                                    <span className="text-[10px] bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded flex items-center gap-1"><Crown size={10}/> My Store</span>
                                )}
                            </div>
                            <p className="text-gray-400 text-sm mt-4 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
                                {selectedProduct.description || "Tidak ada deskripsi."}
                            </p>
                        </div>

                        {/* Config Inputs */}
                        <div className="space-y-4 mb-6">
                            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                                <Info size={14}/> Masukkan Data Akun
                            </h3>
                            
                            {/* Generic Inputs based on type or default */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">User ID / No. HP / Email</label>
                                    <input 
                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-brand-500 outline-none"
                                        placeholder="Masukkan ID"
                                        value={inputData['userId'] || ''}
                                        onChange={e => setInputData({...inputData, userId: e.target.value})}
                                    />
                                </div>
                                {(selectedProduct.type === 'ITEM' || selectedProduct.type === 'JOKI') && (
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Server ID (Optional)</label>
                                        <input 
                                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-brand-500 outline-none"
                                            placeholder="Zone ID"
                                            value={inputData['serverId'] || ''}
                                            onChange={e => setInputData({...inputData, serverId: e.target.value})}
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Catatan Tambahan (Opsional)</label>
                                <textarea 
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-brand-500 outline-none h-20 resize-none"
                                    placeholder="Contoh: Nickname, request khusus, dll..."
                                    value={inputData['notes'] || ''}
                                    onChange={e => setInputData({...inputData, notes: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-white/5 bg-[#1e293b] shrink-0 flex gap-3">
                         <button 
                            onClick={handleAddToCart}
                            disabled={addingToCart}
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/5"
                         >
                             <ShoppingCart size={18}/> Tambah Keranjang
                         </button>
                         <button 
                            onClick={async () => {
                                await handleAddToCart();
                                navigate('/cart');
                            }}
                            disabled={addingToCart}
                            className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                         >
                             Beli Sekarang <ArrowRight size={18}/>
                         </button>
                    </div>

                </div>
            </div>
        )}
    </div>
  );
};

export default Shop;