import React from "react";

interface BaseSidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: string | number;
  disabled?: boolean;
  activeClassName?: string;
  inactiveClassName?: string;
  disabledClassName?: string;
  showIndicator?: boolean;
}

export const BaseSidebarItem: React.FC<BaseSidebarItemProps> = ({
  icon,
  label,
  isActive,
  onClick,
  badge,
  disabled = false,
  activeClassName = "bg-white/10 text-white shadow-lg backdrop-blur-sm border border-white/10",
  inactiveClassName = "text-cyan-50 hover:bg-white/5 hover:text-white",
  disabledClassName = "text-cyan-200/40 cursor-not-allowed",
  showIndicator = true,
}) => {
  return (
    <button
      onClick={() => !disabled && onClick()}
      disabled={disabled}
      className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
        isActive
          ? activeClassName
          : disabled
            ? disabledClassName
            : inactiveClassName
      }`}
    >
      {isActive && showIndicator && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-300 rounded-full" />
      )}

      {disabled && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-200/30">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      <div className="flex items-center space-x-3 z-10">
        <div
          className={`transition-transform duration-300 ${
            isActive
              ? "scale-110 text-cyan-200"
              : disabled
                ? "opacity-40"
                : "group-hover:scale-110 group-hover:text-cyan-200"
          }`}
        >
          {icon}
        </div>
        <span className={`font-medium tracking-wide ${isActive ? "font-semibold" : ""} ${disabled ? "opacity-60" : ""}`}>
          {label}
        </span>
      </div>

      {badge && !disabled && (
        <span className="bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md z-10">
          {badge}
        </span>
      )}
    </button>
  );
};
