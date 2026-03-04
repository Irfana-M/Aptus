import React from "react";

interface BaseTopbarProps {
  onMenuToggle: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  search?: React.ReactNode;
  actions?: React.ReactNode;
  profile?: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export const BaseTopbar: React.FC<BaseTopbarProps> = ({
  onMenuToggle,
  title,
  subtitle,
  search,
  actions,
  profile,
  className = "bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm",
  sticky = true,
}) => {
  return (
    <header className={`${sticky ? "sticky top-0 z-40" : ""} px-6 py-4 flex items-center justify-between transition-all duration-200 ${className}`}>
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          {typeof title === "string" ? (
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">{title}</h1>
          ) : (
            title
          )}
          {subtitle && (
            <div className="text-sm text-gray-500 font-medium">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3 md:space-x-5">
        {search && (
          <div className="hidden md:block">
            {search}
          </div>
        )}

        <div className="flex items-center space-x-2 border-l border-gray-200 pl-2 md:pl-5">
          {actions}
        </div>

        {profile && (
          <div className="pl-2">
            {profile}
          </div>
        )}
      </div>
    </header>
  );
};
