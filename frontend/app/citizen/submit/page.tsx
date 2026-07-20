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

function ProcessingOverlay() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center rounded-3xl bg-white p-10 text-center shadow-2xl"
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-20" />
          <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/30">
            <Sparkles className="size-10 text-white animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Analyzing your bins...</h2>
        <p className="mt-3 max-w-[280px] text-[15px] leading-relaxed text-slate-500">
          Our AI is checking for proper segregation and cross-contamination. This will only take a moment.
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
    
    setSubmitting(true);
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
      setSubmitting(false);
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

    try {
      const result = await api.submitBins(body);
      sessionStorage.setItem("lastSubmissionResult", JSON.stringify(result));
      router.push("/citizen/submit/result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to analyze your bins right now. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50/50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] text-slate-950 selection:bg-emerald-200">
      <AnimatePresence>
        {submitting && <ProcessingOverlay />}
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
            <StatusItem icon={<ShieldCheck className="size-5" />} label="Attempts Left" value={`3 / 3`} detail="Daily limit" />
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
