/**
 * components/home/Footer.tsx
 * Landing page footer — Server Component, no interactivity needed.
 */

import Link from "next/link";
import { Logo } from "@/components/Logo";

const NAV_LINKS = [
  { label: "Home",          href: "/" },
  { label: "The Problem",   href: "#problem" },
  { label: "How it Works",  href: "#how-it-works" },
  { label: "About",         href: "#about" },
  { label: "Login",         href: "/login" },
];

export function Footer() {
  return (
    <footer
      className="border-t border-white/10 py-12"
      style={{ background: "#0F172A" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between">

          {/* Left — Logo + tagline */}
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <Logo href="/" className="[&_span:first-child]:text-white [&_span:last-child]:text-white/50" />
          </div>

          {/* Center — Nav links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-sm text-white/60 transition-colors hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right — Copyright */}
          <p className="text-sm text-white/40 text-center sm:text-right">
            © {new Date().getFullYear()} CivicMitra.<br className="hidden sm:inline" />
            Built for Chandigarh.
          </p>

        </div>
      </div>
    </footer>
  );
}
