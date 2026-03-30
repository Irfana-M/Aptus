import React from 'react';

interface ClassroomLayoutProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  mainContent: React.ReactNode;
  rightPanel: React.ReactNode;
}

export const ClassroomLayout: React.FC<ClassroomLayoutProps> = ({
  sidebar,
  header,
  mainContent,
  rightPanel,
}) => {
  return (
    <div className="flex h-screen w-full bg-[#E5F3F3] overflow-hidden font-sans">
      {/* Left Sidebar */}
      {sidebar && (
        <aside className="hidden lg:block w-64 flex-shrink-0 bg-white shadow-sm z-20">
          {sidebar}
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 flex-shrink-0 px-4 lg:px-8 flex items-center justify-between">
          {header}
        </header>

        <main className="flex-1 overflow-hidden flex flex-col">
          {mainContent}
        </main>
      </div>

      {/* Right Sidebar */}
      <aside className="hidden xl:block w-80 flex-shrink-0 bg-white shadow-[-4px_0_15px_rgba(0,0,0,0.05)] z-20">
        {rightPanel}
      </aside>
    </div>
  );
};
