"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Award, BarChart3, Bell, CalendarDays, CheckCircle2, ChevronRight,
  Download, Eye, Gift, Leaf, Recycle, Share2, ShieldCheck, TriangleAlert, QrCode
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { readSession } from "@/lib/session";
import type { BinColor, Submission } from "@/lib/types";

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "--";
}

function ResultMetric({ icon, label, value, detail, tone, delay }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: "emerald" | "blue" | "amber" | "violet"; delay: number }) {
  const colors = { emerald: "bg-emerald-50 text-emerald-700", blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", violet: "bg-violet-50 text-violet-700" };
  const textColors = { emerald: "text-emerald-700", blue: "text-blue-700", amber: "text-amber-700", violet: "text-violet-700" };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="p-5 text-center"
    >
      <span className={`mx-auto grid size-12 place-items-center rounded-full ${colors[tone]}`}>
        {icon}
      </span>
      <p className="mt-3 text-sm font-medium text-slate-600">{label}</p>
      <strong className="mt-2 block text-3xl font-semibold">{value}</strong>
      <p className={`mt-1 text-sm font-medium ${textColors[tone]}`}>{detail}</p>
    </motion.div>
  );
}

function ResultContent() {
  const router = useRouter();
  const [result, setResult] = useState<Submission | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const data = sessionStorage.getItem("lastSubmissionResult");
    if (data) {
      setResult(JSON.parse(data));
      // Optional: Clear it so it doesn't persist forever
      // sessionStorage.removeItem("lastSubmissionResult");
    } else {
      router.push("/citizen/submit");
    }
  }, [router]);

  if (!result) return null; // loading or redirecting

  const approved = result.status === "APPROVED";
  const qrSource = result.qrCodeBase64 ? `data:image/png;base64,${result.qrCodeBase64}` : "";
  const descriptions: Record<BinColor, string> = { GREEN: "Food scraps, vegetable peels, leaves and garden waste", BLUE: "Paper, cardboard, plastic, glass and metal", RED: "Sanitary pads, diapers, bandages and tissues", BLACK: "Batteries, e-waste, chemicals and expired medicines" };
  const binColors: Record<BinColor, string> = { GREEN: "bg-emerald-600", BLUE: "bg-sky-600", RED: "bg-rose-600", BLACK: "bg-slate-800" };

  function downloadQr() {
    if (!qrSource) return;
    const link = document.createElement("a");
    link.href = qrSource;
    link.download = `civicmitra-pickup-${result?.submissionId}.png`;
    link.click();
    setNotice("QR image downloaded.");
  }

  async function shareQr() {
    const message = `My CivicMitra pickup QR is active until ${formatDate(result?.qrExpiresAt)}.`;
    try {
      if (navigator.share) await navigator.share({ title: "CivicMitra pickup QR", text: message });
      else { await navigator.clipboard.writeText(result?.qrToken || message); setNotice("Pickup token copied to your clipboard."); }
    } catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; setNotice("Unable to share the QR from this device."); }
  }

  if (!approved) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", duration: 0.6 }}>
          <Card className="w-full max-w-xl overflow-hidden border-slate-200/60 bg-white/70 shadow-xl backdrop-blur-xl">
            <CardContent className="p-8 text-center sm:p-12">
              <motion.span 
                initial={{ rotate: -15, scale: 0.5 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
                className="mx-auto flex size-20 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-8 ring-rose-50/50"
              >
                <TriangleAlert className="size-10" />
              </motion.span>
              <h1 className="mt-8 text-3xl font-bold tracking-tight text-slate-900">
                {result.status === "PENDING_RETRY" ? "Needs Attention" : "Verification Failed"}
              </h1>
              <p className="mx-auto mt-4 max-w-md text-[16px] leading-7 text-slate-600">
                {result.failureReason || "Please review your bin photos and ensure the waste is properly segregated before trying again."}
              </p>
              
              <div className="mt-8 space-y-3">
                <Button className="h-12 w-full text-base" onClick={() => router.push("/citizen/submit")}>
                  Try Again
                </Button>
                <Button variant="ghost" className="h-12 w-full text-base" onClick={() => router.push("/dashboard")}>
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/50 text-slate-950 pb-20">
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/60 bg-white/70 px-5 backdrop-blur-md sm:px-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="size-10 rounded-full hover:bg-slate-100" aria-label="Back to dashboard">
            <ArrowLeft className="size-5 text-slate-600" />
          </Button>
          <span className="hidden items-center gap-3 sm:flex">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-sm">
              <Leaf className="size-5" />
            </span>
            <span>
              <strong className="block text-xl font-bold leading-none text-emerald-950">CivicMitra</strong>
              <small className="block pt-1 text-[11px] font-medium text-slate-500">Clean City. Better Tomorrow.</small>
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative size-10 rounded-full hover:bg-slate-100" aria-label="Notifications">
            <Bell className="size-5 text-slate-600" />
            <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">3</span>
          </Button>
          <span className="grid size-10 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 ring-2 ring-white">
            {readSession()?.name?.[0] || "C"}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_400px] lg:items-start">
          <section className="px-2 py-5 text-center lg:text-left">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 15, delay: 0.1 }}>
              <span className="mx-auto grid size-24 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 lg:mx-0">
                <CheckCircle2 className="size-12" />
              </span>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h1 className="mt-8 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                Verification <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400">successful.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
                Your waste is well segregated. Thank you for keeping your neighbourhood clean and green.
              </p>
              
              <div className="mt-8 inline-flex items-center gap-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                <div className="grid size-12 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="size-6" />
                </div>
                <div className="text-left pr-4">
                  <p className="font-semibold text-emerald-950">Submission #{result.submissionId}</p>
                  <p className="mt-0.5 text-sm font-medium text-emerald-700/80">Submitted {formatDate(result.submittedAt)}</p>
                </div>
              </div>
            </motion.div>
          </section>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
            <Card className="overflow-hidden border-slate-200/60 bg-white/80 shadow-xl backdrop-blur-xl">
              <div className="h-2 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
              <CardContent className="p-6 sm:p-8 text-center">
                <h2 className="text-xl font-bold text-slate-900">Your Green QR code</h2>
                <p className="mt-2 text-sm text-slate-500">Show this code to the sanitation worker.</p>
                
                <div className="relative mx-auto mt-8 w-full max-w-[280px]">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-emerald-200 to-emerald-100 opacity-50 blur" />
                  <img className="relative w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm" src={qrSource} alt="QR Code" />
                </div>
                
                <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  <QrCode className="size-4" />
                  Valid until {formatDate(result.qrExpiresAt)}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.section 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="mt-12 grid divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm sm:grid-cols-4 sm:divide-x sm:divide-y-0"
        >
          <ResultMetric delay={0.6} icon={<Award className="size-6" />} label="Overall score" value={`${Math.round(result.overallScore)}%`} detail="Excellent" tone="emerald" />
          <ResultMetric delay={0.7} icon={<BarChart3 className="size-6" />} label="Attempt" value={`${result.attemptNumber} / 3`} detail="Today" tone="blue" />
          <ResultMetric delay={0.8} icon={<CalendarDays className="size-6" />} label="Next pickup" value="Tomorrow" detail="7:00 AM - 9:00 AM" tone="amber" />
          <ResultMetric delay={0.9} icon={<Gift className="size-6" />} label="Rewards" value="+20" detail="Green points" tone="violet" />
        </motion.section>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
          <Card className="mt-8 overflow-hidden border-slate-200/60 bg-white shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">AI Analysis Results</h2>
                  <p className="mt-1 text-sm text-slate-500">Breakdown of your segregated waste bins.</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  <CheckCircle2 className="size-4" /> All bins passed
                </span>
              </div>

              <div className="mt-8 divide-y divide-slate-100">
                {result.binResults.map((bin, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1 + (i * 0.1) }}
                    key={bin.binType} className="flex flex-col sm:flex-row sm:items-center gap-4 py-5"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className={`grid size-12 shrink-0 place-items-center rounded-xl text-white shadow-sm ${binColors[bin.binType]}`}>
                        <Recycle className="size-6" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-base">
                          {bin.binType === "GREEN" ? "Green bin (Wet Waste)" : bin.binType === "BLUE" ? "Blue bin (Dry Waste)" : bin.binType === "RED" ? "Red bin (Sanitary)" : "Black bin (Hazardous)"}
                        </p>
                        <p className="mt-1 truncate text-sm text-slate-500">{bin.contaminationDetail || descriptions[bin.binType]}</p>
                        
                        <AnimatePresence>
                          {showDetails && (
                            <motion.p 
                              initial={{ height: 0, opacity: 0, marginTop: 0 }} 
                              animate={{ height: "auto", opacity: 1, marginTop: 8 }} 
                              exit={{ height: 0, opacity: 0, marginTop: 0 }}
                              className="text-sm font-medium text-emerald-600"
                            >
                              AI confidence: {Math.round(bin.aiConfidence * 100)}%
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    
                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-0 pt-4 sm:pt-0 mt-2 sm:mt-0 border-slate-100">
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                        Passed <CheckCircle2 className="size-4" />
                      </span>
                      <strong className="sm:mt-1.5 block text-lg text-slate-900">{Math.round(bin.aiConfidence * 100)}%</strong>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                <Button 
                  className="w-full sm:w-auto h-12 px-6 rounded-xl bg-slate-900 hover:bg-slate-800" 
                  onClick={() => setShowDetails(!showDetails)}
                >
                  <Eye className="mr-2 size-4" />
                  {showDetails ? "Hide details" : "View details"}
                </Button>
                <div className="flex w-full sm:w-auto gap-3">
                  <Button variant="outline" className="flex-1 sm:flex-none h-12 px-5 rounded-xl border-slate-200" onClick={downloadQr}>
                    <Download className="mr-2 size-4" /> Save
                  </Button>
                  <Button variant="outline" className="flex-1 sm:flex-none h-12 px-5 rounded-xl border-slate-200" onClick={shareQr}>
                    <Share2 className="mr-2 size-4" /> Share
                  </Button>
                </div>
              </div>

              {notice && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Alert className="mt-6 border-emerald-100 bg-emerald-50 text-emerald-900">
                    {notice}
                  </Alert>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-slate-50"><div className="size-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div></div>}>
      <ResultContent />
    </Suspense>
  );
}
