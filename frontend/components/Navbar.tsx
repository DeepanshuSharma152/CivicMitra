"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "../app/context/AuthContext";
import { ChevronDown } from "lucide-react";
import { Logo } from "./Logo";

export default function Navbar() {
  const { session, logout, isLoading } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdown(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  return (
    <nav className="w-full flex items-center justify-between border-b border-teal-800/10 px-6 py-3 bg-white/75 backdrop-blur-md sticky top-0 z-50">
      {/* Brand logo */}
      <Logo href="/" />

      {/* React Hover & Click Navigation Links */}
      <div className="hidden lg:flex items-center gap-6">
        {/* Why CivicMitra */}
        <div
          className="relative py-2"
          onMouseEnter={() => setActiveDropdown("why")}
          onMouseLeave={() => setActiveDropdown(null)}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => toggleDropdown("why")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-700 font-semibold text-sm hover:text-teal-700 hover:bg-teal-50/50 transition-all duration-200"
          >
            Why CivicMitra
            <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === "why" ? "rotate-180" : ""}`} />
          </button>
          <div
            className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200 w-72 z-50 ${
              activeDropdown === "why" ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2"
            }`}
          >
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xl p-4 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1">Overview</span>
              <Link href="/#about" className="flex flex-col px-3 py-2 rounded-xl hover:bg-teal-50 transition-colors" onClick={() => setActiveDropdown(null)}>
                <span className="text-sm font-bold text-slate-900">About CivicMitra</span>
                <span className="text-[11px] text-slate-500">Learn about our waste verification platform.</span>
              </Link>
              <Link href="/#mission" className="flex flex-col px-3 py-2 rounded-xl hover:bg-teal-50 transition-colors" onClick={() => setActiveDropdown(null)}>
                <span className="text-sm font-bold text-slate-900">Our Mission</span>
                <span className="text-[11px] text-slate-500">Building verified ground-level trust.</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Platform */}
        <div
          className="relative py-2"
          onMouseEnter={() => setActiveDropdown("platform")}
          onMouseLeave={() => setActiveDropdown(null)}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => toggleDropdown("platform")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-700 font-semibold text-sm hover:text-teal-700 hover:bg-teal-50/50 transition-all duration-200"
          >
            Platform
            <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === "platform" ? "rotate-180" : ""}`} />
          </button>
          <div
            className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200 w-72 z-50 ${
              activeDropdown === "platform" ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2"
            }`}
          >
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xl p-4 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1">Interfaces</span>
              <Link href="/citizen" className="flex flex-col px-3 py-2 rounded-xl hover:bg-teal-50 transition-colors" onClick={() => setActiveDropdown(null)}>
                <span className="text-sm font-bold text-slate-900">Citizen Portal (PWA)</span>
                <span className="text-[11px] text-slate-500">Submit and verify your segregation.</span>
              </Link>
              <Link href="/worker" className="flex flex-col px-3 py-2 rounded-xl hover:bg-teal-50 transition-colors" onClick={() => setActiveDropdown(null)}>
                <span className="text-sm font-bold text-slate-900">Worker Portal</span>
                <span className="text-[11px] text-slate-500">Validate doorstep collection event.</span>
              </Link>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mt-2 mb-1">Controls</span>
              <Link href="/#conditions" className="flex flex-col px-3 py-2 rounded-xl hover:bg-teal-50 transition-colors" onClick={() => setActiveDropdown(null)}>
                <span className="text-sm font-bold text-slate-900">Platform Operations</span>
                <span className="text-[11px] text-slate-500">Wards, route management, and review paths.</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Our Mission */}
        <div
          className="relative py-2"
          onMouseEnter={() => setActiveDropdown("mission")}
          onMouseLeave={() => setActiveDropdown(null)}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => toggleDropdown("mission")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-700 font-semibold text-sm hover:text-teal-700 hover:bg-teal-50/50 transition-all duration-200"
          >
            Our Mission
            <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === "mission" ? "rotate-180" : ""}`} />
          </button>
          <div
            className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200 w-72 z-50 ${
              activeDropdown === "mission" ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2"
            }`}
          >
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xl p-4 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1">Core Goals</span>
              <Link href="/#about" className="flex flex-col px-3 py-2 rounded-xl hover:bg-teal-50 transition-colors" onClick={() => setActiveDropdown(null)}>
                <span className="text-sm font-bold text-slate-900">Source Segregation</span>
                <span className="text-[11px] text-slate-500">Improving compliance at the source.</span>
              </Link>
              <Link href="/#about" className="flex flex-col px-3 py-2 rounded-xl hover:bg-teal-50 transition-colors" onClick={() => setActiveDropdown(null)}>
                <span className="text-sm font-bold text-slate-900">Trust & Auditability</span>
                <span className="text-[11px] text-slate-500">Creating tamper-proof evidence logs.</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div
          className="relative py-2"
          onMouseEnter={() => setActiveDropdown("resources")}
          onMouseLeave={() => setActiveDropdown(null)}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => toggleDropdown("resources")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-700 font-semibold text-sm hover:text-teal-700 hover:bg-teal-50/50 transition-all duration-200"
          >
            Resources
            <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === "resources" ? "rotate-180" : ""}`} />
          </button>
          <div
            className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200 w-72 z-50 ${
              activeDropdown === "resources" ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-2"
            }`}
          >
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xl p-4 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1">Telemetry</span>
              <Link href="/#flow" className="flex flex-col px-3 py-2 rounded-xl hover:bg-teal-50 transition-colors" onClick={() => setActiveDropdown(null)}>
                <span className="text-sm font-bold text-slate-900">Verification Flow</span>
                <span className="text-[11px] text-slate-500">The 8-step doorstep proof sequence.</span>
              </Link>
              <Link href="/#metrics" className="flex flex-col px-3 py-2 rounded-xl hover:bg-teal-50 transition-colors" onClick={() => setActiveDropdown(null)}>
                <span className="text-sm font-bold text-slate-900">Success Metrics</span>
                <span className="text-[11px] text-slate-500">Measuring city segregation telemetry.</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-3">
        {!isLoading && session ? (
          <>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-100">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              {session.name} ({session.role})
            </span>
            <button
              onClick={logout}
              className="border border-slate-200 bg-white text-slate-700 font-bold px-4 py-2 rounded-xl hover:border-teal-700 hover:text-teal-900 transition-all duration-200 text-sm shadow-sm"
            >
              Sign out
            </button>
          </>
        ) : !isLoading ? (
          <>
            <Link
              href="/login"
              className="border border-slate-200 bg-white text-slate-700 font-bold px-4 py-2 rounded-xl hover:border-teal-700 hover:text-teal-900 transition-all duration-200 text-sm shadow-sm no-underline"
              onClick={() => setActiveDropdown(null)}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              style={{ color: '#ffffff' }}
              className="bg-gradient-to-r from-teal-700 to-blue-600 !text-white font-extrabold px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-200 text-sm no-underline"
              onClick={() => setActiveDropdown(null)}
            >
              Register
            </Link>
          </>
        ) : null}
      </div>
    </nav>
  );
}
