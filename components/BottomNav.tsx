
import React from 'react';
import { Home, Gamepad2, ShoppingCart, User as UserIcon, Store } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { StorageService } from '../services/storageService';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = StorageService.getSession();

  const isActive = (path: string) => location.pathname === path;

  // Custom Tab Item Component
  const TabItem = ({ path, icon: Icon, label }: { path: string, icon: any, label: string }) => {
      const active = isActive(path);
      return (
        <button 
            onClick={() => navigate(path)} 
            className={`flex flex-col items-center justify-center gap-1 w-full h-full relative group transition-all duration-300 ${active ? 'text-brand-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
           <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? 'bg-brand-500/10 -translate-y-1' : ''}`}>
               <Icon size={22} strokeWidth={active ? 2.5 : 2} fill={active ? "currentColor" : "none"} className={`transition-transform ${active ? 'scale-110' : 'group-active:scale-95'}`} />
           </div>
           <span className={`text-[10px] font-bold transition-all ${active ? 'text-brand-400' : 'text-gray-500'}`}>{label}</span>
           
           {/* Active Indicator Dot */}
           {active && <div className="absolute top-1 right-1/2 translate-x-3 w-1.5 h-1.5 bg-brand-500 rounded-full shadow-[0_0_8px_rgba(14,165,233,0.8)]"></div>}
        </button>
      );
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* Floating gradient border effect */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent"></div>
        
        <div className="bg-[#0f172a]/95 backdrop-blur-xl h-[72px] pb-safe flex justify-between items-center px-2 shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
           <TabItem path="/" icon={Home} label="Home" />
           <TabItem path="/sellers" icon={Store} label="Seller" /> {/* New Seller Tab */}
           
           {/* Center Floating Button (Cart) */}
           <div className="relative -top-5">
               <button 
                onClick={() => navigate('/cart')}
                className="w-14 h-14 bg-gradient-to-tr from-brand-600 to-blue-600 rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(14,165,233,0.5)] border-4 border-[#0f172a] transform active:scale-95 transition-transform"
               >
                   <ShoppingCart size={24} fill="white" />
               </button>
           </div>

           <TabItem path="/shop" icon={Gamepad2} label="Produk" />
           
           <TabItem path="/profile" icon={UserIcon} label="Akun" />
        </div>
    </div>
  );
};

export default BottomNav;
