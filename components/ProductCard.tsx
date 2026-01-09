
import React from 'react';
import { Product } from '../types';
import { Star, ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  canBuy: boolean;
  onBuy: (product: Product) => void;
  userId?: string; 
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onBuy }) => {
  return (
    <div 
        onClick={() => onBuy(product)}
        className="group relative flex flex-col bg-white dark:bg-[#1e293b] rounded-lg overflow-hidden border border-gray-200 dark:border-white/5 hover:border-brand-500 hover:shadow-lg transition-all cursor-pointer h-full"
    >
      {/* Product Image - Aspect Ratio Video (16:9) lebih compact */}
      <div className="relative w-full aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img 
            src={product.image || "https://picsum.photos/200"} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
        />
        
        {/* Type Badge - Small & Corner */}
        <div className="absolute top-1 right-1">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase ${
                product.type === 'SKIN' ? 'bg-purple-600 text-white' :
                product.type === 'JOKI' ? 'bg-orange-600 text-white' :
                product.type === 'REKBER' ? 'bg-green-600 text-white' :
                'bg-blue-600 text-white'
            }`}>
                {product.type}
            </span>
        </div>
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
