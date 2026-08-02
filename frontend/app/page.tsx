/**
 * app/page.tsx — CivicMitra Homepage
 *
 * ARCHITECTURE:
 * - This file is intentionally kept thin (<80 lines of JSX).
 * - Auth/role dispatch logic is preserved exactly as before.
 * - All visual sections live in /components/home/ (client components).
 * - This file itself is a Server Component; client logic is isolated.
 *
 * DO NOT add 'use client' here — the page stays a Server Component.
 * DO NOT modify app/layout.tsx.
 */

// ── Server-safe imports (no 'use client' needed) ──────────────────────
import { Suspense } from "react";

// ── Client section imports ────────────────────────────────────────────
import { LandingNavbar       } from "@/components/home/Navbar";
import { HeroSection         } from "@/components/home/HeroSection";
import { ProblemSection      } from "@/components/home/ProblemSection";
import { HowItWorksSection   } from "@/components/home/HowItWorksSection";
import { FourBinSection      } from "@/components/home/FourBinSection";
import { ImpactSection       } from "@/components/home/ImpactSection";
import { WhoIsItForSection   } from "@/components/home/WhoIsItForSection";
import { CTASection          } from "@/components/home/CTASection";
import { Footer              } from "@/components/home/Footer";

// ── Role-based dashboard components (all client) ──────────────────────
import { HomepageAuthGate } from "@/components/home/HomepageAuthGate";

// ── Loading fallback ─────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <svg
          className="size-8 animate-spin text-[#047857]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-xs font-semibold text-slate-500">Loading CivicMitra…</p>
      </div>
    </div>
  );
}

// ── Unauthenticated landing page ─────────────────────────────────────
function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-100">
      <LandingNavbar />
      <main className="mt-[72px]">
        {/* Section 1: Hero */}
        <HeroSection />

        {/* Section 2: The Problem */}
        <ProblemSection />

        {/* Section 3: How It Works */}
        <HowItWorksSection />

        {/* Section 4: The 4-Bin System */}
        <FourBinSection />

        {/* Section 5: Impact by the Numbers */}
        <ImpactSection />

        {/* Section 6: Who Is It For */}
        <WhoIsItForSection />

        {/* Section 7: CTA Banner — final content section */}
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

// ── Root page — auth gate handles role-based dispatch ────────────────
export default function HomePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {/*
        HomepageAuthGate is a Client Component that:
        - reads the auth session (useAuth hook)
        - renders role-specific dashboards if logged in
        - renders <LandingPage /> for unauthenticated visitors
      */}
      <HomepageAuthGate landingPage={<LandingPage />} />
    </Suspense>
  );
}
