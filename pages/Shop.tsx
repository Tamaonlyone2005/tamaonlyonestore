
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { Lock, Store, ArrowRight } from 'lucide-react';

interface ShopProps {
  user: User | null;
}

const Shop: React.FC<ShopProps> = ({ user }) => {
  const navigate = useNavigate();

  // LOCKED STATE AS REQUESTED
  return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6 animate-fade-in p-8 bg-[#1e293b] rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-brand-600/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto relative">
                  <Lock size={40} className="text-gray-400" />
                  <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1.5 border-4 border-[#1e293b]">
                      <Store size={14} className="text-black fill-current"/>
                  </div>
              </div>

              <div>
                  <h1 className="text-2xl font-black text-white mb-2">Produk Sedang Maintenance</h1>
                  <p className="text-gray-400 text-sm leading-relaxed">
                      Kami sedang memperbarui tampilan dan sistem produk untuk pengalaman belanja yang lebih baik. Fitur produk dan pembelian dikunci sementara.
                  </p>
              </div>

              <div className="bg-brand-500/10 border border-brand-500/20 p-4 rounded-xl text-left flex items-start gap-3">
                  <Store size={20} className="text-brand-400 shrink-0 mt-0.5"/>
                  <div>
                      <h3 className="font-bold text-white text-sm">Cek Toko Member!</h3>
                      <p className="text-xs text-gray-400 mt-1">Kamu tetap bisa melihat daftar seller dan toko yang terdaftar di komunitas kami.</p>
                  </div>
              </div>

              <button 
                  onClick={() => navigate('/sellers')} 
                  className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                  Lihat Daftar Seller <ArrowRight size={18}/>
              </button>
          </div>
      </div>
  );
};

export default Shop;
