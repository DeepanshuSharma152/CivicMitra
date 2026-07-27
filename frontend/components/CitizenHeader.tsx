"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bell,
  ChevronDown,
  House,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuth } from "../app/context/AuthContext";
import type { Profile } from "@/lib/types";

interface CitizenHeaderProps {
  activeTab?: "dashboard" | "submit" | "submissions" | "tokens" | "schedule" | "rewards" | "grievances";
  profile?: Profile | null;
  onOpenHouseholdSetup?: () => void;
}

export function CitizenHeader({ activeTab = "dashboard", profile, onOpenHouseholdSetup }: CitizenHeaderProps) {
  const { session, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const fullName = profile?.name || session?.name || "";
  const names = fullName.trim().split(" ");
  const initials = names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : names[0][0]?.toUpperCase() || "U";

  const navLinks = [
    { label: "Dashboard", href: "/dashboard", key: "dashboard" },
    { label: "Submit Waste", href: "/citizen/submit", key: "submit" },
    { label: "My Submissions", href: "/dashboard#submissions", key: "submissions" },
    { label: "My QR Tokens", href: "/dashboard#pass", key: "tokens" },
    { label: "Collection Schedule", href: "/dashboard#collection", key: "schedule" },
    { label: "Rewards & Badges", href: "/dashboard#rewards", key: "rewards" },
    { label: "Grievances", href: "/grievances", key: "grievances" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Brand Logo */}
        <Logo href="/" />

        {/* Center Desktop Navigation Links (Clean Text Links without icons matching screenshot) */}
        <nav className="hidden xl:flex items-center gap-6 lg:gap-8 h-full">
          {navLinks.map((link) => {
            const isActive = activeTab === link.key;
            return (
              <Link
                key={link.key}
                href={link.href}
                className={`relative flex items-center h-full text-xs font-semibold tracking-tight transition-colors ${
                  isActive
                    ? "text-[#059669] font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#059669] rounded-t-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Controls (Bell + Avatar + Mobile Toggle) */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button
            className="relative size-9 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            <span className="absolute top-0.5 right-0.5 flex size-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
              3
            </span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 py-1 px-1.5 sm:px-2 rounded-full border border-slate-200/80 hover:bg-slate-50 transition-colors"
            >
              <div className="size-8 rounded-full bg-[#064e3b] text-white flex items-center justify-center text-xs font-bold shadow-2xs shrink-0">
                {initials}
              </div>
              <div className="hidden md:flex flex-col text-left leading-tight pr-1">
                <span className="text-xs font-bold text-slate-800">{fullName}</span>
                <span className="text-[10px] text-slate-500 font-medium">Citizen Account</span>
              </div>
              <ChevronDown className="size-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Signed in as</p>
                  <p className="text-xs font-bold text-slate-900 truncate">{profile?.email || session?.email || ""}</p>
                </div>
                {onOpenHouseholdSetup && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenHouseholdSetup();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2"
                  >
                    <House className="size-4" /> My Household
                  </button>
                )}
                <button
                  onClick={() => {
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <LogOut className="size-4" /> Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="xl:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {showMobileMenu ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Drawer / Navigation Menu */}
      {showMobileMenu && (
        <div className="xl:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = activeTab === link.key;
              return (
                <Link
                  key={link.key}
                  href={link.href}
                  onClick={() => setShowMobileMenu(false)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
                    isActive
                      ? "bg-emerald-50 text-[#059669] font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && <span className="size-2 rounded-full bg-[#059669]" />}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
