
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
        className="group relative flex flex-col bg-white dark:bg-[#1e293b] rounded-lg overflow-hidden border border-gray-200 dark:border-white/5 hover:border-brand-500 hover:shadow-lg transition-all cursor-pointer h-full"
    >
      {/* Product Image */}
      <div className="relative w-full aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img 
            src={product.image || "https://picsum.photos/200"} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
        />
        
        {/* Type Badge */}
        <div className="absolute top-1 right-1 flex gap-1">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase ${
                product.type === 'SKIN' ? 'bg-purple-600 text-white' :
                product.type === 'JOKI' ? 'bg-orange-600 text-white' :
                product.type === 'REKBER' ? 'bg-green-600 text-white' :
                'bg-blue-600 text-white'
            }`}>
                {product.type}
            </span>
        </div>

        {/* Share Button (Absolute Overlay) */}
        <button onClick={handleShare} className="absolute top-1 left-1 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <Share2 size={12}/>
        </button>
      </div>

      {/* Info Compact */}
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="text-gray-900 dark:text-white font-medium text-xs md:text-sm leading-tight line-clamp-2 mb-1 min-h-[2.5em] group-hover:text-brand-500 transition-colors">
            {product.name}
        </h3>
        
        <div className="mt-auto">
            <div className="flex items-center gap-1 mb-1">
                 <p className="text-brand-600 dark:text-brand-400 font-bold text-sm md:text-base">Rp {product.price.toLocaleString()}</p>
            </div>
            
            {/* Seller Info Line */}
            {product.sellerName && (
                <div className="flex items-center gap-1 mb-1">
                    <span className="text-[9px] text-gray-500 truncate max-w-[80px]">{product.sellerName}</span>
                    {/* Badge Verif Oranye */}
                    {product.isVerifiedStore && (
                        <ShieldCheck size={10} className="text-orange-500 fill-current"/>
                    )}
                    {/* Level Seller */}
                    {product.sellerLevel && product.sellerLevel > 1 && (
                        <span className="text-[8px] bg-yellow-500/20 text-yellow-500 px-1 rounded border border-yellow-500/30">Lv.{product.sellerLevel}</span>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between">
                 <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[70%]">{product.category || 'General'}</p>
                 <div className="flex items-center text-[10px] text-gray-400 gap-0.5">
                     <Star size={10} className="fill-yellow-400 text-yellow-400"/> 5.0
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
