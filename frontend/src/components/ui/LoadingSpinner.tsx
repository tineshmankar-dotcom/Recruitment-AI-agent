import React from 'react';

export function LoadingSpinner({ size = 'md', text = 'Loading...' }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className={`animate-spin rounded-full border-indigo-600 border-t-transparent ${sizeClasses[size]}`} />
      {text && <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">{text}</p>}
    </div>
  );
}
