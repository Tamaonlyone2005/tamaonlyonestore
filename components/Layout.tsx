
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, UserRole, OrderStatus } from '../types';
import { AuthService } from '../services/authService';
import { StorageService } from '../services/storageService';
import { Bell, ShoppingCart, Shield, Store, Search, Home, Gamepad2, Users, ShoppingBag } from 'lucide-react';
import { COPYRIGHT } from '../constants';
import BottomNav from './BottomNav';
import BackToTop from './BackToTop';
import { useToast } from './Toast';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  refreshSession: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, refreshSession }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [siteLogo, setSiteLogo] = useState<string>('');
  const [siteName, setSiteName] = useState<string>('Tamaonlyone Store');
  const [scrolled, setScrolled] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  useEffect(() => {
    document.documentElement.classList.add('dark');
    
    const handleScroll = () => {
        setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    const fetchProfile = async () => {
        const profile = await StorageService.getProfile();
        if (profile.avatar && !profile.avatar.includes('picsum.photos')) {
            setSiteLogo(profile.avatar);
        }
        let currentName = profile.name === 'Tamaonlyone' ? 'Tamaonlyone Store' : (profile.name || 'Tamaonlyone Store');
        setSiteName(currentName);
    };
    fetchProfile();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;
    const checkCart = async () => {
        const cart = await StorageService.getCart(user.id);
        setCartCount(cart.length);
    };
    checkCart();
    const cartInterval = setInterval(checkCart, 2000);
    const unsubscribeOrders = StorageService.subscribeToOrders((allOrders) => {
        if (user.role === UserRole.ADMIN) {
            setUnreadCount(allOrders.filter(o => o.status === OrderStatus.PENDING).length);
        } else {
            setUnreadCount(allOrders.filter(o => o.userId === user.id && (o.status === OrderStatus.PROCESSED || o.status === OrderStatus.PENDING)).length);
        }
    });
    return () => {
        clearInterval(cartInterval);
        unsubscribeOrders();
    };
  }, [user]);

  const isActive = (path: string) => location.pathname === path;
  const isAdmin = user?.role === UserRole.ADMIN;

  const renderLogoText = (name: string) => {
    if (name.includes('Store')) {
        const parts = name.split('Store');
        return <>{parts[0]}<span className="text-brand-500">Store</span>{parts.slice(1).join('Store')}</>;
    }
    return name;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-white font-sans">
      
      {/* ================= DESKTOP NAVIGATION ================= */}
      <nav className={`hidden md:block sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#1e293b]/90 backdrop-blur-md border-b border-white/5 shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
                  {siteLogo ? (
                      <img src={siteLogo} alt="Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform"/>
                  ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20">
                        {siteName.charAt(0)}
                      </div>
                  )}
                  <span className="font-extrabold text-2xl tracking-tight text-white">
                    {renderLogoText(siteName)}
                  </span>
            </Link>

            {/* Desktop Links */}
            <div className="flex items-center gap-1">
                <Link to="/" className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${isActive('/') ? 'bg-white/10 text-brand-400' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
                  <Home size={18} /> Home
                </Link>
                <Link to="/sellers" className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${isActive('/sellers') ? 'bg-white/10 text-brand-400' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
                  <Store size={18} /> Seller
                </Link>
                <Link to="/shop" className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${isActive('/shop') ? 'bg-white/10 text-brand-400' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
                  <ShoppingBag size={18} /> Produk
                </Link>
                {user && !isAdmin && (
                   <Link to="/community" className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${isActive('/community') ? 'bg-white/10 text-brand-400' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
                     <Users size={18} /> Komunitas
                   </Link>
                )}
            </div>

            {/* Desktop Actions */}
            <div className="flex items-center gap-4">
                {user ? (
                  <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                    <Link to="/cart" className="relative p-2 text-gray-300 hover:text-white transition-colors">
                        <ShoppingCart size={22} />
                        {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-600 rounded-full text-[10px] flex items-center justify-center text-white border-2 border-[#0f172a]">{cartCount}</span>}
                    </Link>

                    <div 
                        className="relative cursor-pointer p-2 text-gray-300 hover:text-white transition-colors" 
                        onClick={() => navigate(isAdmin ? '/admin' : '/profile')}
                        title={isAdmin ? "Panel Admin" : "Notifikasi"}
                    >
                        {isAdmin ? <Shield size={22} className="text-brand-400"/> : <Bell size={22} />}
                        {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white border-2 border-[#0f172a] animate-pulse">{unreadCount}</span>}
                    </div>

                    {user.isSeller && !isAdmin && (
                         <Link to="/open-store" className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 transition-all">
                            <Store size={16} /> Toko Saya
                         </Link>
                    )}

                    <div className="flex items-center gap-3 cursor-pointer pl-2" onClick={() => navigate('/profile')}>
                      <img src={user.avatar || "https://picsum.photos/32/32"} alt="Profile" className="w-10 h-10 rounded-full border-2 border-brand-500/50 object-cover"/>
                      <div className="hidden lg:block leading-tight">
                          <p className="text-sm font-bold text-white">{user.username}</p>
                          <p className="text-[10px] text-brand-400 font-mono">{isAdmin ? 'ADMIN' : `IDR ${user.points.toLocaleString()}`}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 pl-4">
                    <Link to="/login" className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-brand-500/20">Masuk</Link>
                  </div>
                )}
            </div>
          </div>
        </div>
      </nav>

      {/* ================= MOBILE HEADER ================= */}
      <div className={`md:hidden sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'bg-[#1e293b]/95 backdrop-blur-md border-b border-white/5 shadow-lg' : 'bg-[#0f172a] pt-2'}`}>
          <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                  {user ? (
                      <Link to="/profile" className="flex items-center gap-3">
                          <img src={user.avatar || "https://picsum.photos/40"} className="w-9 h-9 rounded-full border border-white/10 object-cover"/>
                          <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400">Selamat datang,</span>
                              <span className="text-sm font-bold text-white leading-none max-w-[120px] truncate">{user.username}</span>
                          </div>
                      </Link>
                  ) : (
                      <div className="flex items-center gap-2">
                           {siteLogo ? (
                              <img src={siteLogo} className="w-8 h-8 rounded-lg object-cover"/>
                          ) : (
                              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center font-bold text-white">{siteName.charAt(0)}</div>
                          )}
                          <span className="font-extrabold text-lg text-white tracking-tight">{renderLogoText(siteName)}</span>
                      </div>
                  )}
              </div>

              <div className="flex items-center gap-3">
                  <button onClick={() => navigate('/shop')} className="p-2 bg-white/5 rounded-full text-gray-300 hover:text-white">
                      <Search size={20}/>
                  </button>

                  {user ? (
                      <>
                          <Link to="/cart" className="p-2 bg-white/5 rounded-full text-gray-300 hover:text-white relative">
                              <ShoppingCart size={20}/>
                              {cartCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-600 rounded-full text-[9px] flex items-center justify-center text-white border-2 border-[#0f172a]">{cartCount}</span>}
                          </Link>
                          {isAdmin && (
                              <Link to="/admin" className="p-2 bg-brand-600/20 text-brand-400 rounded-full relative">
                                  <Shield size={20}/>
                                  {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white border-2 border-[#0f172a]">{unreadCount}</span>}
                              </Link>
                          )}
                      </>
                  ) : (
                      <Link to="/login" className="bg-brand-600 text-white px-4 py-1.5 rounded-full text-xs font-bold">
                          Masuk
                      </Link>
                  )}
              </div>
          </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-[100vw] overflow-x-hidden pb-24 md:pb-0">
        {children}
      </main>

      {/* ================= DESKTOP FOOTER (Cleaned & Updated) ================= */}
      <footer className="hidden md:block bg-[#0b1120] border-t border-white/5 py-12 mt-12 w-full">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand Column */}
          <div className="col-span-1">
              <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center font-bold text-white">{siteName.charAt(0)}</div>
                  <span className="font-bold text-xl text-white">{renderLogoText(siteName)}</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">Platform top up game dan produk digital terpercaya dengan proses otomatis 24 jam.</p>
          </div>
          
          {/* Navigation Column */}
          <div>
              <h4 className="font-bold text-white mb-6">Navigasi Utama</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                  <li><Link to="/" className="hover:text-brand-400 transition-colors">Halaman Depan</Link></li>
                  <li><Link to="/shop" className="hover:text-brand-400 transition-colors">Semua Produk</Link></li>
                  <li><Link to="/sellers" className="hover:text-brand-400 transition-colors">Cari Toko Member</Link></li>
              </ul>
          </div>

          {/* Support Column */}
          <div>
              <h4 className="font-bold text-white mb-6">Bantuan & Legal</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                  <li><Link to="/help" className="hover:text-brand-400 transition-colors">Pusat Bantuan (FAQ)</Link></li>
                  <li><Link to="/feedback" className="hover:text-brand-400 transition-colors text-brand-400 font-bold">Kirim Masukan / Saran</Link></li>
                  <li><span className="hover:text-brand-400 cursor-pointer">Syarat & Ketentuan</span></li>
                  <li><span className="hover:text-brand-400 cursor-pointer">Kebijakan Privasi</span></li>
              </ul>
          </div>
        </div>
        <div className="text-center mt-12 pt-8 border-t border-white/5">
            <p className="text-gray-500 text-sm font-serif italic tracking-wide">
               ©2026 Dominic Studio | Tamaonlyone All Rights Reserved
            </p>
        </div>
      </footer>

      <BackToTop />
      
      {/* Mobile Bottom Navigation - Visible ONLY on Mobile */}
      <BottomNav />
    </div>
  );
};

export default Layout;
