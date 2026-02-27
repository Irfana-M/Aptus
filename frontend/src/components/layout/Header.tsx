import * as React from "react";
import Logo from "./logo";
import { NAV_ITEMS } from "../../config/nav";
import { Button } from "../ui/Button";
import { Menu, X, User, LogOut, Settings } from "lucide-react";
import { NotificationBell } from "../common/NotificationBell";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState, AppDispatch } from "../../app/store";
import { fetchMentorProfile } from "../../features/mentor/mentorThunk";
import { fetchStudentProfile } from "../../features/student/studentThunk";
import { logoutUser } from "../../features/auth/authThunks";

interface HeaderProps {
  onLoginClick?: () => void;
  onGetStartedClick?: () => void;
}

export default function Header({
  onLoginClick,
  onGetStartedClick,
}: HeaderProps) {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { user } = useSelector((state: RootState) => state.auth);
  const { profile: mentorProfile } = useSelector((state: RootState) => state.mentor);
  const { profile: studentProfile } = useSelector((state: RootState) => state.student);

  // Fetch profile if authenticated but profile missing
  React.useEffect(() => {
    if (user) {
      if (user.role === 'mentor' && !mentorProfile) {
        dispatch(fetchMentorProfile());
      } else if (user.role === 'student' && !studentProfile) {
        dispatch(fetchStudentProfile());
      }
    }
  }, [user, mentorProfile, studentProfile, dispatch]);

  // Determine the correct profile image based on role and available data
  const getProfileImage = () => {
    if (user?.role === "mentor") {
      return mentorProfile?.profileImageUrl || (user?.profilePicture?.startsWith('http') ? user.profilePicture : undefined);
    }
    if (user?.role === "student") {
      return studentProfile?.profileImageUrl || (user?.profilePicture?.startsWith('http') ? user.profilePicture : undefined);
    }
    return null;
  };
  
  const profileImageUrl = getProfileImage();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".user-menu")) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavClick = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate(href);
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    setIsUserMenuOpen(false);
    navigate("/login");
  };

  const handleProfileClick = () => {
    setIsUserMenuOpen(false);
    if (user?.role === "mentor") {
      navigate("/mentor/dashboard");
    } else if (user?.role === "student") {
      navigate("/student/dashboard");
    } else {
      navigate("/login");
    }
  };

  const userNavigation = [
    { name: "Your Dashboard", onClick: handleProfileClick, icon: User },
    { name: "Settings", onClick: () => navigate("/settings"), icon: Settings },
    { name: "Sign out", onClick: handleLogout, icon: LogOut },
  ];

  const getUserDisplayName = () => {
    if (user?.role === "mentor" && mentorProfile?.fullName) return mentorProfile.fullName;
    if (user?.role === "student" && studentProfile?.fullName) return studentProfile.fullName;
    if (user?.fullName) return user.fullName;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  const getInitials = () => {
    const name = getUserDisplayName();
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2
                   rounded-md bg-[rgb(73,187,189)] px-3 py-2 text-white"
      >
        Skip to content
      </a>

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
        {/* Left: Logo */}
        <a href="/" aria-label="Aptus Home" className="flex items-center">
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
                  className="text-sm font-medium text-slate-700 hover:text-[rgb(73,187,189)] transition-colors cursor-pointer"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right: CTAs (Desktop) */}
        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              {/* Notification Bell */}
              <NotificationBell />

              {/* User Menu */}
              <div className="relative user-menu">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt={getUserDisplayName()}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-[rgb(73,187,189)] rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {getInitials()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-700">
                    {getUserDisplayName()}
                  </span>
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1">
                    {userNavigation.map((item) => (
                      <button
                        key={item.name}
                        onClick={item.onClick}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left"
                      >
                        <item.icon className="w-4 h-4" />
                        {item.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={onLoginClick}>
                Sign in
              </Button>
              <Button variant="primary" onClick={onGetStartedClick}>
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="inline-flex items-center justify-center rounded-xl p-2 lg:hidden
                     hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-[rgb(73,187,189)]"
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
                  className="block rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
            {user ? (
              <>
                <li className="px-3 py-2 text-sm text-slate-600 border-t border-slate-200 mt-2 pt-2">
                  Welcome, {getUserDisplayName()}!
                </li>
                {userNavigation.map((item) => (
                  <li key={item.name}>
                    <button
                      onClick={item.onClick}
                      className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100 transition-colors text-left"
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </button>
                  </li>
                ))}
              </>
            ) : (
              <li className="mt-1 flex gap-2 px-3">
                <Button
                  className="w-full"
                  variant="ghost"
                  onClick={onLoginClick}
                >
                  Sign in
                </Button>
                <Button
                  className="w-full"
                  variant="primary"
                  onClick={onGetStartedClick}
                >
                  Get Started
                </Button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
