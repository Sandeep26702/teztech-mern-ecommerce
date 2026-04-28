import React from 'react';
import Skeleton from './Skeleton';

const ProductDetailSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Column - Image Section */}
        <div className="space-y-4 w-full">
          {/* Main Image */}
          <Skeleton className="w-full aspect-square md:aspect-[4/5] rounded-2xl" />
          
          {/* Thumbnails */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            <Skeleton className="w-full aspect-square rounded-xl" />
            <Skeleton className="w-full aspect-square rounded-xl" />
            <Skeleton className="w-full aspect-square rounded-xl" />
            <Skeleton className="w-full aspect-square rounded-xl" />
          </div>
        </div>

        {/* Right Column - Details Section */}
        <div className="flex flex-col space-y-6 w-full">
          {/* Breadcrumbs or small tag */}
          <Skeleton className="h-4 w-24 rounded-full" />
          
          {/* Title */}
          <div className="space-y-3 w-full">
            <Skeleton className="h-8 sm:h-10 w-full" />
            <Skeleton className="h-8 sm:h-10 w-3/4" />
          </div>

          {/* Reviews/Rating */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-24" />
          </div>

          {/* Price */}
          <Skeleton className="h-8 w-1/3" />

          {/* Description */}
          <div className="space-y-2 pt-4 w-full">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>

          {/* Quantity and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 w-full">
            {/* Quantity Selector */}
            <Skeleton className="h-12 w-full sm:w-32 rounded-lg" />
            {/* Add to Cart Button */}
            <Skeleton className="h-12 w-full sm:flex-1 rounded-lg" />
            {/* Wishlist Button */}
            <Skeleton className="h-12 w-12 rounded-lg hidden sm:block" />
          </div>

          {/* Additional Info / Meta */}
          <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-700 w-full">
            <div className="flex gap-4 items-center">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="flex gap-4 items-center">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;
