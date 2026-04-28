import React from 'react';
import Skeleton from './Skeleton';

const CartItemSkeleton = () => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 sm:py-6 border-b border-gray-100 dark:border-gray-700 last:border-0 w-full">
      {/* Product Image */}
      <Skeleton className="w-24 h-24 sm:w-24 sm:h-24 aspect-square rounded-lg flex-shrink-0" />
      
      {/* Product Details */}
      <div className="flex flex-col flex-grow w-full">
        <div className="flex flex-col sm:flex-row justify-between w-full gap-2">
          {/* Title & category */}
          <div className="space-y-2 flex-grow w-full">
            <Skeleton className="h-5 w-full sm:w-48" />
            <Skeleton className="h-4 w-3/4 sm:w-32" />
          </div>
          
          {/* Price (Desktop) */}
          <Skeleton className="h-5 w-20 hidden sm:block" />
        </div>
        
        {/* Controls */}
        <div className="flex justify-between items-center mt-4 sm:mt-auto w-full">
          {/* Quantity Controls */}
          <Skeleton className="h-9 w-24 rounded-full" />
          
          {/* Price (Mobile) & Remove */}
          <div className="flex items-center gap-4 sm:gap-0">
            <Skeleton className="h-5 w-20 sm:hidden block" />
            <Skeleton className="h-8 w-8 rounded-full sm:ml-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItemSkeleton;
