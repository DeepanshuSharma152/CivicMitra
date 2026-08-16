"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
// Rule 1: Updated context import to app/_context/ (private directory)
import { useAuth } from "@/app/_context/AuthContext";
import { ChevronDown, LogOut, ShieldCheck, User } from "lucide-react";
import { Logo } from "./Logo";

export default function Navbar() {
  const { session, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const role = session?.role || null;
  const userInitial = session?.name?.[0]?.toUpperCase() || "U";
  const fullName = session?.name || "User";

  const getHomePath = () => {
    if (!role) return "/";
    if (role === "CITIZEN") return "/dashboard";
    if (role === "WORKER") return "/worker";
    if (role === "AUTHORITY") return "/authority/reports";
    return "/";
  };

  const isHomeActive = () => {
    if (!role) return pathname === "/";
    return pathname === getHomePath();
  };

  const isHowItWorksActive = () => {
    return pathname === "/how-it-works";
  };

  const isAboutActive = () => {
    return pathname === "/#about" || pathname === "/about";
  };

  const getLinkClasses = (active: boolean) => {
    return `text-sm font-bold transition-all duration-200 ${
      active
        ? "text-emerald-700 underline underline-offset-8 decoration-2 decoration-emerald-600"
        : "text-slate-700 hover:text-emerald-700 hover:underline underline-offset-8 decoration-2 decoration-emerald-600"
    }`;
  };

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowUserDropdown(false);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  return (
    <nav className="w-full flex items-center justify-between border-b border-slate-200/80 px-6 py-3 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-2xs">
      <div className="flex items-center gap-12">
        {/* Brand Logo */}
        <Logo href="/" />

        {/* Unified Navigation Links (Home, How it works, About) */}
        <div className="hidden lg:flex items-center gap-8">
          <Link href={getHomePath()} className={getLinkClasses(isHomeActive())}>
            Home
          </Link>
          <Link href="/how-it-works" className={getLinkClasses(isHowItWorksActive())}>
            How it works
          </Link>
          <Link href="/#about" className={getLinkClasses(isAboutActive())}>
            About
          </Link>
        </div>
      </div>

      {/* User Actions & Auth Profile */}
      <div className="flex items-center gap-3">
        {!isLoading && session ? (
          /* Profile Avatar with Dynamic First Letter Initial */
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 py-1 px-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <div className="size-8 rounded-full bg-emerald-700 text-white font-black flex items-center justify-center text-xs shadow-xs">
                {userInitial}
              </div>
              <span className="hidden md:block text-xs font-bold text-slate-800 pr-1">
                {fullName}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Signed in as</p>
                  <p className="text-xs font-bold text-slate-900 truncate">{session.email || session.name}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-extrabold uppercase border border-emerald-100">
                    {session.role}
                  </span>
                </div>

                <Link
                  href={role === "CITIZEN" ? "/dashboard" : "/authority/reports"}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <User size={14} className="text-slate-500" /> Account Dashboard
                </Link>

                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : !isLoading ? (
          /* Visitor Log In & Sign Up Buttons */
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="border border-slate-200 bg-white text-slate-700 font-bold px-4 py-2 rounded-xl hover:border-emerald-600 hover:text-emerald-700 transition-all text-xs shadow-2xs"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all text-xs"
            >
              Sign up
            </Link>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
