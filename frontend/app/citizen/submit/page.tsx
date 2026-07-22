"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Bell, CalendarDays, Camera, CheckCircle2, ChevronRight,
  CircleAlert, ClipboardCheck, Gift, HelpCircle, House, Leaf,
  LocateFixed, LockKeyhole, QrCode, Recycle, RefreshCw, Send,
  Settings, ShieldCheck, Sparkles, Trash2, TriangleAlert, UserRound
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { readSession } from "@/lib/session";
import type { BinColor, Profile } from "@/lib/types";

const bins: { type: BinColor; title: string; detail: string; contents: string; required: boolean; tone: string; border: string }[] = [
  { type: "GREEN", title: "GREEN BIN", detail: "Wet / Organic Waste", contents: "Food scraps, vegetable peels, leaves, garden waste", required: true, tone: "bg-emerald-500 shadow-emerald-500/30", border: "border-emerald-500/40" },
  { type: "BLUE", title: "BLUE BIN", detail: "Dry Recyclables", contents: "Paper, cardboard, plastic, glass, metal", required: true, tone: "bg-sky-500 shadow-sky-500/30", border: "border-sky-500/40" },
  { type: "RED", title: "RED BIN", detail: "Sanitary Waste", contents: "Sanitary pads, diapers, bandages, tissues", required: true, tone: "bg-rose-500 shadow-rose-500/30", border: "border-rose-500/40" },
  { type: "BLACK", title: "BLACK BIN", detail: "Hazardous Waste", contents: "Batteries, e-waste, chemicals, expired medicines", required: false, tone: "bg-slate-800 shadow-slate-800/30", border: "border-slate-800/40" }
];
type PhotoMap = Record<BinColor, File[]>;
const emptyPhotos = (): PhotoMap => ({ GREEN: [], BLUE: [], RED: [], BLACK: [] });

function CaptureSidebar({ profile }: { profile: Profile | null }) {
  return (
    <aside className="hidden border-r border-slate-200/60 bg-white/50 backdrop-blur-md px-4 py-8 lg:flex lg:flex-col">
      <Link href="/dashboard" className="mb-12 flex items-center gap-3 px-3 transition-transform hover:scale-[1.02]">
        <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-sm">
          <Leaf className="size-6" />
        </span>
        <span>
          <strong className="block text-[27px] font-bold leading-none text-emerald-950 tracking-tight">CivicMitra</strong>
          <small className="mt-1 block text-[11px] font-medium text-slate-500">Clean City. Better Tomorrow.</small>
        </span>
      </Link>
      <nav className="grid gap-1.5">
        <CaptureLink href="/dashboard" icon={<House />}>Dashboard</CaptureLink>
        <CaptureLink href="/citizen/submit" icon={<ClipboardCheck />} active>Submit Waste</CaptureLink>
        <CaptureLink href="/dashboard#submissions" icon={<Recycle />}>My Submissions</CaptureLink>
        <CaptureLink href="/dashboard#pass" icon={<QrCode />}>My QR Tokens</CaptureLink>
        <CaptureLink href="/dashboard#collection" icon={<CalendarDays />}>Collection Schedule</CaptureLink>
        <CaptureLink href="/dashboard#rewards" icon={<Gift />}>Rewards & Badges</CaptureLink>
        <CaptureLink href="/dashboard" icon={<House />}>My Household</CaptureLink>
        <CaptureLink href="/grievances" icon={<CircleAlert />}>Grievances</CaptureLink>
        <CaptureLink href="#help" icon={<HelpCircle />}>Help & Support</CaptureLink>
        <CaptureLink href="#settings" icon={<Settings />}>Settings</CaptureLink>
      </nav>
      <Card className="mt-auto border-emerald-100 bg-emerald-50/50 shadow-sm backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-emerald-800">Trust Score</p>
              <strong className="text-2xl text-emerald-950">--<small className="text-sm font-medium text-emerald-600/70">/100</small></strong>
            </div>
          </div>
          <p className="mt-3 text-[12px] font-medium text-emerald-700/80">Build your score with verified checks.</p>
        </CardContent>
      </Card>
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white p-3 shadow-sm">
        <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-[14px] font-bold text-emerald-800">
          {profile?.name?.[0] || "C"}
        </span>
        <span className="flex-1 min-w-0">
          <strong className="block truncate text-[14px]">{profile?.name || "Citizen"}</strong>
          <small className="block truncate text-[12px] text-slate-500">Citizen Account</small>
        </span>
        <ChevronRight className="size-4 text-slate-400" />
      </div>
    </aside>
  );
}

