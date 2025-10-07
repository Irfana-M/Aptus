import * as React from "react";
import Logo from "./logo";
import { NAV_ITEMS } from "../../config/nav";
import { Button } from "../ui/Button";
import { Menu, X } from "lucide-react";


export default function Header() {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  // add shadow & backdrop when scrolling
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close mobile menu when resizing to desktop
  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // smooth-scroll for hash links
  const handleNavClick = (href: string) => (e: React.MouseEvent) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    setOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={[
        "sticky top-0 z-50 w-full transition",
        "backdrop-blur bg-white/70",
        scrolled ? "shadow-md" : "shadow-none",
      ].join(" ")}
      aria-label="Primary"
    >
      {/* Skip link for accessibility */}
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2
                   rounded-md bg-blue-600 px-3 py-2 text-white"
      >
        Skip to content
      </a>

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
        {/* Left: Logo */}
        <a href="/" aria-label="Mentora Home" className="flex items-center">
          <Logo />
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={handleNavClick(item.href)}
                  className="text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right: CTAs (Desktop) */}
        <div className="hidden items-center gap-3 lg:flex">
          <Button variant="ghost">Sign in</Button>
          <Button variant="primary">Get Started</Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="inline-flex items-center justify-center rounded-xl p-2 lg:hidden
                     hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-blue-600"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((s) => !s)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={[
          "lg:hidden transition-[max-height] overflow-hidden",
          open ? "max-h-[420px]" : "max-h-0",
        ].join(" ")}
      >
        <nav className="border-t border-slate-200">
          <ul className="flex flex-col gap-1 p-3">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={handleNavClick(item.href)}
                  className="block rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="mt-1 flex gap-2 px-3">
              <Button className="w-full" variant="ghost">
                Sign in
              </Button>
              <Button className="w-full" variant="primary">
                Get Started
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
