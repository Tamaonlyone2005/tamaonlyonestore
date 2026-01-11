
import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storageService';
import { Product } from '../types';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import NewsTicker from '../components/NewsTicker';
import FlashSale from '../components/FlashSale';
import { ChevronRight, ShieldCheck, Gamepad2, Ticket, Package } from 'lucide-react';
import { ProductSkeleton } from '../components/Skeleton';

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
        const data = await StorageService.getGlobalProducts();
        const homeProducts = data.filter(p => !p.sellerId || p.isBoosted);
        setProducts(homeProducts);
        setLoading(false);
    };
    fetchProducts();
  }, []);

  const latestProducts = products.slice(0, 8); 

  return (
    <div className="min-h-screen bg-[#0f172a] pb-24 md:pb-20">
      <NewsTicker />

      {/* 1. HERO BANNER - WEB ONLY (Hidden on Mobile/App) */}
      <section className="hidden md:flex relative h-[450px] bg-[#1e293b] overflow-hidden items-center">
         <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-[#0f172a] to-[#0f172a] z-0"></div>
         <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600/20 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-10 right-10 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px]"></div>

         <div className="max-w-7xl mx-auto px-4 relative z-10 w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
             <div className="animate-slide-up text-left">
                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-brand-300 border border-white/10 text-xs font-bold mb-6 backdrop-blur-md">
                     <ShieldCheck size={12} className="fill-current"/> TRUSTED & SAFE
                 </div>
                 <h1 className="text-6xl font-extrabold text-white mb-6 leading-tight">
                     Layanan Product <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">Digital</span>
                 </h1>
                 <p className="text-gray-400 text-lg mb-6 max-w-lg leading-relaxed">
                     Solusi produk digital buat kebutuhan harian kamu. Mulai dari voucher game, aplikasi, gift item, hingga layanan digital lainnya—semua diproses cepat dan aman.
                 </p>
                 <button onClick={() => navigate('/shop')} className="px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl shadow-xl shadow-brand-500/20 transition-all active:scale-95 text-base">
                     Mulai Belanja
                 </button>
             </div>
             
             {/* Right Visual */}
             <div className="flex justify-end relative">
                 <div className="grid grid-cols-2 gap-6 transform rotate-[-6deg]">
                     <div className="w-36 h-36 bg-gradient-to-br from-[#2e1065] to-[#581c87] rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center justify-center text-white">
                          <Gamepad2 size={32} className="text-purple-300 mb-2"/>
                          <span className="font-bold text-sm">Game Item</span>
                     </div>
                     <div className="w-36 h-36 bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center justify-center text-white mt-8">
                          <Ticket size={32} className="text-blue-300 mb-2"/>
                          <span className="font-bold text-sm">Vouchers</span>
                     </div>
                 </div>
             </div>
         </div>
      </section>

      {/* 2. CATEGORY PILLS - NATIVE SCROLL */}
      <div className="sticky top-[60px] md:top-16 z-30 bg-[#0f172a]/90 backdrop-blur-md border-b border-white/5 py-3 md:py-4">
          <div className="max-w-7xl mx-auto px-4">
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
                  {['Semua', 'Game Items', 'Voucher', 'Premium Apps', 'Jasa Joki', 'Pulsa & Data', 'E-Wallet', 'Lainnya'].map((cat, idx) => (
                      <button key={idx} onClick={() => navigate('/shop')} className="snap-start flex-shrink-0 px-4 py-2 rounded-full bg-[#1e293b] border border-white/10 text-gray-300 text-xs md:text-sm font-bold hover:bg-brand-600 hover:text-white hover:border-brand-500 transition-all whitespace-nowrap active:bg-brand-600 active:text-white">
                          {cat}
                      </button>
                  ))}
              </div>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-12 space-y-8 md:space-y-12">
          {/* FEATURE 1: FLASH SALE SECTION */}
          <div className="animate-fade-in">
              <FlashSale />
          </div>

          {/* 3. PRODUCT ITEMS SECTION */}
          <section>
              <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
                      <div className="w-1 h-6 bg-brand-500 rounded-full"></div> Populer
                  </h2>
                  <button onClick={() => navigate('/shop')} className="text-brand-400 font-bold text-xs md:text-sm flex items-center gap-1">
                      Lihat Semua <ChevronRight size={14}/>
                  </button>
              </div>
              
              {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
                      {[...Array(5)].map((_,i) => <ProductSkeleton key={i} />)}
                  </div>
              ) : products.length === 0 ? (
                  <div className="bg-[#1e293b] p-8 md:p-12 rounded-2xl text-center text-gray-500 border border-white/5 border-dashed flex flex-col items-center gap-4">
                      <Package size={32} className="opacity-20"/>
                      <p className="text-sm">Belum ada produk Official.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
                      {latestProducts.map(p => (
                          <ProductCard key={p.id} product={p} canBuy={true} onBuy={() => navigate(`/shop?product=${p.id}`)} />
                      ))}
                  </div>
              )}
          </section>

          {/* 4. CTA BANNER */}
          <section className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-gradient-to-r from-brand-900 to-purple-900 text-center py-8 md:py-16 px-4 border border-white/10">
               <div className="relative z-10 flex flex-col items-center">
                   <h2 className="text-xl md:text-3xl font-bold text-white mb-2 md:mb-4">Butuh Bantuan?</h2>
                   <p className="text-gray-200 max-w-xl mx-auto mb-6 text-sm md:text-lg">CS kami siap membantu 24/7 jika ada kendala transaksi.</p>
                   <button onClick={() => navigate('/help')} className="px-6 py-2.5 bg-white text-brand-900 font-bold rounded-xl text-sm md:text-base hover:bg-gray-100 transition-colors shadow-lg">Hubungi CS</button>
               </div>
          </section>
      </div>
    </div>
  );
};

export default Home;
