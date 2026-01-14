
import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storageService';
import { Product, User, UserRole } from '../types';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import NewsTicker from '../components/NewsTicker';
import FlashSale from '../components/FlashSale';
import RamadanCalendar from '../components/RamadanCalendar';
import { ChevronRight, Package, Wallet, History, Gamepad2, Smartphone, Monitor, Ticket, Zap, Globe, Grid, Lock, Crown, Gift, Moon, Star } from 'lucide-react';
import { ProductSkeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useToast();

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

  const latestProducts = products.slice(0, 10); 

  // Modern Grid Menu Data with Gradient Backgrounds
  const menuItems = [
      { name: 'Mobile Games', icon: Gamepad2, gradient: 'from-purple-500 to-indigo-600', shadow: 'shadow-purple-500/40' },
      { name: 'Pulsa & Data', icon: Smartphone, gradient: 'from-green-500 to-emerald-600', shadow: 'shadow-green-500/40' },
      { name: 'PC Games', icon: Monitor, gradient: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/40' },
      { name: 'Voucher', icon: Ticket, gradient: 'from-orange-500 to-red-600', shadow: 'shadow-orange-500/40' },
      { name: 'Jasa Joki', icon: Zap, gradient: 'from-yellow-400 to-amber-600', shadow: 'shadow-yellow-500/40', path: '/joki' },
      { name: 'Top Up', icon: Wallet, gradient: 'from-pink-500 to-rose-600', shadow: 'shadow-pink-500/40' },
      { name: 'Web Apps', icon: Globe, gradient: 'from-cyan-500 to-sky-600', shadow: 'shadow-cyan-500/40' },
      { name: 'Lainnya', icon: Grid, gradient: 'from-gray-500 to-slate-600', shadow: 'shadow-gray-500/40' },
  ];

  const handleMenuClick = (item: any) => {
      if (item.path) {
          navigate(item.path);
      } else if (user?.role === UserRole.ADMIN) {
          addToast(`Admin Access: Membuka fitur ${item.name}`, "success");
          navigate('/shop'); // Placeholder for now, or route to generic shop category
      } else {
          addToast(`Fitur ${item.name} akan segera hadir!`, "info");
      }
  };

  return (
    <div className="min-h-screen bg-dark-bg pb-24 md:pb-20">
      
      {/* HERO SECTION - RAMADAN EDITION */}
      <div className="bg-dark-bg relative overflow-hidden py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                  <div className="max-w-2xl animate-slide-up">
                      {/* Greeting */}
                      <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20">
                          <Moon size={14} className="text-gold-400 fill-current"/>
                          <span className="text-brand-400 text-xs font-bold tracking-wide uppercase">Ramadhan 1447 H</span>
                      </div>
                      <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-6 drop-shadow-lg">
                          Marhaban Ya <br/>
                          <span className="text-brand-500">Ramadhan 2026</span>
                      </h1>
                      <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-lg mb-8 font-light">
                          Rayakan kemenangan dengan skin favorit & voucher game termurah. Promo berkah menantimu setiap hari.
                      </p>
                      
                      <div className="flex gap-4">
                          <button onClick={() => navigate('/shop')} className="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 transition-all transform hover:-translate-y-1">
                              Belanja Sekarang
                          </button>
                          {!user && (
                              <button onClick={() => navigate('/register')} className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/10 transition-all">
                                  Daftar Akun
                              </button>
                          )}
                      </div>
                  </div>

                  {/* Hero Cards Visual with Ramadan Touches */}
                  <div className="hidden md:flex relative gap-6 pr-10 animate-fade-in">
                      {/* Lantern Decoration */}
                      <div className="absolute -top-10 left-10 text-gold-500 animate-float opacity-80" style={{ animationDelay: '1s' }}>
                          <div className="w-1 h-20 bg-gold-600 mx-auto"></div>
                          <div className="w-8 h-10 bg-gold-400 rounded-lg shadow-lg shadow-gold-400/50"></div>
                      </div>

                      <div className="w-48 h-64 bg-gradient-to-br from-brand-700 to-brand-900 rounded-3xl shadow-2xl transform -rotate-6 hover:rotate-0 transition-all duration-500 flex flex-col items-center justify-center border border-white/10 p-4 relative overflow-hidden">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
                          <Gamepad2 size={48} className="text-white mb-4 relative z-10"/>
                          <span className="font-black text-white text-lg relative z-10">Berkah Gaming</span>
                          <p className="text-brand-200 text-xs text-center mt-2 relative z-10">Mobile Legends, PUBG, FF</p>
                      </div>
                      <div className="w-48 h-64 bg-dark-card rounded-3xl shadow-2xl transform rotate-6 translate-y-8 hover:rotate-0 hover:translate-y-4 transition-all duration-500 flex flex-col items-center justify-center border border-white/10 p-4 relative overflow-hidden">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10"></div>
                          <Ticket size={48} className="text-gold-400 mb-4 relative z-10"/>
                          <span className="font-black text-white text-lg relative z-10">THR Voucher</span>
                          <p className="text-gray-400 text-xs text-center mt-2 relative z-10">Diskon Spesial Sahur</p>
                      </div>
                  </div>
              </div>
          </div>
          
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      </div>

      {/* News Ticker */}
      <NewsTicker />

      <div className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
          
          {/* REDESIGNED WALLET / POINTS CARD */}
          {user && (
              <div className="bg-gradient-to-br from-dark-card to-dark-bg rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden animate-fade-in group">
                  {/* Background Accents */}
                  <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-gradient-to-b from-brand-500/20 to-transparent rounded-full blur-[80px] group-hover:blur-[100px] transition-all duration-700 pointer-events-none"></div>
                  
                  <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                                  <Wallet size={14} className="text-brand-400"/> Saldo Poin Saya
                              </p>
                              <div className="flex items-baseline gap-1">
                                  <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                                      {user.points.toLocaleString()}
                                  </h2>
                                  <span className="text-brand-500 font-bold text-lg">pts</span>
                              </div>
                          </div>
                          
                          {/* Member Badge */}
                          <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">
                              <span className={`text-[10px] font-bold flex items-center gap-1.5 ${
                                  user.vipLevel !== 'NONE' ? 'text-gold-400' : 'text-gray-300'
                              }`}>
                                  <Crown size={12} className="fill-current"/> 
                                  {user.vipLevel !== 'NONE' ? user.vipLevel : 'MEMBER'}
                              </span>
                          </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                           <button 
                              onClick={() => navigate('/shop?category=Voucher')}
                              className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-brand-500/20 active:scale-95 border border-transparent"
                           >
                               <Ticket size={18}/> Klaim Voucher
                           </button>
                           <button 
                              onClick={() => navigate('/profile')}
                              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white py-3 rounded-xl font-bold text-sm transition-all border border-white/10 active:scale-95"
                           >
                               <History size={18}/> Riwayat
                           </button>
                      </div>
                  </div>
              </div>
          )}

          {/* RAMADAN CALENDAR */}
          <RamadanCalendar />

          {/* GRID MENU - MODERNIZED */}
          <div className="grid grid-cols-4 gap-y-6 gap-x-4">
              {menuItems.map((item, idx) => (
                  <div key={idx} onClick={() => handleMenuClick(item)} className="flex flex-col items-center gap-2 relative group cursor-pointer opacity-95 hover:opacity-100 transition-all hover:scale-105">
                      <div className={`w-14 h-14 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center shadow-lg ${item.shadow} relative overflow-hidden ring-2 ring-white/5 group-hover:ring-white/20 transition-all`}>
                          <item.icon size={26} className="text-white drop-shadow-md" />
                          
                          {/* Inner Shine */}
                          <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 pointer-events-none"></div>

                          {!item.path && user?.role !== UserRole.ADMIN && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px]">
                                  <Lock size={14} className="text-white"/>
                              </div>
                          )}
                          {!item.path && user?.role === UserRole.ADMIN && (
                              <div className="absolute top-1 right-1">
                                  <span className="block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              </div>
                          )}
                      </div>
                      <span className="text-[11px] text-gray-300 text-center font-bold leading-tight group-hover:text-white transition-colors">{item.name}</span>
                  </div>
              ))}
          </div>

          {/* FILTER PILLS */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-2">
              {['Semua', 'Game Items', 'Voucher', 'Premium Apps'].map((cat, idx) => (
                  <button key={idx} onClick={() => navigate('/shop')} className="flex-shrink-0 px-5 py-2 rounded-full bg-dark-card border border-white/10 text-gray-300 text-xs font-bold hover:bg-white/5 transition-all whitespace-nowrap hover:border-brand-500/50 hover:text-white">
                      {cat}
                  </button>
              ))}
          </div>

          {/* FLASH SALE */}
          <div className="animate-fade-in pt-4">
              <FlashSale />
          </div>

          {/* RECOMMENDATION LIST */}
          <section>
              <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      Rekomendasi Sahur
                  </h2>
                  <button onClick={() => navigate('/shop')} className="text-brand-400 font-bold text-xs flex items-center gap-1">
                      Lihat Semua <ChevronRight size={14}/>
                  </button>
              </div>
              
              {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {[...Array(4)].map((_,i) => <ProductSkeleton key={i} />)}
                  </div>
              ) : products.length === 0 ? (
                  <div className="bg-dark-card p-8 rounded-2xl text-center text-gray-500 border border-white/5 border-dashed flex flex-col items-center gap-4">
                      <Package size={32} className="opacity-20"/>
                      <p className="text-sm">Belum ada produk.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {latestProducts.map(p => (
                          <ProductCard key={p.id} product={p} canBuy={true} onBuy={() => navigate(`/shop?product=${p.id}`)} />
                      ))}
                  </div>
              )}
          </section>
      </div>
    </div>
  );
};

export default Home;
