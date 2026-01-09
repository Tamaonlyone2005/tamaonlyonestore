
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, UserRole, OrderStatus } from '../types';
import { AuthService } from '../services/authService';
import { StorageService } from '../services/storageService';
import { Menu, X, User as UserIcon, LogOut, Shield, MessageCircle, Bell, Gamepad2, Home, Search, ShoppingCart, Users, Store, Globe } from 'lucide-react';
import { APP_NAME, COPYRIGHT } from '../constants';
import BottomNav from './BottomNav';
import BackToTop from './BackToTop';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  refreshSession: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, refreshSession }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [siteLogo, setSiteLogo] = useState<string>('');
  const [siteName, setSiteName] = useState<string>('Tamaonlyone Store');
  
  // Language State
  const [lang, setLang] = useState<'ID' | 'EN'>('ID');
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.add('dark');
    
    // Load Site Config
    const fetchProfile = async () => {
        const profile = await StorageService.getProfile();
        if (profile.avatar && !profile.avatar.includes('picsum.photos')) {
            setSiteLogo(profile.avatar);
        }
        let currentName = profile.name === 'Tamaonlyone' ? 'Tamaonlyone Store' : (profile.name || 'Tamaonlyone Store');
        setSiteName(currentName);
        document.title = currentName;
    };
    fetchProfile();
  }, [location.pathname]);

  // REAL-TIME NOTIFICATIONS
  useEffect(() => {
    if (!user) return;

    // Cart Check
    const checkCart = async () => {
        const cart = await StorageService.getCart(user.id);
        setCartCount(cart.length);
    };
    checkCart();
    const cartInterval = setInterval(checkCart, 2000);

    // Order Notifications
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

  const handleLogout = () => {
    AuthService.logout();
    refreshSession();
    navigate('/');
  };

  const handleCsClick = () => {
     if(!user) navigate('/login'); else navigate('/chat?type=support');
  };
  
  const toggleLanguage = () => {
      setLang(prev => prev === 'ID' ? 'EN' : 'ID');
  };

  const isActive = (path: string) => location.pathname === path;

  const renderLogoText = (name: string) => {
    if (name.includes('Store')) {
        const parts = name.split('Store');
        return <>{parts[0]}<span className="text-brand-500">Store</span>{parts.slice(1).join('Store')}</>;
    }
    return name;
  };

  // Translations Map (Simple)
  const t = {
      home: lang === 'ID' ? 'Home' : 'Home',
      product: lang === 'ID' ? 'Produk' : 'Shop',
      community: lang === 'ID' ? 'Komunitas' : 'Community',
      store: lang === 'ID' ? 'Toko Saya' : 'My Store',
      panel: lang === 'ID' ? 'Panel' : 'Admin',
      login: lang === 'ID' ? 'Masuk' : 'Login',
      signup: lang === 'ID' ? 'Daftar' : 'Sign Up'
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-white selection:bg-brand-500 selection:text-white font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#1e293b]/90 backdrop-blur-md border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-2 group">
                  {siteLogo ? (
                      <img src={siteLogo} alt="Logo" className="w-9 h-9 rounded-lg object-cover shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform"/>
                  ) : (
                      <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
                        {siteName.charAt(0)}
                      </div>
                  )}
                  <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-gray-200 transition-colors">
                    {renderLogoText(siteName)}
                  </span>
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-1 items-center">
                <Link to="/" className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${isActive('/') ? 'bg-white/10 text-brand-400' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
                  <Home size={18} /> {t.home}
                </Link>
                <Link to="/shop" className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${isActive('/shop') ? 'bg-white/10 text-brand-400' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
                  <Gamepad2 size={18} /> {t.product}
                </Link>
                
                {user && user.role !== UserRole.ADMIN && (
                   <Link to="/community" className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${isActive('/community') ? 'bg-white/10 text-brand-400' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
                     <Users size={18} /> {t.community}
                   </Link>
                )}
                
                {/* Language Switcher */}
                <button onClick={toggleLanguage} className="ml-2 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold flex items-center gap-2 text-gray-300 border border-white/5">
                    <Globe size={14}/> {lang}
                </button>

                {user ? (
                  <div className="flex items-center gap-4 ml-6 pl-6 border-l border-white/10">
                    <Link to="/cart" className="relative group cursor-pointer text-gray-300 hover:text-white p-2">
                        <ShoppingCart size={20} />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-600 rounded-full text-[10px] flex items-center justify-center text-white border border-dark-bg">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    <div className="relative group cursor-pointer" onClick={() => user.role === UserRole.ADMIN ? navigate('/admin') : navigate('/profile')}>
                        <Bell size={20} className="text-gray-300 group-hover:text-white" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white border border-dark-bg animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </div>
                    
                    {/* Seller Menu */}
                    {user.isSeller && (
                         <Link to="/open-store" className="text-brand-400 hover:text-white flex items-center gap-1 font-bold text-sm bg-brand-500/10 px-3 py-1.5 rounded-lg border border-brand-500/20">
                            <Store size={16} /> {t.store}
                         </Link>
                    )}

                    {user.role === UserRole.ADMIN && (
                      <Link to="/admin" className="text-gray-300 hover:text-brand-400 flex items-center gap-1 font-bold text-sm">
                        <Shield size={16} /> {t.panel}
                      </Link>
                    )}
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/profile')}>
                      <img src={user.avatar || "https://picsum.photos/32/32"} alt="Profile" className="w-9 h-9 rounded-full border-2 border-brand-500/50 object-cover"/>
                      <div className="hidden lg:block leading-tight">
                          <p className="text-sm font-bold text-white">{user.username}</p>
                          <p className="text-[10px] text-brand-400 font-mono">{user.role === UserRole.ADMIN ? 'ADMIN' : `IDR ${user.points.toLocaleString()}`}</p>
                      </div>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-400 transition-colors"><LogOut size={20} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 ml-6">
                     <Link to="/login" className="text-gray-300 hover:text-white font-bold text-sm">{t.login}</Link>
                    <Link to="/register" className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-lg shadow-brand-500/25">{t.signup}</Link>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="-mr-2 flex md:hidden items-center gap-4">
                <button onClick={toggleLanguage} className="px-2 py-1 rounded bg-white/5 text-[10px] font-bold text-gray-300 border border-white/5">
                    {lang}
                </button>
                {user && (
                    <Link to="/cart" className="relative p-2 text-gray-300">
                        <ShoppingCart size={24} />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-600 rounded-full text-[10px] flex items-center justify-center text-white border border-dark-bg">{cartCount}</span>
                        )}
                    </Link>
                )}
               <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#1e293b] border-b border-white/10 animate-slide-up">
            <div className="px-4 pt-2 pb-4 space-y-2">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-bold text-white hover:bg-white/5">{t.home}</Link>
              <Link to="/shop" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-bold text-white hover:bg-white/5">{t.product}</Link>
              {user && user.role !== UserRole.ADMIN && (
                   <Link to="/community" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-bold text-white hover:bg-white/5">{t.community}</Link>
              )}
              
              {user?.isSeller && (
                  <Link to="/open-store" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-bold text-brand-400 hover:bg-white/5">{t.store}</Link>
              )}
              
              {user?.role === UserRole.ADMIN && <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-bold text-brand-400 hover:bg-white/5">Admin Panel</Link>}
              
              {user ? (
                <>
                  <div className="border-t border-white/10 my-2 pt-2">
                      <div className="flex items-center gap-3 px-3 py-2">
                          <img src={user.avatar} className="w-8 h-8 rounded-full"/>
                          <div>
                              <div className="text-white font-bold">{user.username}</div>
                              <div className="text-brand-400 text-xs">IDR {user.points.toLocaleString()}</div>
                          </div>
                      </div>
                  </div>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-bold text-white hover:bg-white/5">My Account</Link>
                  <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="w-full text-left block px-3 py-2 rounded-md text-base font-bold text-red-400 hover:bg-white/5">Logout</button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block text-center px-3 py-2 rounded-lg text-sm font-bold bg-white/5 text-white">{t.login}</Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)} className="block text-center px-3 py-2 rounded-lg text-sm font-bold bg-brand-600 text-white">{t.signup}</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Content */}
      <main className="flex-grow w-full max-w-[100vw] overflow-x-hidden pb-16 md:pb-0">
        {children}
      </main>

      <footer className="bg-[#0b1120] border-t border-white/5 py-10 mt-12 w-full mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                  {siteLogo ? (
                      <img src={siteLogo} alt="Logo" className="w-8 h-8 rounded-lg object-cover"/>
                  ) : (
                      <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center font-bold text-white">{siteName.charAt(0)}</div>
                  )}
                  <span className="font-bold text-xl text-white">{renderLogoText(siteName)}</span>
              </div>
              <p className="text-gray-500 text-sm">The most trusted digital store for your daily needs. Fast, secure, and reliable.</p>
          </div>
          <div>
              <h4 className="font-bold text-white mb-4">Payment Methods</h4>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <span className="px-3 py-1 bg-white/5 rounded text-xs text-gray-400">QRIS</span>
                  <span className="px-3 py-1 bg-white/5 rounded text-xs text-gray-400">BCA</span>
                  <span className="px-3 py-1 bg-white/5 rounded text-xs text-gray-400">E-Wallet</span>
              </div>
          </div>
          <div>
              <h4 className="font-bold text-white mb-4">Support</h4>
              <p className="text-gray-500 text-sm mb-2">Operational Hours: 09:00 - 22:00 WIB</p>
              <button onClick={handleCsClick} className="text-brand-400 text-sm font-bold hover:underline">Contact Support</button>
          </div>
        </div>
        <div className="text-center mt-10 pt-6 border-t border-white/5">
            <p className="text-gray-600 text-xs">{COPYRIGHT}</p>
        </div>
      </footer>

      {/* CS Button */}
      <button onClick={handleCsClick} className="fixed bottom-20 md:bottom-6 right-6 z-50 p-4 bg-green-600 hover:bg-green-500 text-white rounded-full shadow-lg hover:scale-110 transition-all border-4 border-[#0f172a]">
        <MessageCircle size={26} />
      </button>

      {/* Tombol Back to Top baru */}
      <BackToTop />

      <BottomNav />
    </div>
  );
};

export default Layout;
