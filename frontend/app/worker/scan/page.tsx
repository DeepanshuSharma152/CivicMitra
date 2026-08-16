import { Suspense } from "react";
import { WorkerScan } from "@/components/worker-scan";

export default function WorkerScanPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-slate-950"><div className="size-8 animate-spin rounded-full border-4 border-emerald-800 border-t-emerald-400" /></div>}>
      <WorkerScan />
    </Suspense>
  );
}
