
import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-white/10 rounded-lg ${className}`}></div>
  );
};

export const ProductSkeleton: React.FC = () => {
    return (
        <div className="bg-[#1e293b] rounded-xl overflow-hidden border border-white/5">
            <Skeleton className="w-full aspect-video" />
            <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex justify-between mt-4">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-5 w-5 rounded-full" />
                </div>
            </div>
        </div>
    )
}