function CaptureLink({ href, icon, children, active = false }: { href: string; icon: React.ReactNode; children: React.ReactNode; active?: boolean }) {
  return (
    <Link 
      href={href} 
      className={`relative flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-colors ${
        active ? "bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-500/20" : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
      }`}
    >
      {active && (
        <motion.div layoutId="sidebar-active" className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r-full bg-emerald-500" />
      )}
      <span className={`[&>svg]:size-[18px] ${active ? "text-emerald-600" : "text-slate-500"}`}>{icon}</span>
      {children}
    </Link>
  );
}

function StatusItem({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail?: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-white/60 p-3 shadow-sm ring-1 ring-slate-200/50 backdrop-blur-sm">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 shadow-inner">
        {icon}
      </span>
      <div>
        <strong className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{label}</strong>
        <span className="mt-0.5 block text-[15px] font-bold text-slate-900">{value}</span>
        {detail && <small className="mt-0.5 block text-[12px] text-slate-500">{detail}</small>}
      </div>
    </div>
  );
}

function BinUploadCard({ bin, files, onAdd, onRemove }: { bin: typeof bins[number]; files: File[]; onAdd: (files: FileList | null) => void; onRemove: (index: number) => void }) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
      <Card className={`h-full overflow-hidden border-t-[3px] border-l border-r border-b border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-md transition-shadow hover:shadow-md ${bin.border}`}>
        <CardContent className="flex h-full flex-col p-5">
          <div className="flex items-start gap-4">
            <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-white shadow-lg ${bin.tone}`}>
              <Recycle className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <strong className="block text-base tracking-tight text-slate-900">{bin.title}</strong>
              <p className="mt-1 block text-sm font-semibold text-slate-700">{bin.detail}</p>
              <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${bin.required ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                {bin.required ? "Required" : "Optional"}
              </span>
            </div>
          </div>
          
          <p className="mt-4 text-[13px] leading-relaxed text-slate-500 flex-1">{bin.contents}</p>
          
          <label className="group relative mt-5 flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-4 text-center transition-all hover:border-emerald-500 hover:bg-emerald-50">
            <div className="absolute inset-0 rounded-xl bg-emerald-500/0 transition-colors group-hover:bg-emerald-500/5" />
            <Camera className="mb-3 size-7 text-slate-400 transition-colors group-hover:text-emerald-500" />
            <strong className="block text-sm font-medium text-slate-700 group-hover:text-emerald-700">Click to Upload</strong>
            <small className="mt-1 block text-xs font-medium text-slate-400">Max 2 photos per bin</small>
            <input className="sr-only" type="file" accept="image/*" capture="environment" multiple onChange={event => onAdd(event.target.files)} />
          </label>
          
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 grid grid-cols-2 gap-3">
                {files.map((file, index) => (
                  <PhotoPreview key={`${file.name}-${index}`} file={file} label={bin.title} onRemove={() => onRemove(index)} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PhotoPreview({ file, label, onRemove }: { file: File; label: string; onRemove: () => void }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  
  return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">
      <img className="size-full object-cover transition-transform duration-300 group-hover:scale-110" src={src} alt={`${label} preview`} />
      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
      <button 
        type="button" 
        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-white/90 text-slate-700 opacity-0 shadow-sm backdrop-blur transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100" 
        onClick={onRemove} 
        aria-label={`Remove ${label} photo`}
      >
        ×
      </button>
    </motion.div>
  );
}

function MunicipalityTruckOverlay({
  pendingBody,
  onComplete,
  onError
}: {
  pendingBody: FormData;
  onComplete: (res: any) => void;
  onError: (err: string) => void;
}) {
  const [progress, setProgress] = useState(8);
  const [statusText, setStatusText] = useState("Municipal Eco-Truck dispatched to household coordinates...");
  const [activeBinIndex, setActiveBinIndex] = useState(0);
  const [isSpeedingOff, setIsSpeedingOff] = useState(false);

  const stages = [
    { text: "Municipal Eco-Truck arrived at your household location...", bin: 0 },
    { text: "Auditing GREEN bin (wet & organic waste separation)...", bin: 0 },
    { text: "Auditing BLUE bin (dry recyclables, paper & plastics)...", bin: 1 },
    { text: "Auditing RED bin (sanitary waste wrapping compliance)...", bin: 2 },
    { text: "Auditing BLACK bin (hazardous waste verification)...", bin: 3 },
    { text: "Checking cross-contamination & spatial compliance...", bin: 0 },
    { text: "Calculating final household score & minting Green QR Token...", bin: 1 }
  ];

  useEffect(() => {
    let isMounted = true;
    let pollInterval: NodeJS.Timeout | null = null;

    async function startFlow() {
      try {
        const initialRes = await api.submitBins(pendingBody);
        if (!isMounted) return;

        if (initialRes?.status && initialRes.status !== "PROCESSING") {
          finishFlow(initialRes);
          return;
        }

        const id = initialRes?.submissionId;
        if (!id) {
          throw new Error("Failed to receive submission ID from server.");
        }

        // Poll every 2.5 seconds
        pollInterval = setInterval(async () => {
          try {
            const statusRes = await api.getStatus(id);
            if (!isMounted) return;

            if (statusRes?.status && statusRes.status !== "PROCESSING") {
              if (pollInterval) clearInterval(pollInterval);
              finishFlow(statusRes);
            }
          } catch (err) {
            console.error("Polling status error:", err);
          }
        }, 2500);

      } catch (err: any) {
        if (!isMounted) return;
        onError(err?.message || "Unable to analyze waste photos. Please try again.");
      }
    }

    void startFlow();

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pendingBody]);

  // Smoothly increment progress bar & cycle stage quotes while polling
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => (prev >= 94 ? prev : prev + Math.floor(Math.random() * 3 + 1)));
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const stageIdx = Math.min(stages.length - 1, Math.floor((progress / 100) * stages.length));
    setStatusText(stages[stageIdx].text);
    setActiveBinIndex(stages[stageIdx].bin);
  }, [progress]);

  function finishFlow(res: any) {
    setProgress(100);
    setStatusText("Segregation Verified! Eco-Truck speeding to processing center ⚡");
    setIsSpeedingOff(true);

    setTimeout(() => {
      onComplete(res);
    }, 1100);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xl selection:bg-emerald-200"
    >
      <motion.div
        initial={{ scale: 0.85, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950/90 p-6 text-white shadow-2xl backdrop-blur-2xl sm:p-8"
      >
        {/* Background Ambient Glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 size-72 rounded-full bg-sky-500/20 blur-3xl" />

        {/* Circular Eco City Animation Badge (Inspired by Lottie illustrations) */}
        <div className="relative mx-auto flex size-44 items-center justify-center sm:size-52">
          <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/10 opacity-70 duration-1000" />
          <div className="absolute -inset-2 rounded-full border border-emerald-500/30 bg-gradient-to-tr from-emerald-500/10 via-sky-500/10 to-teal-500/10 backdrop-blur" />

          {/* Main Circular Scene */}
          <div className="relative size-full overflow-hidden rounded-full border-2 border-emerald-400/40 bg-gradient-to-b from-sky-400 via-emerald-300 to-emerald-600 p-2 shadow-xl shadow-emerald-950/50">
            
            {/* Sun Rays & Sky */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200/40 via-sky-300/30 to-transparent" />

            {/* Moving Clouds */}
            <motion.div 
              animate={{ x: [0, 35, 0] }} 
              transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
              className="absolute left-3 top-4 flex gap-2 opacity-85"
            >
              <div className="h-3 w-8 rounded-full bg-white/90 shadow-sm" />
              <div className="h-4 w-10 rounded-full bg-white/90 shadow-sm" />
            </motion.div>

            {/* City Silhouette */}
            <div className="absolute bottom-12 left-0 right-0 flex justify-around opacity-30 text-xl">
              <span>🏢</span>
              <span>🏭</span>
              <span>🏙️</span>
              <span>🌳</span>
            </div>

            {/* Moving Road Track */}
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-slate-800">
              <motion.div 
                animate={{ x: isSpeedingOff ? [-100, 0] : [-40, 0] }}
                transition={{ repeat: Infinity, duration: isSpeedingOff ? 0.2 : 0.6, ease: "linear" }}
                className="flex h-1.5 w-[200%] translate-y-4 gap-6 px-2"
              >
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="h-full w-4 rounded-full bg-amber-400/90 shadow-sm" />
                ))}
              </motion.div>
            </div>

            {/* Municipal Waste Truck Graphic */}
            <motion.div 
              animate={isSpeedingOff ? { x: [0, 180], opacity: [1, 0] } : { y: [0, -3, 0] }}
              transition={isSpeedingOff ? { duration: 0.9, ease: "easeIn" } : { repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
              className="absolute bottom-2 left-4 z-20 flex items-end"
            >
              <div className="relative">
                {/* Green Eco Sparks */}
                <motion.div 
                  animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="absolute -left-3 bottom-2 text-xs"
                >
                  ✨🌿
                </motion.div>

                <svg width="110" height="52" viewBox="0 0 110 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                  {/* Container Body */}
                  <rect x="2" y="8" width="62" height="32" rx="4" fill="#059669" />
                  <path d="M10 8H56V40H10V8Z" fill="#047857" />
                  <path d="M4 14H60" stroke="#10B981" strokeWidth="2" strokeDasharray="4 2" />
                  <text x="14" y="27" fill="#ECFDF5" fontSize="8" fontWeight="bold" fontFamily="sans-serif">CIVIC MITRA</text>
                  <text x="18" y="35" fill="#A7F3D0" fontSize="6" fontFamily="sans-serif">ECO AUDIT</text>

                  {/* Cab (Driver Area) */}
                  <path d="M64 16H88C94 16 98 20 98 26V40H64V16Z" fill="#0284C7" />
                  <path d="M72 20H88C91 20 94 22 94 25V30H72V20Z" fill="#E0F2FE" />
                  <circle cx="80" cy="25" r="2.5" fill="#0284C7" />

                  {/* Headlight Beam */}
                  <path d="M98 32L108 30V38L98 36V32Z" fill="#FEF08A" opacity="0.8" />

                  {/* Rotating Wheels */}
                  <g className="animate-spin" style={{ animationDuration: isSpeedingOff ? "0.2s" : "0.7s", transformOrigin: "20px 42px" }}>
                    <circle cx="20" cy="42" r="8" fill="#1E293B" />
                    <circle cx="20" cy="42" r="4" fill="#94A3B8" />
                  </g>
                  <g className="animate-spin" style={{ animationDuration: isSpeedingOff ? "0.2s" : "0.7s", transformOrigin: "52px 42px" }}>
                    <circle cx="52" cy="42" r="8" fill="#1E293B" />
                    <circle cx="52" cy="42" r="4" fill="#94A3B8" />
                  </g>
                  <g className="animate-spin" style={{ animationDuration: isSpeedingOff ? "0.2s" : "0.7s", transformOrigin: "82px 42px" }}>
                    <circle cx="82" cy="42" r="8" fill="#1E293B" />
                    <circle cx="82" cy="42" r="4" fill="#94A3B8" />
                  </g>
                </svg>

                {/* Animated Hydraulic Arm Lifting Active Bin */}
                <motion.div 
                  animate={{ y: [0, -14, 0], rotate: [0, -12, 0] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                  className="absolute -left-5 top-2 flex items-center gap-1"
                >
                  <div className={`size-5 rounded-sm shadow-md border ${
                    activeBinIndex === 0 ? "bg-emerald-500 border-emerald-300" :
                    activeBinIndex === 1 ? "bg-sky-500 border-sky-300" :
                    activeBinIndex === 2 ? "bg-rose-500 border-rose-300" :
                    "bg-slate-800 border-slate-600"
                  } flex items-center justify-center text-[10px]`}>
                    ♻️
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Status Prompt Header */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-md">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Municipal AI Waste Auditor Active
          </div>

          <h2 className="mt-3 text-xl font-bold tracking-tight text-white sm:text-2xl">
            {isSpeedingOff ? "Segregation Verified!" : "Auditing Household Bins..."}
          </h2>

          <p className="mt-2 min-h-[36px] text-xs font-medium text-slate-300 sm:text-sm leading-relaxed flex items-center justify-center px-4">
            {statusText}
          </p>
        </div>

        {/* 4 Bins Status Indicator */}
        <div className="mt-5 grid grid-cols-4 gap-2 text-center">
          {[
            { label: "Green", border: "border-emerald-400", icon: "🌱" },
            { label: "Blue", border: "border-sky-400", icon: "📦" },
            { label: "Red", border: "border-rose-400", icon: "🩹" },
            { label: "Black", border: "border-slate-500", icon: "🔋" }
          ].map((bin, i) => {
            const isActive = activeBinIndex === i;
            return (
              <motion.div
                key={bin.label}
                animate={isActive ? { scale: [1, 1.06, 1], y: [0, -2, 0] } : { scale: 1, y: 0 }}
                transition={{ repeat: isActive ? Infinity : 0, duration: 1 }}
                className={`rounded-xl border p-2 text-xs transition-all ${
                  isActive 
                    ? `${bin.border} bg-white/15 shadow-lg shadow-emerald-500/20 font-bold` 
                    : "border-white/10 bg-white/5 opacity-60"
                }`}
              >
                <div className="text-base">{bin.icon}</div>
                <div className="mt-1 text-[11px] font-medium text-slate-200">{bin.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="mb-1.5 flex justify-between text-xs font-semibold text-slate-400">
            <span>AI Verification Progress</span>
            <span className="text-emerald-400">{progress}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/10 bg-slate-800/80 p-0.5">
            <motion.div 
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 shadow-sm shadow-emerald-500/50"
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.4 }}
            />
          </div>
        </div>

        {/* Footer Note */}
        <p className="mt-5 text-center text-[11px] text-slate-400">
          💡 <span className="text-slate-300">Fun Fact:</span> Source-segregated waste powers biogas production in Chandigarh!
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function SubmitWastePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<PhotoMap>(emptyPhotos);
  const [location, setLocation] = useState<{ lat?: number; lng?: number; status: "loading" | "ready" | "unavailable" }>({ status: "loading" });
  const [submitting, setSubmitting] = useState(false);
  const [pendingBody, setPendingBody] = useState<FormData | null>(null);
  const [error, setError] = useState("");
  
  const requiredComplete = bins.filter(bin => bin.required).every(bin => photos[bin.type].length > 0);

  useEffect(() => {
    if (!readSession()) { window.location.assign("/"); return; }
    void api.profile().then(setProfile).catch(err => setError(err instanceof Error ? err.message : "Unable to load household."));
    void refreshLocation();
  }, []);

  function refreshLocation() {
    setLocation({ status: "loading" });
    if (!navigator.geolocation) { setLocation({ status: "unavailable" }); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setLocation({ lat: coords.latitude, lng: coords.longitude, status: "ready" }),
      () => setLocation({ status: "unavailable" }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function addPhotos(type: BinColor, incoming: FileList | null) {
    if (!incoming) return;
    setPhotos(current => ({ ...current, [type]: [...current[type], ...Array.from(incoming)].slice(0, 2) }));
  }

  function removePhoto(type: BinColor, index: number) {
    setPhotos(current => ({ ...current, [type]: current[type].filter((_, itemIndex) => itemIndex !== index) }));
  }

  function clearPhotos() {
    setPhotos(emptyPhotos());
    setError("");
  }

  async function submit() {
    if (!profile?.householdId) { setError("Set up your household before checking your bins."); return; }
    if (!requiredComplete) { setError("Please add at least one photo for the mandatory Green, Blue, and Red bins."); return; }
    
    setError("");
    
    let latest = location;
    if (navigator.geolocation) {
      try {
        const coords = await new Promise<GeolocationCoordinates>((resolve, reject) => 
          navigator.geolocation.getCurrentPosition(pos => resolve(pos.coords), reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 })
        );
        latest = { lat: coords.latitude, lng: coords.longitude, status: "ready" };
        setLocation(latest);
      } catch {}
    }
    
    if (!latest.lat || !latest.lng) {
      setError("Location is needed to confirm you are at your registered household.");
      return;
    }
    
    const body = new FormData();
    body.append("householdId", String(profile.householdId));
    body.append("lat", String(latest.lat));
    body.append("lng", String(latest.lng));
    bins.forEach(bin => photos[bin.type].forEach(photo => {
      body.append("binImages", photo);
      body.append("binTypes", bin.type);
    }));

    setPendingBody(body);
    setSubmitting(true);
  }

  return (
    <main className="min-h-screen bg-slate-50/50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] text-slate-950 selection:bg-emerald-200">
      <AnimatePresence>
        {submitting && pendingBody && (
          <MunicipalityTruckOverlay
            pendingBody={pendingBody}
            onComplete={(result) => {
              sessionStorage.setItem("lastSubmissionResult", JSON.stringify(result));
              router.push("/citizen/submit/result");
            }}
            onError={(errMsg) => {
              setError(errMsg);
              setSubmitting(false);
              setPendingBody(null);
            }}
          />
        )}
      </AnimatePresence>

      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <CaptureSidebar profile={profile} />
        
        <section className="relative min-w-0 px-4 py-6 sm:px-8 lg:py-10">
          <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-5">
              <Link href="/dashboard">
                <Button variant="outline" size="icon" className="size-12 rounded-full border-slate-200 bg-white/60 shadow-sm backdrop-blur hover:bg-slate-100">
                  <ArrowLeft className="size-5 text-slate-700" />
                </Button>
              </Link>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">Submit Waste</h1>
                <p className="mt-2 text-[15px] font-medium text-slate-500">Capture clear photos of your bins before collection for AI verification.</p>
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <div className="hidden rounded-xl border border-emerald-100/60 bg-emerald-50/60 px-4 py-2.5 shadow-sm backdrop-blur-sm sm:flex sm:items-center sm:gap-4">
                <div className="rounded-full bg-emerald-100/80 p-2">
                  <House className="size-5 text-emerald-700" />
                </div>
                <span>
                  <strong className="block text-[13px] font-semibold text-emerald-900">Household ID</strong>
                  <span className="block text-[12px] font-medium text-emerald-700/80">
                    {profile?.houseNumber || "Not set"}, {profile?.ward || "Add ward"}
                  </span>
                </span>
              </div>
            </motion.div>
          </header>

          <motion.section 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mt-8 grid gap-4 rounded-2xl border border-slate-200/60 bg-white/40 p-4 shadow-sm backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.25fr_1fr_auto] lg:items-center"
          >
            <StatusItem icon={<CalendarDays className="size-5" />} label="Submission Date" value={new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date())} />
            <StatusItem icon={<ShieldCheck className="size-5" />} label="Attempts Left" value={`5 / 5`} detail="Daily limit" />
            <StatusItem icon={<LocateFixed className="size-5" />} label="Location Status" value={location.status === "ready" ? "Location ready" : location.status === "loading" ? "Checking location" : "Location unavailable"} detail={location.status === "ready" ? "Within registered household area" : undefined} />
            <StatusItem icon={<LocateFixed className="size-5" />} label="Coordinates" value={location.lat ? `${location.lat.toFixed(4)} N` : "--"} detail={location.lng ? `${location.lng.toFixed(4)} E` : undefined} />
            
            <Button variant="outline" size="icon" className="size-12 rounded-xl bg-white shadow-sm hover:bg-slate-100" onClick={refreshLocation} aria-label="Refresh location">
              <RefreshCw className="size-5 text-slate-600" />
            </Button>
          </motion.section>

          <AnimatePresence>
            {!profile?.householdId && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-6">
                <Alert className="flex items-center gap-3 border-amber-200 bg-amber-50 shadow-sm">
                  <TriangleAlert className="size-5 text-amber-600" />
                  <span className="font-medium text-amber-900">Set up your household on the dashboard before submitting a verification.</span>
                </Alert>
              </motion.div>
            )}
            
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                <Alert className="flex items-center gap-3 border-rose-200 bg-rose-50 shadow-sm">
                  <TriangleAlert className="size-5 text-rose-600" />
                  <span className="font-medium text-rose-900">{error}</span>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <section>
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Upload Bin Photos</h2>
                    <p className="mt-1.5 text-[15px] font-medium text-slate-500">Ensure the waste is clearly visible inside each bin.</p>
                  </div>
                  <span className="hidden rounded-full bg-slate-200/50 px-3 py-1 text-xs font-semibold text-slate-600 sm:block">
                    Max 2 photos / bin
                  </span>
                </div>
                
                <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
                  {bins.map((bin, i) => (
                    <motion.div key={bin.type} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + (i * 0.1) }} className="h-full">
                      <BinUploadCard bin={bin} files={photos[bin.type]} onAdd={files => addPhotos(bin.type, files)} onRemove={index => removePhoto(bin.type, index)} />
                    </motion.div>
                  ))}
                </div>
              </section>

              <Card className="mt-10 overflow-hidden border-slate-200/60 bg-white/60 shadow-sm backdrop-blur-md">
                <CardHeader className="bg-slate-50/50 px-6 py-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                    <Sparkles className="size-5 text-emerald-600" /> What happens next?
                  </CardTitle>
                </CardHeader>
                <Separator className="bg-slate-200/60" />
                <CardContent className="grid gap-6 p-6 md:grid-cols-3">
                  <div className="flex gap-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-inner">1</span>
                    <div>
                      <strong className="block text-[14px] text-slate-900">AI Verification</strong>
                      <p className="mt-1 text-[13px] leading-relaxed text-slate-500">Our vision models analyze the contents for cross-contamination.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-inner">2</span>
                    <div>
                      <strong className="block text-[14px] text-slate-900">Green Token</strong>
                      <p className="mt-1 text-[13px] leading-relaxed text-slate-500">A secure QR code is generated if your segregation passes.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-inner">3</span>
                    <div>
                      <strong className="block text-[14px] text-slate-900">Human Pickup</strong>
                      <p className="mt-1 text-[13px] leading-relaxed text-slate-500">Show the QR code to the sanitation worker for final clearance.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="grid content-start gap-6">
              <Card className="overflow-hidden border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-md">
                <CardHeader className="flex-row items-center justify-between space-y-0 bg-slate-50/50 px-5 py-4">
                  <CardTitle className="text-[17px] text-slate-800">Photo Guidelines</CardTitle>
                  <Camera className="size-5 text-slate-400" />
                </CardHeader>
                <Separator className="bg-slate-200/60" />
                <CardContent className="grid gap-5 p-5">
                  {[
                    { icon: <CheckCircle2 />, title: "Use good lighting", copy: "Avoid dark or blurry photos." },
                    { icon: <Recycle />, title: "No lids covering waste", copy: "Keep bin open while taking photos." },
                    { icon: <Camera />, title: "Stand close to the bin", copy: "Ensure the entire bin is in the frame." },
                    { icon: <Sparkles />, title: "Avoid edited photos", copy: "Do not use filters or edit the images." }
                  ].map((g, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 shadow-inner">
                        {g.icon}
                      </span>
                      <div>
                        <strong className="block text-[13px] text-slate-900">{g.title}</strong>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{g.copy}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-slate-200/60 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-sm backdrop-blur-md">
                <CardHeader className="px-5 py-4 pb-2">
                  <CardTitle className="text-[17px] text-emerald-950">Need Help?</CardTitle>
                  <CardDescription className="text-emerald-700/80">Watch a quick guide on segregation.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 p-5">
                  <Button variant="outline" className="h-11 justify-start border-emerald-200 bg-white/60 hover:bg-white/90">
                    <HelpCircle className="mr-2 size-4 text-emerald-600" /> Watch Guide
                  </Button>
                  <Button variant="outline" className="h-11 justify-start border-emerald-200 bg-white/60 hover:bg-white/90">
                    <UserRound className="mr-2 size-4 text-emerald-600" /> Contact Support
                  </Button>
                </CardContent>
              </Card>
            </motion.aside>
          </div>

          <motion.footer 
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, type: "spring" }}
            className="sticky bottom-4 z-40 mt-10 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-lg shadow-slate-200/50 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3 rounded-xl bg-slate-100/80 px-4 py-3 text-slate-700 shadow-inner">
              <LockKeyhole className="size-5 text-slate-500" />
              <div>
                <strong className="block text-[13px] font-bold">Secure submission</strong>
                <span className="text-[12px] font-medium text-slate-500">Location verified via GPS.</span>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
              <Button variant="outline" className="h-12 w-full sm:w-auto rounded-xl border-slate-300 font-semibold" onClick={clearPhotos}>
                <Trash2 className="mr-2 size-4" /> Clear All
              </Button>
              <Button 
                className="h-12 w-full sm:w-auto rounded-xl bg-slate-900 px-6 font-semibold shadow-md transition-transform hover:scale-[1.02] hover:bg-slate-800 disabled:opacity-70 disabled:hover:scale-100" 
                disabled={submitting || !profile?.householdId} 
                onClick={submit}
              >
                {submitting ? "Analyzing bins..." : <><Send className="mr-2 size-4" /> Verify Segregation</>}
              </Button>
            </div>
          </motion.footer>
        </section>
      </div>
    </main>
  );
}
