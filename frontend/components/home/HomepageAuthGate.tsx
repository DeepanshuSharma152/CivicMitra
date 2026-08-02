"use client";

/**
 * components/home/HomepageAuthGate.tsx
 *
 * Isolated Client Component for auth-based routing on the homepage.
 * Extracted from app/page.tsx so page.tsx stays a Server Component.
 *
 * Logic (preserved exactly from original page.tsx):
 * 1. While loading → show spinner
 * 2. Authenticated WORKER → WorkerScan
 * 3. Authenticated AUTHORITY / MUNICIPAL_ADMIN → AuthorityReports
 * 4. Authenticated CITIZEN (or other) → CitizenDashboard
 * 5. Unauthenticated → landingPage prop
 */

import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/app/_context/AuthContext";
import { CitizenDashboard } from "@/components/citizen-dashboard";
import { WorkerScan } from "@/components/worker-scan";
import { AuthorityReports } from "@/components/authority-reports";

interface HomepageAuthGateProps {
  landingPage: ReactNode;
}

export function HomepageAuthGate({ landingPage }: HomepageAuthGateProps) {
  const { session, isLoading } = useAuth();

  // 1. Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-[#047857]" />
          <p className="text-xs font-semibold text-slate-500">Loading CivicMitra…</p>
        </div>
      </div>
    );
  }

  // 2–4. Authenticated: role-based dispatch (preserved from original)
  if (session) {
    if (session.role === "WORKER") return <WorkerScan />;
    if (session.role === "AUTHORITY" || session.role === "MUNICIPAL_ADMIN") {
      return <AuthorityReports />;
    }
    return <CitizenDashboard />;
  }

  // 5. Unauthenticated visitor → render landing page
  return <>{landingPage}</>;
}
