import React from 'react';

const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded-md ${className}`}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10 animate-shimmer" />
    </div>
  );
};

export default Skeleton;
