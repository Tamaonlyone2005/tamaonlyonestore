
import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storageService';
import { Product, User, CartItem, ProductVariant } from '../types';
import { useToast } from '../components/Toast';
import { ShoppingCart, ArrowRight, Info, Search, Filter, ArrowUpDown } from 'lucide-react';
import { ProductSkeleton } from '../components/Skeleton';
import ReviewSection from '../components/ReviewSection';

interface ShopProps {
  user: User | null;
}

const Shop: React.FC<ShopProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const queryParams = new URLSearchParams(location.search);
  const productId = queryParams.get('product');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'LOW_HIGH' | 'HIGH_LOW' | 'NEWEST'>('NEWEST');
  
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  
  const [inputFields, setInputFields] = useState<{[key:string]: string}>({});
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        const allProducts = await StorageService.getProducts();
        setProducts(allProducts);
        
        if (productId) {
            const found = allProducts.find(p => p.id === productId);
            if (found) {
                setActiveProduct(found);
                if(found.variants && found.variants.length > 0) setSelectedVariant(found.variants[0]);
            }
        }
        setLoading(false);
    };
    loadData();
  }, [productId]);

  // Advanced Filtering Logic
  const filteredProducts = useMemo(() => {
      let res = [...products];

      // Search
      if (searchTerm) {
          res = res.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
      }

      // Category
      if (selectedCategory !== 'ALL') {
          if (selectedCategory === 'ITEM') res = res.filter(p => p.type === 'ITEM' || p.type === 'SKIN');
          else if (selectedCategory === 'SERVICES') res = res.filter(p => p.type === 'JOKI' || p.type === 'REKBER');
          else if (selectedCategory === 'OTHER') res = res.filter(p => !['ITEM', 'SKIN', 'JOKI', 'REKBER'].includes(p.type));
      }

      // Sort
      if (sortOrder === 'LOW_HIGH') res.sort((a,b) => a.price - b.price);
      else if (sortOrder === 'HIGH_LOW') res.sort((a,b) => b.price - a.price);
      else res.sort((a,b) => Number(b.id) - Number(a.id)); // Newest based on ID timestamp

      return res;
  }, [products, searchTerm, selectedCategory, sortOrder]);

  const handleAddToCart = async () => {
      if(!user) return navigate('/login');
      if(!activeProduct) return;
      
      const price = selectedVariant ? selectedVariant.price : activeProduct.price;
      const variantName = selectedVariant ? selectedVariant.name : undefined;

      const item: CartItem = {
          id: Date.now().toString(),
          productId: activeProduct.id,
          productName: activeProduct.name,
          image: activeProduct.image,
          price: price,
          variantName: variantName,
          quantity: 1,
          inputData: inputFields,
          note: inputFields['note'] || ''
      };
      
      await StorageService.addToCart(user.id, item);
      addToast("Berhasil masuk keranjang!", "success");
  };

  const handleBuyNow = async () => {
       if(!user) return navigate('/login');
       await handleAddToCart();
       navigate('/cart');
  };

  // If viewing details
  if (activeProduct) {
     if (!activeProduct) return <div className="max-w-7xl mx-auto px-4 py-8"><ProductSkeleton/></div>;
     
     return (
        <div className="max-w-6xl mx-auto px-4 py-8 pb-32">
           <button onClick={() => navigate('/shop')} className="mb-6 text-gray-400 hover:text-white flex items-center gap-2 font-bold text-sm">
               <ArrowRight className="rotate-180" size={16}/> Kembali ke Toko
           </button>

           {/* 1. COMPACT HEADER (Image + Title + Price) - Itemku Style */}
           <div className="bg-[#1e293b] rounded-2xl p-6 border border-white/5 shadow-xl mb-6 animate-fade-in">
               <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                    {/* Image Thumbnail - Fixed Size Compact */}
                    <div className="flex-shrink-0 w-24 h-24 md:w-40 md:h-40 bg-gray-800 rounded-xl overflow-hidden border border-white/10 shadow-lg relative group">
                         <img src={activeProduct.image || "https://picsum.photos/500"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    </div>
                    {/* Info */}
                    <div className="flex-1 text-center md:text-left">
                         <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-2">
                             <span className="px-2 py-0.5 rounded text-[10px] bg-brand-600 text-white font-bold uppercase tracking-wider">{activeProduct.type}</span>
                             <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-gray-300 font-bold uppercase tracking-wider">{activeProduct.category || 'General'}</span>
                         </div>
                         <h1 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight">{activeProduct.name}</h1>
                         <div className="text-2xl md:text-3xl font-extrabold text-brand-400">
                             Rp {(selectedVariant ? selectedVariant.price : activeProduct.price).toLocaleString()}
                         </div>
                    </div>
               </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN: CONFIGURATION */}
                <div className="lg:col-span-2 space-y-6 animate-slide-up">
                     <div className="bg-[#1e293b] rounded-2xl p-6 border border-white/5 shadow-xl">
                         <h2 className="font-bold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
                             <ShoppingCart size={20} className="text-brand-500"/> Konfigurasi Pesanan
                         </h2>
                         
                         <div className="space-y-6">
                              {/* Variants Grid */}
                              {activeProduct.variants && activeProduct.variants.length > 0 && (
                                  <div>
                                      <label className="block text-sm font-bold text-gray-400 mb-3">Pilih Varian</label>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                          {activeProduct.variants.map((v, idx) => (
                                              <div key={idx} onClick={() => setSelectedVariant(v)} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedVariant === v ? 'bg-brand-600 border-brand-500 text-white shadow-lg transform scale-[1.02]' : 'bg-dark-bg border-white/10 text-gray-300 hover:border-brand-500/50'}`}>
                                                  <div className="font-bold text-sm leading-tight">{v.name}</div>
                                                  <div className="text-xs mt-1 opacity-80">Rp {v.price.toLocaleString()}</div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              )}

                              {/* Inputs */}
                              <div>
                                  <label className="block text-sm font-bold text-gray-400 mb-3">Data Akun & Catatan</label>
                                  <div className="grid grid-cols-1 gap-4">
                                      <input 
                                        placeholder="User ID / Zone ID / Nickname" 
                                        className="w-full bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all" 
                                        onChange={e => setInputFields({...inputFields, info: e.target.value})}
                                      />
                                      <textarea 
                                        placeholder="Catatan tambahan untuk admin (Opsional)..." 
                                        className="w-full bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all" 
                                        rows={2}
                                        onChange={e => setInputFields({...inputFields, note: e.target.value})}
                                      />
                                  </div>
                              </div>

                              {/* Actions */}
                              <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-3">
                                  <button onClick={handleAddToCart} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl border border-white/10 flex items-center justify-center gap-2 transition-all">
                                      <ShoppingCart size={18}/> Tambah Keranjang
                                  </button>
                                  <button onClick={handleBuyNow} className="flex-[2] bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 transition-all">
                                      Beli Sekarang <ArrowRight size={18}/>
                                  </button>
                              </div>
                         </div>
                     </div>
                </div>

                {/* RIGHT COLUMN: DESCRIPTION & REVIEWS */}
                <div className="lg:col-span-1 space-y-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
                    <div className="bg-[#1e293b] rounded-2xl p-6 border border-white/5 shadow-xl">
                          <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Info size={18} className="text-blue-400"/> Deskripsi Produk</h3>
                          <div className="prose prose-invert prose-sm text-gray-400 whitespace-pre-wrap leading-relaxed">
                              {activeProduct.description || "Tidak ada deskripsi tersedia."}
                          </div>
                    </div>
                    
                    <ReviewSection productId={activeProduct.id} currentUser={user} />
                </div>
           </div>
        </div>
      );
  }

  // SHOP CATALOG VIEW
  return (
      <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
          {/* Header & Filter Controls */}
          <div className="mb-8 space-y-4">
              <h1 className="text-3xl font-bold text-white">Katalog Produk</h1>
              
              <div className="bg-[#1e293b] p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18}/>
                      <input 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari produk..." 
                        className="w-full bg-dark-bg border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-brand-500 outline-none"
                      />
                  </div>
                  
                  {/* Category Filter */}
                  <div className="relative min-w-[150px]">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                      <select 
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full bg-dark-bg border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white appearance-none focus:border-brand-500 outline-none cursor-pointer"
                      >
                          <option value="ALL">Semua Kategori</option>
                          <option value="ITEM">Game & Items</option>
                          <option value="SERVICES">Jasa & Joki</option>
                          <option value="OTHER">Lainnya</option>
                      </select>
                  </div>

                  {/* Sort */}
                  <div className="relative min-w-[150px]">
                      <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                      <select 
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as any)}
                        className="w-full bg-dark-bg border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white appearance-none focus:border-brand-500 outline-none cursor-pointer"
                      >
                          <option value="NEWEST">Terbaru</option>
                          <option value="LOW_HIGH">Harga Terendah</option>
                          <option value="HIGH_LOW">Harga Tertinggi</option>
                      </select>
                  </div>
              </div>
          </div>

          {/* Product Grid */}
          {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">{[...Array(10)].map((_,i) => <ProductSkeleton key={i} />)}</div>
          ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 text-gray-500 bg-[#1e293b] rounded-3xl border border-white/5 border-dashed">
                  <p>Produk tidak ditemukan.</p>
              </div>
          ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredProducts.map(p => (
                      <div key={p.id} onClick={() => navigate(`/shop?product=${p.id}`)} className="cursor-pointer group bg-[#1e293b] rounded-xl overflow-hidden border border-white/5 hover:border-brand-500 transition-all shadow-lg hover:-translate-y-1">
                          <div className="aspect-video relative overflow-hidden bg-gray-800">
                              <img src={p.image || "https://picsum.photos/200"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 backdrop-blur-sm">
                                  <p className="text-white text-xs font-bold truncate">{p.name}</p>
                                  <p className="text-brand-300 text-xs font-bold">Rp {p.price.toLocaleString()}</p>
                              </div>
                              <div className="absolute top-2 right-2 bg-black/50 px-2 py-0.5 rounded text-[10px] text-white backdrop-blur-md">
                                  {p.type}
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
  );
};

export default Shop;
