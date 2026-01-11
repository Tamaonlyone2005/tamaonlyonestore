
import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storageService';
import { Product, User } from '../types';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import NewsTicker from '../components/NewsTicker';
import FlashSale from '../components/FlashSale';
import { ChevronRight, ShieldCheck, Gamepad2, Ticket, Package, Zap, Smartphone, Monitor, Globe, Wallet, Plus } from 'lucide-react';
import { ProductSkeleton } from '../components/Skeleton';

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
        const session = StorageService.getSession();
        setUser(session);
        const data = await StorageService.getGlobalProducts();
        const homeProducts = data.filter(p => !p.sellerId || p.isBoosted);
        setProducts(homeProducts);
        setLoading(false);
    };
    init();
  }, []);

  const latestProducts = products.slice(0, 8); 

  // Quick Menu Icons for Mobile App Feel
  const quickMenus = [
      { label: 'Mobile Games', icon: Gamepad2, color: 'bg-purple-500', filter: 'ITEM' },
      { label: 'Pulsa & Data', icon: Smartphone, color: 'bg-green-500', filter: 'VOUCHER' },
      { label: 'PC Games', icon: Monitor, color: 'bg-blue-500', filter: 'ITEM' },
      { label: 'Voucher', icon: Ticket, color: 'bg-orange-500', filter: 'VOUCHER' },
      { label: 'Jasa Joki', icon: Zap, color: 'bg-yellow-500', filter: 'JOKI' },
      { label: 'Top Up', icon: Wallet, color: 'bg-pink-500', filter: 'OTHER' },
      { label: 'Web Apps', icon: Globe, color: 'bg-cyan-500', filter: 'OTHER' },
      { label: 'Lainnya', icon: Package, color: 'bg-gray-500', filter: 'ALL' },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] pb-24 md:pb-20">
      
      {/* --- WEB COMPONENT: NEWS TICKER (Hidden on Mobile) --- */}
      <div className="hidden md:block">
        <NewsTicker />
      </div>

      {/* =================================================================================
          1. WEB VIEW (DESKTOP) - Banner Besar & Deskripsi (Reverted to Original)
         ================================================================================= */}
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
                     Selamat Datang di <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-300">Tamaonlyone Store</span>
                 </h1>
                 <p className="text-gray-400 text-lg mb-6 max-w-lg leading-relaxed">
                     Pusat Top Up Game, Voucher, dan Produk Digital Terpercaya. Proses cepat, aman, dan harga bersahabat.
                 </p>
                 <button onClick={() => navigate('/shop')} className="px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl shadow-xl shadow-brand-500/20 transition-all active:scale-95 text-base">
                     Mulai Belanja
                 </button>
             </div>
             
             {/* Right Visual for Web */}
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

      {/* =================================================================================
          2. MOBILE APP VIEW - Wallet Card & Quick Menu (Super-App Style)
          Ini HANYA muncul di HP. Menggantikan Banner Besar.
         ================================================================================= */}
      <section className="md:hidden px-4 pt-4 pb-2 animate-fade-in">
          {/* A. Wallet / Info Card */}
          <div className="bg-gradient-to-r from-brand-700 to-blue-800 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden mb-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              <div className="flex justify-between items-start relative z-10">
                  <div>
                      <p className="text-brand-100 text-xs mb-1">Total Saldo Poin</p>
                      <h3 className="text-2xl font-black">{user ? user.points.toLocaleString() : '0'} <span className="text-xs font-normal opacity-70">pts</span></h3>
                  </div>
                  <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors" onClick={() => navigate('/profile')}>
                      <Wallet size={20} className="text-white"/>
                  </div>
              </div>

              {/* Action Buttons inside Card */}
              <div className="mt-4 flex gap-3">
                  <button onClick={() => navigate('/shop')} className="flex-1 bg-white text-brand-700 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform">
                      <Plus size={14}/> Top Up
                  </button>
                  <button onClick={() => navigate('/shop')} className="flex-1 bg-brand-800/50 text-white py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border border-white/10 active:scale-95 transition-transform">
                      Riwayat
                  </button>
              </div>
          </div>

          {/* B. Quick Menu Grid (App Icons) */}
          <div className="grid grid-cols-4 gap-y-4 gap-x-2 mb-2">
              {quickMenus.map((menu, idx) => (
                  <div key={idx} onClick={() => navigate('/shop')} className="flex flex-col items-center gap-2 cursor-pointer group">
                      <div className={`${menu.color} p-3 rounded-[18px] shadow-lg text-white group-active:scale-90 transition-transform`}>
                          <menu.icon size={20} />
                      </div>
                      <span className="text-[10px] text-gray-300 font-medium text-center leading-tight">{menu.label}</span>
                  </div>
              ))}
          </div>
      </section>

      {/* 3. CATEGORY PILLS (Sticky) - Optimized for both */}
      <div className="sticky top-[60px] md:top-16 z-30 bg-[#0f172a]/95 backdrop-blur-md border-b border-white/5 py-3 md:py-4">
          <div className="max-w-7xl mx-auto px-4">
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x">
                  {['Semua', 'Game Items', 'Voucher', 'Premium Apps', 'Jasa Joki', 'Pulsa & Data', 'E-Wallet', 'Lainnya'].map((cat, idx) => (
                      <button key={idx} onClick={() => navigate('/shop')} className="snap-start flex-shrink-0 px-4 py-1.5 md:py-2 rounded-full bg-[#1e293b] border border-white/10 text-gray-300 text-xs md:text-sm font-bold hover:bg-brand-600 hover:text-white hover:border-brand-500 transition-all whitespace-nowrap active:bg-brand-600 active:text-white">
                          {cat}
                      </button>
                  ))}
              </div>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-12 space-y-8 md:space-y-12">
          {/* FEATURE: FLASH SALE */}
          <div className="animate-fade-in">
              <FlashSale />
          </div>

          {/* PRODUCT LIST */}
          <section>
              <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h2 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
                      <div className="w-1 h-5 md:h-6 bg-brand-500 rounded-full"></div> Rekomendasi
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

          {/* CTA BANNER (Footer Banner) */}
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
