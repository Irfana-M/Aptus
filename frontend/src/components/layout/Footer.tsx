export default function Footer() {
  return (
    <footer className="bg-slate-900 py-10">
      <div className="mx-auto max-w-7xl px-4 text-slate-300 lg:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Logo or Brand */}
          <h2 className="text-lg font-semibold text-white">Mentora</h2>

          {/* Links */}
          <nav className="flex gap-6 text-sm">
            <a href="#home" className="hover:text-white">
              Home
            </a>
            <a href="#why" className="hover:text-white">
              Why Us
            </a>
            <a href="#how" className="hover:text-white">
              How it works
            </a>
            <a href="#courses" className="hover:text-white">
              Courses
            </a>
            <a href="#contact" className="hover:text-white">
              Contact
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Mentora. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
