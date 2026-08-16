"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Headset,
  House,
  Leaf,
  LocateFixed,
  Lock,
  PlayCircle,
  Recycle,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CitizenHeader } from "@/components/CitizenHeader";
import { HouseholdSetupFlow } from "@/components/HouseholdSetupFlow";
import { api } from "@/lib/api";
import { readSession } from "@/lib/session";
import type { BinColor, Profile } from "@/lib/types";

const binsConfig: {
  type: BinColor;
  title: string;
  subtitle: string;
  contents: string;
  required: boolean;
  colorHex: string;
  bgCircle: string;
  badgeBg: string;
  badgeText: string;
  borderHover: string;
}[] = [
    {
      type: "GREEN",
      title: "GREEN BIN",
      subtitle: "Wet / Organic Waste",
      contents: "Food scraps, vegetable peels, leaves, garden waste",
      required: true,
      colorHex: "#059669",
      bgCircle: "bg-[#059669]",
      badgeBg: "bg-emerald-100",
      badgeText: "text-emerald-800",
      borderHover: "hover:border-emerald-500",
    },
    {
      type: "BLUE",
      title: "BLUE BIN",
      subtitle: "Dry / Recyclables",
      contents: "Paper, cardboard, plastic, glass, metal",
      required: true,
      colorHex: "#0284c7",
      bgCircle: "bg-[#0284c7]",
      badgeBg: "bg-sky-100",
      badgeText: "text-sky-800",
      borderHover: "hover:border-sky-500",
    },
    {
      type: "RED",
      title: "RED BIN",
      subtitle: "Sanitary Waste",
      contents: "Sanitary pads, diapers, bandages, tissues",
      required: true,
      colorHex: "#dc2626",
      bgCircle: "bg-[#dc2626]",
      badgeBg: "bg-rose-100",
      badgeText: "text-rose-800",
      borderHover: "hover:border-rose-500",
    },
    {
      type: "BLACK",
      title: "BLACK BIN",
      subtitle: "Hazardous Waste",
      contents: "Batteries, e-waste, chemicals, expired medicines",
      required: false,
      colorHex: "#1e293b",
      bgCircle: "bg-[#1e293b]",
      badgeBg: "bg-slate-100",
      badgeText: "text-slate-600",
      borderHover: "hover:border-slate-500",
    },
  ];

type PhotoMap = Record<BinColor, File[]>;
const emptyPhotos = (): PhotoMap => ({ GREEN: [], BLUE: [], RED: [], BLACK: [] });

// ─────────────────────────────────────────────────────────────────────────
// MOCK VERIFICATION CONFIG
// Only the truck-overlay "AI verification" step is mocked here. Everything
// else on the page (profile, household, attempts left, location, history)
// still calls the real API exactly as before — untouched.
// ─────────────────────────────────────────────────────────────────────────
const MOCK_VERIFICATION_MIN_MS = 5000; // 5s
const MOCK_VERIFICATION_MAX_MS = 10000; // 10s

function getMockVerificationDelay() {
  return Math.floor(
    MOCK_VERIFICATION_MIN_MS + Math.random() * (MOCK_VERIFICATION_MAX_MS - MOCK_VERIFICATION_MIN_MS)
  );
}

