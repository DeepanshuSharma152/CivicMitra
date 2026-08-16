"use client";

// Rule 1: Updated context import to app/_context/ (private directory)
import { useAuth } from "@/app/_context/AuthContext";
import { CitizenDashboard } from "@/components/citizen-dashboard";
import { WorkerScan } from "@/components/worker-scan";
import { AuthorityReports } from "@/components/authority-reports";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      // Rule 6: Use router.replace() for auth redirects, never router.push()
      router.replace("/login");
    }
  }, [session, isLoading, router]);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-[#047857]" />
          <p className="text-xs font-semibold text-slate-500">Loading your portal dashboard…</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // ── Role-Based Dashboard Dispatching ──────────────────────────────────────
  if (session.role === "WORKER") {
    return <WorkerScan />;
  }

  if (session.role === "AUTHORITY" || session.role === "MUNICIPAL_ADMIN") {
    return <AuthorityReports />;
  }

  // Default: Citizen Dashboard
  return <CitizenDashboard />;
}
