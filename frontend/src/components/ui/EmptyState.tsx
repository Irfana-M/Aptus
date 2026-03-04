import React from 'react';
import { type LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-8 text-center bg-gradient-to-b from-slate-50 to-white rounded-3xl border border-slate-100 shadow-sm animate-in fade-in zoom-in-95 duration-700 ${className}`}>
      <div className="mb-6 p-6 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 relative group transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        <div className="absolute inset-0 bg-teal-500/5 rounded-2xl blur-xl group-hover:bg-teal-500/10 transition-colors"></div>
        <Icon className="w-12 h-12 text-teal-600 relative z-10" />
      </div>
      
      <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h3>
      <p className="mt-3 text-slate-500 max-w-sm mx-auto leading-relaxed">{description}</p>
      
      {actionLabel && onAction && (
        <div className="mt-8">
          <button
            onClick={onAction}
            className="px-6 py-3 bg-teal-600 text-white rounded-2xl text-sm font-bold hover:bg-teal-700 hover:-translate-y-0.5 transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(20,184,166,0.4)] active:scale-95"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};
