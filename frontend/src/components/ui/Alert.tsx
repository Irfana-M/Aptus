import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  message,
  onClose,
  className = ''
}) => {
  const variants = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      text: 'text-emerald-900',
      accent: 'bg-emerald-500',
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />
    },
    error: {
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      text: 'text-rose-900',
      accent: 'bg-rose-500',
      icon: <XCircle className="w-5 h-5 text-rose-500" />
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      text: 'text-amber-900',
      accent: 'bg-amber-500',
      icon: <AlertCircle className="w-5 h-5 text-amber-500" />
    },
    info: {
      bg: 'bg-sky-50',
      border: 'border-sky-100',
      text: 'text-sky-900',
      accent: 'bg-sky-500',
      icon: <Info className="w-5 h-5 text-sky-500" />
    }
  };

  const style = variants[variant];

  return (
    <div className={`relative flex items-start p-5 rounded-2xl border ${style.bg} ${style.border} shadow-sm animate-in slide-in-from-top-2 duration-300 ${className}`} role="alert">
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 rounded-r-full ${style.accent}`} />
      
      <div className="flex-shrink-0 mr-4">
        {style.icon}
      </div>
      
      <div className={`flex-1 ${style.text}`}>
        {title && <h4 className="text-sm font-bold mb-1 tracking-tight">{title}</h4>}
        <div className="text-sm font-medium opacity-80 leading-relaxed">{message}</div>
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className={`ml-auto -mr-2 -mt-2 p-2 rounded-xl transition-all duration-200 hover:bg-white/50 active:scale-90 ${style.text}`}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
