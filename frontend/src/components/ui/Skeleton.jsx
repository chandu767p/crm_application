import React from 'react';

const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md ${className}`}
      {...props}
    />
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full space-y-3">
      {/* Header Skeleton */}
      <div className="flex gap-4 mb-6">
        {[...Array(cols)].map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows Skeleton */}
      {[...Array(rows)].map((_, i) => (
        <div key={`r-${i}`} className="flex gap-4 py-3 border-b border-gray-100 dark:border-gray-800">
          {[...Array(cols)].map((_, j) => (
            <Skeleton key={`c-${j}`} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton = () => (
  <div className="p-4 border rounded-xl space-y-3 dark:border-gray-800">
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-1/2" />
    <div className="flex justify-between pt-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  </div>
);

export default Skeleton;
