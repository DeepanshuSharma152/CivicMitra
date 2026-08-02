"use client";

/**
 * components/home/Navbar.tsx
 *
 * Landing-page navbar for unauthenticated visitors.
 * - Transparent initially → solid white/blur after 50px scroll
 * - Intersection Observer scroll spy for #problem, #how-it-works, #about
 * - Does NOT touch app/layout.tsx or any auth flow
 */

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Globe, ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";

const NAV_LINKS = [
  { label: "Home",         href: "/",              sectionId: null },
  { label: "The Problem",  href: "#problem",        sectionId: "problem" },
  { label: "How it Works", href: "#how-it-works",   sectionId: "how-it-works" },
  { label: "About",        href: "#about",           sectionId: "about" },
];

export function LandingNavbar() {
  const [scrolled,        setScrolled]        = useState(false);
  const [activeSection,   setActiveSection]   = useState<string | null>(null);
  const [mobileOpen,      setMobileOpen]      = useState(false);
  const [langOpen,        setLangOpen]        = useState(false);

  // ── Scroll → navbar background ───────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Intersection Observer scroll spy ─────────────────────────────
  useEffect(() => {
    const sectionIds = NAV_LINKS.map(l => l.sectionId).filter(Boolean) as string[];
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { threshold: 0.4, rootMargin: "-80px 0px -30% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach(o => o.disconnect());
  }, []);

  // Close mobile menu on outside click
  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#landing-nav")) setMobileOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const isActive = (link: typeof NAV_LINKS[0]) =>
    link.sectionId ? activeSection === link.sectionId : !activeSection;

  return (
    <header
      id="landing-nav"
      className={[
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/70"
          : "bg-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Brand */}
        <Logo href="/" />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map(link => (
            <Link
              key={link.label}
              href={link.href}
              className={[
                "relative py-1 text-sm font-semibold transition-colors duration-200",
                isActive(link)
                  ? "text-[#047857]"
                  : scrolled
                    ? "text-slate-700 hover:text-[#047857]"
                    : "text-slate-800 hover:text-[#047857]",
              ].join(" ")}
            >
              {link.label}
              {/* Active underline indicator */}
              {isActive(link) && (
                <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-[#047857]" />
              )}
            </Link>
          ))}
        </nav>

        {/* Right side: language + CTAs */}
        <div className="hidden items-center gap-3 lg:flex">
          {/* Language pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen(o => !o)}
              className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white transition-all"
            >
              <Globe className="size-3.5 text-slate-500" />
              <span>English</span>
              <ChevronDown className="size-3.5 text-slate-400" />
            </button>
          </div>

          <Link
            href="/login"
            className="rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-xs font-bold text-slate-700 hover:border-[#047857] hover:text-[#047857] transition-all"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-[#047857] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#065f46] transition-all"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(o => !o)}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-b border-slate-200 bg-white px-4 py-4 shadow-lg lg:hidden">
          <nav className="flex flex-col space-y-1 text-sm font-semibold text-slate-700">
            {NAV_LINKS.map(link => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={[
                  "px-3 py-2 rounded-lg transition-colors",
                  isActive(link)
                    ? "bg-emerald-50 text-[#047857]"
                    : "hover:bg-slate-50",
                ].join(" ")}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
            >
              Log In
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center py-2 rounded-xl bg-[#047857] text-xs font-bold text-white"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