function buildMockResult(pendingBody: FormData) {
  const householdId = pendingBody.get("householdId");
  return {
    status: "PASSED" as const,
    submissionId: `MOCK-${Date.now()}`,
    householdId: householdId ? Number(householdId) : undefined,
    score: 92,
    qrToken: `QR-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    submittedAt: new Date().toISOString(),
    binResults: {
      GREEN: { verified: true },
      BLUE: { verified: true },
      RED: { verified: true },
      BLACK: { verified: true },
    },
  };
}

function MunicipalityTruckOverlay({
  pendingBody,
  onComplete,
  onError,
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
    { text: "Calculating final household score & minting Green QR Token...", bin: 1 },
  ];

  const hasStarted = useRef(false);

  useEffect(() => {
    // Guard: React StrictMode mounts effects twice in dev.
    // hasStarted ensures only the first real mount fires the flow.
    if (hasStarted.current) return;
    hasStarted.current = true;

    let isMounted = true;
    let mockTimer: NodeJS.Timeout | null = null;

    // Mocked verification: no api.submitBins / api.getStatus calls at all.
    // Waits a random 5-10s (so the progress bar + stage text play out
    // fully, same pacing as a real audit would feel), then resolves.
    mockTimer = setTimeout(() => {
      if (!isMounted) return;
      finishFlow(buildMockResult(pendingBody));
    }, getMockVerificationDelay());

    return () => {
      isMounted = false;
      if (mockTimer) clearTimeout(mockTimer);
    };
  }, [pendingBody]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => Math.min(98, prev + Math.floor(Math.random() * 3 + 1)));
    }, 300);
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
    }, 800);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.85, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950/90 p-6 text-white shadow-2xl backdrop-blur-2xl sm:p-8"
      >
        <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 size-72 rounded-full bg-sky-500/20 blur-3xl" />

        <div className="relative mx-auto flex size-44 items-center justify-center sm:size-52">
          <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/10 opacity-70 duration-1000" />
          <div className="absolute -inset-2 rounded-full border border-emerald-500/30 bg-gradient-to-tr from-emerald-500/10 via-sky-500/10 to-teal-500/10 backdrop-blur" />

          <div className="relative size-full overflow-hidden rounded-full border-2 border-emerald-400/40 bg-gradient-to-b from-sky-400 via-emerald-300 to-emerald-600 p-2 shadow-xl shadow-emerald-950/50">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200/40 via-sky-300/30 to-transparent" />

            <motion.div
              animate={{ x: [0, 35, 0] }}
              transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
              className="absolute left-3 top-4 flex gap-2 opacity-85"
            >
              <div className="h-3 w-8 rounded-full bg-white/90 shadow-2xs" />
              <div className="h-4 w-10 rounded-full bg-white/90 shadow-2xs" />
            </motion.div>

            <div className="absolute bottom-12 left-0 right-0 flex justify-around opacity-30 text-xl">
              <span>🏢</span>
              <span>🏭</span>
              <span>🏙️</span>
              <span>🌳</span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-10 bg-slate-800">
              <motion.div
                animate={{ x: isSpeedingOff ? [-100, 0] : [-40, 0] }}
                transition={{ repeat: Infinity, duration: isSpeedingOff ? 0.2 : 0.6, ease: "linear" }}
                className="flex h-1.5 w-[200%] translate-y-4 gap-6 px-2"
              >
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="h-full w-4 rounded-full bg-amber-400/90 shadow-2xs" />
                ))}
              </motion.div>
            </div>

            <motion.div
              animate={isSpeedingOff ? { x: [0, 180], opacity: [1, 0] } : { y: [0, -3, 0] }}
              transition={isSpeedingOff ? { duration: 0.9, ease: "easeIn" } : { repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
              className="absolute bottom-2 left-4 z-20 flex items-end"
            >
              <div className="relative">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="absolute -left-3 bottom-2 text-xs"
                >
                  ✨🌿
                </motion.div>

                <svg width="110" height="52" viewBox="0 0 110 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                  <rect x="2" y="8" width="62" height="32" rx="4" fill="#059669" />
                  <path d="M10 8H56V40H10V8Z" fill="#047857" />
                  <path d="M4 14H60" stroke="#10B981" strokeWidth="2" strokeDasharray="4 2" />
                  <text x="14" y="27" fill="#ECFDF5" fontSize="8" fontWeight="bold" fontFamily="sans-serif">CIVIC MITRA</text>
                  <text x="18" y="35" fill="#A7F3D0" fontSize="6" fontFamily="sans-serif">ECO AUDIT</text>
                  <path d="M64 16H88C94 16 98 20 98 26V40H64V16Z" fill="#0284C7" />
                  <path d="M72 20H88C91 20 94 22 94 25V30H72V20Z" fill="#E0F2FE" />
                  <circle cx="80" cy="25" r="2.5" fill="#0284C7" />
                  <path d="M98 32L108 30V38L98 36V32Z" fill="#FEF08A" opacity="0.8" />
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
              </div>
            </motion.div>
          </div>
        </div>

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

        <div className="mt-6">
          <div className="mb-1.5 flex justify-between text-xs font-semibold text-slate-400">
            <span>AI Verification Progress</span>
            <span className="text-emerald-400">{progress}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/10 bg-slate-800/80 p-0.5">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 shadow-2xs shadow-emerald-500/50"
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.4 }}
            />
          </div>
        </div>
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
  const [showHouseholdSetup, setShowHouseholdSetup] = useState(false);
  /** null = still loading, number = resolved */
  const [attemptsUsed, setAttemptsUsed] = useState<number | null>(null);
  const MAX_DAILY_ATTEMPTS = 5;

  function handleHouseholdComplete(code: string) {
    setShowHouseholdSetup(false);
    void api
      .profile()
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to reload household."));
  }

  const requiredComplete = binsConfig.filter((bin) => bin.required).every((bin) => photos[bin.type].length > 0);

  /** Fetches today's submission count for the current household */
  async function refreshAttempts(householdId: number) {
    try {
      const history = await api.history(householdId);
      const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
      const todayCount = history.filter((s) => {
        const submittedAt = s.submittedAt ?? (s as any).submissionDate ?? "";
        return submittedAt.startsWith(todayStr);
      }).length;
      setAttemptsUsed(todayCount);
    } catch {
      // If history fetch fails, don't crash — just leave as unknown
      setAttemptsUsed(null);
    }
  }

  useEffect(() => {
    if (!readSession()) {
      window.location.assign("/");
      return;
    }
    void api
      .profile()
      .then((p) => {
        setProfile(p);
        if (p?.householdId) void refreshAttempts(p.householdId);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load household."));
    void refreshLocation();
  }, []);

  function refreshLocation() {
    setLocation({ status: "loading" });
    if (!navigator.geolocation) {
      setLocation({ status: "unavailable" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setLocation({ lat: coords.latitude, lng: coords.longitude, status: "ready" }),
      () => setLocation({ status: "unavailable" }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function addPhotos(type: BinColor, incoming: FileList | null) {
    if (!incoming) return;
    setPhotos((current) => ({
      ...current,
      [type]: [...current[type], ...Array.from(incoming)].slice(0, 2),
    }));
  }

  function removePhoto(type: BinColor, index: number) {
    setPhotos((current) => ({
      ...current,
      [type]: current[type].filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function clearPhotos() {
    setPhotos(emptyPhotos());
    setError("");
  }

  async function submit() {
    if (submitting) return; // Prevent double-click submissions
    if (!profile?.householdId) {
      setError("Set up your household on the dashboard before submitting.");
      return;
    }
    if (!requiredComplete) {
      setError("Please add at least one photo for the mandatory Green, Blue, and Red bins.");
      return;
    }

    setSubmitting(true); // Disable submit button immediately on click
    setError("");

    let latest = location;
    if (navigator.geolocation) {
      try {
        const coords = await new Promise<GeolocationCoordinates>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition((pos) => resolve(pos.coords), reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          })
        );
        latest = { lat: coords.latitude, lng: coords.longitude, status: "ready" };
        setLocation(latest);
      } catch { }
    }

    if (!latest.lat || !latest.lng) {
      setError("Location is needed to confirm you are at your registered household.");
      setSubmitting(false); // Reset submitting state if location fails
      return;
    }

    const body = new FormData();
    body.append("householdId", String(profile.householdId));
    body.append("lat", String(latest.lat));
    body.append("lng", String(latest.lng));
    binsConfig.forEach((bin) =>
      photos[bin.type].forEach((photo) => {
        body.append("binImages", photo);
        body.append("binTypes", bin.type);
      })
    );

    setPendingBody(body);
  }

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* AI Processing Overlay */}
      <AnimatePresence>
        {submitting && pendingBody && (
          <MunicipalityTruckOverlay
            pendingBody={pendingBody}
            onComplete={(result) => {
              sessionStorage.setItem("lastSubmissionResult", JSON.stringify(result));
              // Refresh attempt count so the badge is accurate if user navigates back
              if (profile?.householdId) void refreshAttempts(profile.householdId);
              window.location.href = "/citizen/submit/result";
            }}
            onError={(errMsg) => {
              setError(errMsg);
              setSubmitting(false);
              setPendingBody(null);
              // Also refresh here — a failed attempt still counts against the limit
              if (profile?.householdId) void refreshAttempts(profile.householdId);
            }}
          />
        )}
      </AnimatePresence>

      {/* Top Professional Header Bar */}
      <CitizenHeader activeTab="submit" profile={profile} onOpenHouseholdSetup={() => setShowHouseholdSetup(true)} />

      {/* Household Setup Modal Overlay */}
      {showHouseholdSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative flex h-full max-h-[85vh] w-full max-w-xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Register Household</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Please provide your home coordinates & details.</p>
              </div>
              <button
                onClick={() => setShowHouseholdSetup(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
                aria-label="Close modal"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <HouseholdSetupFlow municipalityId={1} initialMobile={profile?.phoneNumber || undefined} onComplete={handleHouseholdComplete} />
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Sub-header / Title Row with City & Truck Graphic */}
        <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Left Title & Back button */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/dashboard">
              <button className="size-10 sm:size-11 rounded-full border border-slate-200/80 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs shrink-0">
                <ArrowLeft className="size-4 sm:size-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Submit Waste</h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Capture clear photos of your bins before collection for AI verification.
              </p>
            </div>
          </div>

          {/* Center Graphic Banner Illustration (Responsive Laptop/Desktop view) */}
          <div className="hidden lg:flex items-center justify-between relative h-16 w-72 xl:w-80 overflow-hidden rounded-2xl bg-gradient-to-r from-sky-50 via-teal-50 to-emerald-50 border border-emerald-100/60 shadow-2xs px-4">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#0d9488_1px,transparent_1px)] [background-size:12px_12px]" />
            <div className="relative flex items-center justify-between w-full z-10">
              <div className="flex items-center gap-1 text-2xl">
                <span>🏙️</span>
                <span>🏡</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl animate-bounce" style={{ animationDuration: "3s" }}>
                  🚚
                </span>
                <div className="flex gap-1">
                  <span className="text-lg">🟩</span>
                  <span className="text-lg">🟦</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Household Card */}
          <button
            onClick={() => setShowHouseholdSetup(true)}
            className="w-full sm:w-auto flex items-center justify-between gap-3 border border-slate-200/80 bg-white rounded-2xl p-3 px-4 shadow-2xs text-left cursor-pointer hover:border-emerald-300 hover:bg-slate-50 transition-all"
          >
            <div className="size-9 sm:size-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <House className="size-4 sm:size-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900">
                {profile?.householdId ? `Household ID: ${profile.householdId}` : "No Household"}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {profile?.householdId ? (profile.ward || "No Ward") : "Setup required on dashboard"}
              </span>
            </div>
            <ChevronDown className="size-4 text-slate-400 ml-2" />
          </button>
        </section>

        {/* ── Status Bar Row (4 Cards + Refresh - 100% Responsive Grid) ──── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Submission Date */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex items-center gap-3.5">
            <div className="size-9 sm:size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CalendarDays className="size-4 sm:size-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Submission Date</span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">{formattedDate}</span>
            </div>
          </div>

          {/* Card 2: Attempts Left — fully dynamic from backend history */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex items-center gap-3.5">
            {(() => {
              const used = attemptsUsed ?? 0;
              const left = MAX_DAILY_ATTEMPTS - used;
              const isExhausted = left <= 0;
              const isLow = left <= 2 && !isExhausted;
              const iconBg = isExhausted
                ? "bg-rose-50 text-rose-600"
                : isLow
                  ? "bg-amber-50 text-amber-600"
                  : "bg-emerald-50 text-emerald-600";
              const valueColor = isExhausted
                ? "text-rose-600"
                : isLow
                  ? "text-amber-600"
                  : "text-slate-900";
              return (
                <>
                  <div className={`size-9 sm:size-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                    {isExhausted ? (
                      <TriangleAlert className="size-4 sm:size-5" />
                    ) : (
                      <ShieldCheck className="size-4 sm:size-5" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Attempts Left</span>
                    <div className="flex items-baseline gap-2">
                      {attemptsUsed === null ? (
                        <span className="text-xs sm:text-sm font-extrabold text-slate-400 animate-pulse">— / {MAX_DAILY_ATTEMPTS}</span>
                      ) : (
                        <span className={`text-xs sm:text-sm font-extrabold ${valueColor}`}>
                          {Math.max(0, left)} / {MAX_DAILY_ATTEMPTS}
                        </span>
                      )}
                      <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">Daily limit</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Card 3: Location Status */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex items-center gap-3.5">
            <div className="size-9 sm:size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <LocateFixed className="size-4 sm:size-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Location Status</span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                {location.status === "ready" ? "Location ready" : location.status === "loading" ? "Locating..." : "Unavailable"}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">Within registered household area</span>
            </div>
          </div>

          {/* Card 4: Coordinates + Refresh Button */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="size-9 sm:size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <LocateFixed className="size-4 sm:size-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">Coordinates</span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                  {location.lat && location.lng
                    ? `${location.lat.toFixed(4)} N, ${location.lng.toFixed(4)} E`
                    : "30.6866 N, 76.6647 E"}
                </span>
              </div>
            </div>
            <button
              onClick={refreshLocation}
              aria-label="Refresh Location"
              className="size-8 sm:size-9 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors shrink-0"
            >
              <RefreshCw className="size-3.5 sm:size-4" />
            </button>
          </div>
        </section>

        {/* Error / Alert notice if any */}
        {error && (
          <Alert className="border-rose-200 bg-rose-50 text-rose-900">
            <TriangleAlert className="size-4 text-rose-600 mr-2" /> {error}
          </Alert>
        )}

        {/* ── Main 2-Column Responsive Layout (Upload Bins + Sidebar) ──────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_350px] gap-6 items-start">
          {/* Left Column (Upload Bins + Next Steps + Submit bar) */}
          <div className="space-y-6">
            {/* Header for Upload Bin Photos */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Upload Bin Photos</h2>
                <p className="text-xs text-slate-500 font-medium">Ensure the waste is clearly visible inside each bin.</p>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200/60 px-3 py-1 rounded-full shrink-0">
                Max 2 photos / bin
              </span>
            </div>

            {/* 4 Bin Cards Grid (1 col mobile, 2 col tablet/laptop, 4 col desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {binsConfig.map((bin) => {
                const currentFiles = photos[bin.type];
                return (
                  <div
                    key={bin.type}
                    className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between h-full space-y-4 hover:shadow-md transition-all duration-200"
                  >
                    {/* Header line of bin card */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`size-9 sm:size-10 rounded-full ${bin.bgCircle} text-white flex items-center justify-center shadow-2xs shrink-0`}>
                          <Recycle className="size-4 sm:size-5" />
                        </div>
                        <div className="flex flex-col leading-tight">
                          <span className="text-xs font-black tracking-wider uppercase text-slate-900">{bin.title}</span>
                          <span className="text-[11px] sm:text-xs font-bold text-slate-700">{bin.subtitle}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${bin.badgeBg} ${bin.badgeText}`}>
                        {bin.required ? "REQUIRED" : "OPTIONAL"}
                      </span>
                    </div>

                    {/* Content text */}
                    <p className="text-[11px] text-slate-500 leading-snug min-h-[32px]">{bin.contents}</p>

                    {/* Upload Box */}
                    <label
                      className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-4 text-center cursor-pointer transition-all duration-200 ${bin.borderHover} hover:bg-slate-100/60`}
                    >
                      <div className="size-8 sm:size-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 transition-transform group-hover:scale-110">
                        <Camera className="size-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700">Upload photo</span>
                      <span className="text-[10px] text-slate-400 font-medium">Max 2 photos</span>
                      <input
                        className="sr-only"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        onChange={(e) => addPhotos(bin.type, e.target.files)}
                      />
                    </label>

                    {/* Uploaded Thumbnails Preview */}
                    {currentFiles.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {currentFiles.map((file, idx) => (
                          <PhotoPreview
                            key={`${file.name}-${idx}`}
                            file={file}
                            onRemove={() => removePhoto(bin.type, idx)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* What Happens Next Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Sparkles className="size-4 text-[#059669]" />
                <span>What happens next?</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <div className="size-7 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">AI Verification</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                      Our vision models analyze the contents for cross-contamination.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <div className="size-7 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Green Token</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                      A secure QR code is generated if your segregation passes.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3">
                  <div className="size-7 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Human Pickup</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                      Show the QR code to the sanitation worker for final clearance.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Footer Bar */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="size-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Lock className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Secure Submission</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Your location is verified via GPS.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs h-11 px-4 rounded-xl flex items-center gap-2 flex-1 sm:flex-initial"
                  onClick={clearPhotos}
                >
                  <Trash2 className="size-4 text-slate-500" />
                  Clear All
                </Button>

                <Button
                  className="bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs h-11 px-6 rounded-xl shadow-2xs hover:shadow-md transition-all flex items-center gap-2 flex-1 sm:flex-initial justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={submitting}
                  onClick={submit}
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      <span>Verify Segregation</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column (Sidebar: Photo Guidelines & Need Help) */}
          <div className="space-y-6">
            {/* Photo Guidelines Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Photo Guidelines</h3>
                <Camera className="size-4 text-slate-400" />
              </div>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="size-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Use good lighting</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Avoid dark or blurry photos.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="size-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Recycle className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">No lids covering waste</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Keep bin open while taking photos.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="size-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Camera className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Stand close to the bin</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Ensure the entire bin is in the frame.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="size-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Avoid edited photos</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Do not use filters or edit the images.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Need Help Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#e6f7f2] via-[#e0f4ee] to-[#d6f0e7] border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="absolute -bottom-4 -right-4 text-emerald-300/40 pointer-events-none">
                <Leaf className="size-24 sm:size-28" />
              </div>

              <div className="relative z-10">
                <h3 className="text-base font-extrabold text-emerald-950">Need Help?</h3>
                <p className="text-xs text-emerald-800 font-medium mt-0.5">Watch a quick guide on segregation.</p>
              </div>

              <div className="relative z-10 space-y-2.5">
                <button className="w-full bg-white hover:bg-emerald-50/80 border border-emerald-100 rounded-xl p-3 flex items-center justify-between shadow-2xs transition-colors group">
                  <div className="flex items-center gap-2.5">
                    <PlayCircle className="size-4 text-[#059669]" />
                    <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">Watch Guide</span>
                  </div>
                  <ChevronRight className="size-4 text-slate-400 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5" />
                </button>

                <button className="w-full bg-white hover:bg-emerald-50/80 border border-emerald-100 rounded-xl p-3 flex items-center justify-between shadow-2xs transition-colors group">
                  <div className="flex items-center gap-2.5">
                    <Headset className="size-4 text-[#059669]" />
                    <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">Contact Support</span>
                  </div>
                  <ChevronRight className="size-4 text-slate-400 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function PhotoPreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs">
      {src && <img className="size-full object-cover transition-transform group-hover:scale-105" src={src} alt="Bin photo preview" />}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 size-5 rounded-full bg-slate-900/80 text-white flex items-center justify-center text-xs opacity-80 hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </div>
  );
}