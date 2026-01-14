
import React from 'react';
import { Product } from '../types';
import { Star, ShoppingCart, Share2, ShieldCheck, Zap } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  canBuy: boolean;
  onBuy: (product: Product) => void;
  userId?: string; 
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onBuy }) => {
  
  const handleShare = (e: React.MouseEvent) => {
      e.stopPropagation();
      const url = `${window.location.origin}/#/shop?product=${product.id}`;
      if (navigator.share) {
          navigator.share({ title: product.name, text: `Check out ${product.name} on Tamaonlyone Store!`, url: url });
      } else {
          navigator.clipboard.writeText(url);
          alert('Link produk disalin!');
      }
  };

  return (
    <div 
        onClick={() => onBuy(product)}
        className="group relative flex flex-col bg-dark-card rounded-xl overflow-hidden border border-brand-500/20 hover:border-gold-500/50 hover:shadow-xl hover:shadow-brand-500/10 transition-all cursor-pointer h-full duration-300 transform hover:-translate-y-1"
    >
      {/* Decorative Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-5 pointer-events-none"></div>

      {/* Product Image */}
      <div className="relative w-full aspect-video overflow-hidden bg-gray-800">
        <img 
            src={product.image || "https://picsum.photos/200"} 
            alt={product.name} 
            loading="lazy" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        
        {/* Flash Sale Badge */}
        {product.isFlashSale && (
            <div className="absolute top-0 left-0 bg-red-600 text-white text-[9px] font-black px-2 py-1 z-20 rounded-br-lg shadow-lg flex items-center gap-1 animate-pulse">
                <Zap size={10} fill="currentColor"/> FLASH SALE
            </div>
        )}
        
        {/* Type Badge */}
        <div className="absolute top-1 right-1 flex gap-1 z-10">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase backdrop-blur-md border border-white/10 ${
                product.type === 'SKIN' ? 'bg-purple-600/80 text-white' :
                product.type === 'JOKI' ? 'bg-orange-600/80 text-white' :
                product.type === 'REKBER' ? 'bg-green-600/80 text-white' :
                'bg-blue-600/80 text-white'
            }`}>
                {product.type}
            </span>
        </div>

        {/* Share Button (Absolute Overlay) */}
        <button onClick={handleShare} className="absolute top-8 left-1 p-1.5 bg-black/40 hover:bg-brand-600 rounded-full text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <Share2 size={12}/>
        </button>
      </div>

      {/* Info Compact */}
      <div className="p-3 flex flex-col flex-grow relative z-10">
        <h3 className="text-white font-bold text-xs md:text-sm leading-tight line-clamp-2 mb-1 min-h-[2.5em] group-hover:text-gold-400 transition-colors">
            {product.name}
        </h3>
        
        <div className="mt-auto">
            <div className="flex items-center gap-1 mb-1">
                 <p className="text-brand-400 font-extrabold text-sm md:text-base group-hover:text-brand-300">Rp {product.price.toLocaleString()}</p>
                 {product.isFlashSale && (
                     <span className="text-[9px] text-gray-500 line-through decoration-red-500">Rp {(product.price * 1.2).toLocaleString()}</span>
                 )}
            </div>
            
            {/* Seller Info Line */}
            {product.sellerName && (
                <div className="flex items-center gap-1 mb-1">
                    <span className="text-[9px] text-gray-400 truncate max-w-[80px]">{product.sellerName}</span>
                    {/* Badge Verif Oranye */}
                    {product.isVerifiedStore && (
                        <ShieldCheck size={10} className="text-orange-500 fill-current"/>
                    )}
                    {/* Level Seller */}
                    {product.sellerLevel && product.sellerLevel > 1 && (
                        <span className="text-[8px] bg-yellow-500/10 text-yellow-500 px-1 rounded border border-yellow-500/20">Lv.{product.sellerLevel}</span>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
                 <p className="text-[10px] text-gray-500 truncate max-w-[70%]">{product.category || 'General'}</p>
                 <div className="flex items-center text-[10px] text-gray-400 gap-0.5">
                     <Star size={10} className="fill-gold-500 text-gold-500"/> 5.0
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
