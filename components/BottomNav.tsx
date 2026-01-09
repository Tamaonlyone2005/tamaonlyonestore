
import React from 'react';
import { Home, Gamepad2, ShoppingCart, User as UserIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1e293b]/95 backdrop-blur-md border-t border-white/10 md:hidden flex justify-around items-center h-16 safe-area-bottom">
       <button onClick={() => navigate('/')} className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-brand-400' : 'text-gray-500'}`}>
           <Home size={22} fill={isActive('/') ? 'currentColor' : 'none'} />
           <span className="text-[10px] font-bold">Home</span>
       </button>
       <button onClick={() => navigate('/shop')} className={`flex flex-col items-center gap-1 ${isActive('/shop') ? 'text-brand-400' : 'text-gray-500'}`}>
           <Gamepad2 size={22} fill={isActive('/shop') ? 'currentColor' : 'none'} />
           <span className="text-[10px] font-bold">Shop</span>
       </button>
       <button onClick={() => navigate('/cart')} className={`flex flex-col items-center gap-1 ${isActive('/cart') ? 'text-brand-400' : 'text-gray-500'}`}>
           <ShoppingCart size={22} fill={isActive('/cart') ? 'currentColor' : 'none'} />
           <span className="text-[10px] font-bold">Cart</span>
       </button>
       <button onClick={() => navigate('/profile')} className={`flex flex-col items-center gap-1 ${isActive('/profile') ? 'text-brand-400' : 'text-gray-500'}`}>
           <UserIcon size={22} fill={isActive('/profile') ? 'currentColor' : 'none'} />
           <span className="text-[10px] font-bold">Account</span>
       </button>
    </div>
  );
};

export default BottomNav;
