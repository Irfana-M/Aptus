import React from "react";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
  onLoginClick?: () => void;
  onGetStartedClick?: () => void;
}

export default function Layout({
  children,
  onLoginClick,
  onGetStartedClick,
}: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onLoginClick={onLoginClick}
        onGetStartedClick={onGetStartedClick}
      />
      <main id="content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
