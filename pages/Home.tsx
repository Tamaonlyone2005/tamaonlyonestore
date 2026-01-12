
import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storageService';
import { Product, User, Feedback } from '../types';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import NewsTicker from '../components/NewsTicker';
import FlashSale from '../components/FlashSale';
import { ChevronRight, Package, Wallet, History, Gamepad2, Smartphone, Monitor, Ticket, Zap, Globe, Grid, Lock, MessageSquare, Send, Loader2 } from 'lucide-react';
import { ProductSkeleton } from '../components/Skeleton';
import { useToast } from '../components/Toast';

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Feedback Form State
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

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

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!feedbackName.trim() || !feedbackMsg.trim()) return addToast("Mohon lengkapi formulir.", "error");

      setSendingFeedback(true);
      const feedback: Feedback = {
          id: Date.now().toString(),
          name: feedbackName,
          message: feedbackMsg,
          createdAt: new Date().toISOString(),
          isRead: false
      };
      await StorageService.createFeedback(feedback);
      setSendingFeedback(false);
      setFeedbackName('');
      setFeedbackMsg('');
      addToast("Terima kasih atas saran Anda!", "success");
  };

  const latestProducts = products.slice(0, 8); 

  // Grid Menu Data with Lock Status
  const menuItems = [
      { name: 'Mobile Games', icon: Gamepad2, color: 'text-purple-400', bg: 'bg-purple-500/10', locked: true },
      { name: 'Pulsa & Data', icon: Smartphone, color: 'text-green-400', bg: 'bg-green-500/10', locked: true },
      { name: 'PC Games', icon: Monitor, color: 'text-blue-400', bg: 'bg-blue-500/10', locked: true },
      { name: 'Voucher', icon: Ticket, color: 'text-orange-400', bg: 'bg-orange-500/10', locked: true },
      { name: 'Jasa Joki', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/10', locked: true },
      { name: 'Top Up', icon: Wallet, color: 'text-pink-400', bg: 'bg-pink-500/10', locked: true },
      { name: 'Web Apps', icon: Globe, color: 'text-cyan-400', bg: 'bg-cyan-500/10', locked: true },
      { name: 'Lainnya', icon: Grid, color: 'text-gray-400', bg: 'bg-gray-500/10', locked: true },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] pb-24 md:pb-20">
      
      {/* RESTORED HERO SECTION */}
      <div className="bg-[#0f172a] relative overflow-hidden py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                  <div className="max-w-2xl animate-slide-up">
                      <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-6">
                          Selamat Datang <br/>
                          di <span className="text-brand-500">Tamaonlyone Store</span>
                      </h1>
                      <p className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-lg mb-8">
                          Pusat Top Up Game, Voucher, dan Produk Digital Terpercaya. Proses cepat, aman, dan harga bersahabat.
                      </p>
                      
                      <div className="flex gap-4">
                          <button onClick={() => navigate('/shop')} className="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 transition-all transform hover:-translate-y-1">
                              Belanja Sekarang
                          </button>
                          {!user && (
                              <button onClick={() => navigate('/register')} className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/10 transition-all opacity-50 cursor-not-allowed">
                                  Daftar Akun (Tutup)
                              </button>
                          )}
                      </div>
                  </div>

                  {/* Hero Cards Visual */}
                  <div className="hidden md:flex relative gap-6 pr-10 animate-fade-in">
                      <div className="w-48 h-64 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl shadow-2xl transform -rotate-6 hover:rotate-0 transition-all duration-500 flex flex-col items-center justify-center border border-white/10 p-4">
                          <Gamepad2 size={48} className="text-white mb-4"/>
                          <span className="font-black text-white text-lg">Game Item</span>
                          <p className="text-purple-200 text-xs text-center mt-2">Mobile Legends, PUBG, FF, Genshin</p>
                      </div>
                      <div className="w-48 h-64 bg-[#1e293b] rounded-3xl shadow-2xl transform rotate-6 translate-y-8 hover:rotate-0 hover:translate-y-4 transition-all duration-500 flex flex-col items-center justify-center border border-white/10 p-4">
                          <Ticket size={48} className="text-brand-400 mb-4"/>
                          <span className="font-black text-white text-lg">Vouchers</span>
                          <p className="text-gray-400 text-xs text-center mt-2">Diskon & Promo Harian Spesial</p>
                      </div>
                  </div>
              </div>
          </div>
          
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      </div>

      {/* News Ticker (Moved Below Hero) */}
      <NewsTicker />

      {/* ANNOUNCEMENT & FEEDBACK SECTION */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
          <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                  <div className="flex-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold mb-4">
                          <MessageSquare size={14}/> PENGUMUMAN PENGEMBANGAN
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-white mb-4">Mari Bangun Tamaonlyone Store Bersama!</h2>
                      <div className="prose prose-invert text-gray-300 leading-relaxed text-sm md:text-base space-y-4">
                          <p>
                              Halo,<br/>
                              Ini adalah website store pribadi saya. Saat ini saya sedang merencanakan pengembangan bisnis ke depannya. Melalui website ini, saya ingin mengembangkan berbagai ide bisnis online yang terinspirasi dari pengalaman hidup saya.
                          </p>
                          <p>
                              Namun, tentu tidak semua ide bisa langsung diterapkan, sehingga saya sangat membutuhkan saran dan masukan dari teman-teman untuk pengembangan website ini.
                          </p>
                          <p className="font-semibold text-white">
                              Jika teman-teman berkenan membantu, silakan berikan saran atau kritik melalui formulir yang telah disediakan. Terima kasih atas dukungannya.
                          </p>
                      </div>
                  </div>

                  {/* Feedback Form */}
                  <div className="w-full md:w-[400px] bg-black/20 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                      <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Send size={18} className="text-brand-400"/> Kirim Masukan</h3>
                      <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                          <div>
                              <input 
                                  placeholder="Nama Kamu (Boleh Samaran)" 
                                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-brand-500 outline-none transition-all placeholder:text-gray-500"
                                  value={feedbackName}
                                  onChange={e => setFeedbackName(e.target.value)}
                              />
                          </div>
                          <div>
                              <textarea 
                                  placeholder="Tulis ide, saran, atau kritikmu disini..." 
                                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-brand-500 outline-none transition-all placeholder:text-gray-500 h-32 resize-none"
                                  value={feedbackMsg}
                                  onChange={e => setFeedbackMsg(e.target.value)}
                              />
                          </div>
                          <button 
                              type="submit" 
                              disabled={sendingFeedback}
                              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          >
                              {sendingFeedback ? <Loader2 className="animate-spin" size={18}/> : 'Kirim Saran'}
                          </button>
                      </form>
                      <p className="text-[10px] text-gray-500 mt-3 text-center">Data saran bersifat rahasia dan hanya dibaca oleh Admin.</p>
                  </div>
              </div>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
          
          {/* WALLET / POINTS CARD */}
          <div className="bg-[#1e293b] rounded-3xl p-6 border border-white/5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-brand-600/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="relative z-10">
                  <p className="text-gray-400 text-sm mb-1">Total Saldo Poin</p>
                  <div className="flex items-end gap-1 mb-6">
                      <h2 className="text-4xl font-black text-white">{user ? user.points.toLocaleString() : '0'}</h2>
                      <span className="text-gray-500 font-bold mb-1">pts</span>
                  </div>
                  <div className="flex gap-4">
                      <div className="flex-1 bg-white h-12 rounded-xl flex items-center px-4">
                          <div className="w-full h-2 bg-gray-200 rounded-full animate-pulse"></div>
                      </div>
                      <button onClick={() => navigate(user ? '/profile' : '/login')} className="px-6 h-12 border border-white/10 rounded-xl text-white font-bold hover:bg-white/5 transition-colors flex items-center gap-2">
                          <History size={18}/> Riwayat
                      </button>
                  </div>
              </div>
          </div>

          {/* GRID MENU LOCKED */}
          <div className="grid grid-cols-4 gap-y-6 gap-x-4">
              {menuItems.map((item, idx) => (
                  <div key={idx} onClick={() => !item.locked && navigate('/shop')} className={`flex flex-col items-center gap-2 relative group ${item.locked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}>
                      <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform shadow-lg relative overflow-hidden`}>
                          <item.icon size={24} className={item.color} />
                          {item.locked && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <Lock size={16} className="text-white/80"/>
                              </div>
                          )}
                      </div>
                      <span className="text-[11px] text-gray-300 text-center font-medium leading-tight">{item.name}</span>
                      {item.locked && (
                          <span className="absolute -top-1 -right-1 bg-red-600 text-[8px] text-white px-1.5 py-0.5 rounded-md font-bold shadow-sm whitespace-nowrap z-10 scale-90">
                              Segera Hadir
                          </span>
                      )}
                  </div>
              ))}
          </div>

          {/* FILTER PILLS */}
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-2">
              {['Semua', 'Game Items', 'Voucher', 'Premium Apps'].map((cat, idx) => (
                  <button key={idx} onClick={() => navigate('/shop')} className="flex-shrink-0 px-5 py-2 rounded-full bg-[#1e293b] border border-white/10 text-gray-300 text-xs font-bold hover:bg-white/5 transition-all whitespace-nowrap">
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
                      Rekomendasi
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
                  <div className="bg-[#1e293b] p-8 rounded-2xl text-center text-gray-500 border border-white/5 border-dashed flex flex-col items-center gap-4">
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
