"use client";

import { useAuth } from "@/app/context/AuthContext";
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
      router.push("/login");
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
