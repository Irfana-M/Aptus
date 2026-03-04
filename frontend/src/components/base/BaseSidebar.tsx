import React from "react";

interface BaseSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
}

export const BaseSidebar: React.FC<BaseSidebarProps> = ({
  isOpen,
  onClose,
  header,
  footer,
  children,
  className = "bg-gradient-to-b from-cyan-600 to-teal-700",
  overlayClassName = "bg-black bg-opacity-50",
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className={`lg:hidden fixed inset-0 z-40 ${overlayClassName}`}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out flex flex-col h-full shadow-xl ${className}`}
      >
        <div className="flex flex-col h-full">
          {/* Header Section */}
          {header && (
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              {header}
            </div>
          )}

          {/* Navigation/Content Section */}
          <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
            {children}
          </nav>

          {/* Footer Section */}
          {footer && (
            <div className="p-4 border-t border-white/10">
              {footer}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
