
import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storageService';
import { Product } from '../types';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { Flame, Search, ChevronRight, Gift, ShieldCheck, Zap, Gamepad2, Ticket, Smartphone, Package } from 'lucide-react';
import { ProductSkeleton } from '../components/Skeleton';

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
        // Hanya ambil produk global (admin)
        const data = await StorageService.getGlobalProducts();
        setProducts(data);
        setLoading(false);
    };
    fetchProducts();
  }, []);

  const latestProducts = products.slice(0, 8); 

  return (
    <div className="min-h-screen bg-[#0f172a] pb-20">
      {/* 1. HERO BANNER */}
      <section className="relative h-[450px] bg-[#1e293b] overflow-hidden flex items-center">
         <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-[#0f172a] to-[#0f172a] z-0"></div>
         <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600/20 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-10 right-10 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px]"></div>

         <div className="max-w-7xl mx-auto px-4 relative z-10 w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
             <div className="animate-slide-up">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-brand-300 border border-white/10 text-xs font-bold mb-6 backdrop-blur-md">
                     <ShieldCheck size={14} className="fill-current"/> TRUSTED & SAFE ONLINE STORE
                 </div>
                 <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
                     Jasa & Layanan <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">Product Digital</span>
                 </h1>
                 <p className="text-gray-400 text-lg mb-8 max-w-lg leading-relaxed">
                     Solusi produk digital buat kebutuhan harian kamu. Mulai dari voucher game, aplikasi, gift item, hingga layanan digital lainnya—semua diproses cepat dan aman.
                 </p>
                 <div className="flex gap-4">
                     <button onClick={() => navigate('/shop')} className="px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl shadow-xl shadow-brand-500/20 transition-all hover:-translate-y-1">
                         Belanja Sekarang
                     </button>
                 </div>
             </div>
             
             {/* Right Visual (Abstract App/Product Grid) */}
             <div className="hidden md:flex justify-end relative">
                 <div className="grid grid-cols-2 gap-6 transform rotate-[-6deg] hover:rotate-0 transition-transform duration-700 ease-out">
                     <div className="w-36 h-36 bg-gradient-to-br from-[#2e1065] to-[#581c87] rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center justify-center text-white transform translate-y-8 group hover:scale-105 transition-all">
                          <div className="p-3 bg-white/10 rounded-2xl mb-2 backdrop-blur-sm"><Gamepad2 size={32} className="text-purple-300"/></div>
                          <span className="font-bold text-sm">Game Item</span>
                     </div>
                     <div className="w-36 h-36 bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center justify-center text-white transform -translate-y-4 group hover:scale-105 transition-all">
                          <div className="p-3 bg-white/10 rounded-2xl mb-2 backdrop-blur-sm"><Ticket size={32} className="text-blue-300"/></div>
                          <span className="font-bold text-sm">Vouchers</span>
                     </div>
                 </div>
             </div>
         </div>
      </section>

      {/* 2. CATEGORY PILLS */}
      <div className="border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-md sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 py-4 overflow-x-auto flex gap-3 no-scrollbar justify-start md:justify-center">
              {['Semua', 'Game Items', 'Voucher', 'Premium Apps', 'Akun Game', 'Lainnya'].map((cat, idx) => (
                  <button key={idx} onClick={() => navigate('/shop')} className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 text-sm font-bold hover:bg-brand-600 hover:text-white hover:border-brand-500 transition-all whitespace-nowrap">
                      {cat}
                  </button>
              ))}
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-20">
          {/* 3. PRODUCT ITEMS SECTION */}
          <section>
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <div className="w-1 h-8 bg-brand-500 rounded-full"></div> Product Item
                  </h2>
                  <button onClick={() => navigate('/shop')} className="text-brand-400 font-bold text-sm hover:text-brand-300 flex items-center gap-1">
                      Lihat Semua <ChevronRight size={16}/>
                  </button>
              </div>
              
              {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {[...Array(5)].map((_,i) => <ProductSkeleton key={i} />)}
                  </div>
              ) : products.length === 0 ? (
                  <div className="bg-[#1e293b] p-12 rounded-2xl text-center text-gray-500 border border-white/5 border-dashed flex flex-col items-center gap-4">
                      <Package size={48} className="opacity-20"/>
                      <p>Belum ada produk Official yang dipajang saat ini.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                      {latestProducts.map(p => (
                          <ProductCard key={p.id} product={p} canBuy={true} onBuy={() => navigate(`/shop?product=${p.id}`)} />
                      ))}
                  </div>
              )}
          </section>

          {/* 4. CTA BANNER */}
          <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand-900 to-purple-900 text-center py-16 px-4 border border-white/10">
               <div className="relative z-10 flex flex-col items-center">
                   <h2 className="text-3xl font-bold text-white mb-4">Butuh Request Khusus?</h2>
                   <p className="text-gray-200 max-w-xl mx-auto mb-8 text-lg">Jika item yang kamu cari tidak ada di katalog, kamu bisa request langsung ke admin.</p>
                   <button onClick={() => navigate('/chat?type=support')} className="px-8 py-3 bg-white text-brand-900 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg">Hubungi Admin</button>
               </div>
          </section>
      </div>
    </div>
  );
};

export default Home;
