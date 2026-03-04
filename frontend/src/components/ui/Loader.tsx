import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
  text?: string;
  fullPage?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  color = 'border-teal-500',
  className = '',
  text,
  fullPage = false
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
    xl: 'w-24 h-24 border-[6px]'
  };

  const loaderContent = (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <div className="relative">
        {/* Track */}
        <div className={`${sizeClasses[size]} rounded-full border-gray-100 opacity-20`}></div>
        
        {/* Spinner */}
        <div
          className={`absolute inset-0 ${sizeClasses[size]} border-t-transparent border-solid rounded-full animate-spin ${color} shadow-[0_0_15px_rgba(20,184,166,0.3)]`}
          role="status"
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>
      
      {text && (
        <p className="mt-6 text-slate-600 font-semibold tracking-wide animate-pulse uppercase text-xs">
          {text}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-xl animate-in fade-in duration-500">
        <div className="bg-white/40 p-8 rounded-3xl shadow-2xl border border-white/20 backdrop-blur-md">
           {loaderContent}
        </div>
      </div>
    );
  }

  return loaderContent;
};
