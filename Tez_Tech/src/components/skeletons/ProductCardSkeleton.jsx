import React from 'react';
import Skeleton from './Skeleton';

const ProductCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col w-full">
      {/* Image Placeholder */}
      <Skeleton className="w-full aspect-[4/5] sm:aspect-square md:aspect-[4/5] object-cover rounded-none" />
      
      <div className="p-4 flex flex-col flex-grow">
        {/* Title Placeholder */}
        <Skeleton className="h-5 w-3/4 mb-2" />
        
        {/* Rating/Reviews Placeholder */}
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
        
        {/* Price and Button Placeholder */}
        <div className="mt-auto flex justify-between items-center pt-3">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-10 w-10 sm:w-28 sm:h-10 rounded-lg sm:rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
