"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  BarChart3,
  Bell,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Download,
  Eye,
  Gift,
  HelpCircle,
  House,
  Leaf,
  LocateFixed,
  LockKeyhole,
  QrCode,
  Recycle,
  RefreshCw,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
  UserRound,
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { readSession } from "@/lib/session";
import type { BinColor, Profile, Submission } from "@/lib/types";

const bins: {
  type: BinColor;
  title: string;
  detail: string;
  contents: string;
  required: boolean;
  tone: string;
  border: string;
}[] = [
  {
    type: "GREEN",
    title: "GREEN BIN",
    detail: "Wet / Organic Waste",
    contents: "Food scraps, vegetable peels, leaves, garden waste",
    required: true,
    tone: "bg-emerald-600",
    border: "border-emerald-500",
  },
  {
    type: "BLUE",
    title: "BLUE BIN",
    detail: "Dry Recyclables",
    contents: "Paper, cardboard, plastic, glass, metal",
    required: true,
    tone: "bg-sky-600",
    border: "border-sky-500",
  },
  {
    type: "RED",
    title: "RED BIN",
    detail: "Sanitary Waste",
    contents: "Sanitary pads, diapers, bandages, tissues",
    required: true,
    tone: "bg-rose-600",
    border: "border-rose-500",
  },
  {
    type: "BLACK",
    title: "BLACK BIN",
    detail: "Hazardous Waste",
    contents: "Batteries, e-waste, chemicals, expired medicines",
    required: false,
    tone: "bg-slate-800",
    border: "border-slate-800",
  },
];
type PhotoMap = Record<BinColor, File[]>;
const emptyPhotos = (): PhotoMap => ({
  GREEN: [],
  BLUE: [],
  RED: [],
  BLACK: [],
});

export function BinCapture() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<PhotoMap>(emptyPhotos);
  const [location, setLocation] = useState<{
    lat?: number;
    lng?: number;
    status: "loading" | "ready" | "unavailable";
  }>({ status: "loading" });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Submission | null>(null);
  const [error, setError] = useState("");
  const requiredComplete = bins
    .filter((bin) => bin.required)
    .every((bin) => photos[bin.type].length > 0);
  useEffect(() => {
    if (!readSession()) {
      window.location.assign("/");
      return;
    }
    void api
      .profile()
      .then(setProfile)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Unable to load household.",
        ),
      );
    void refreshLocation();
  }, []);
  function refreshLocation() {
    setLocation({ status: "loading" });
    if (!navigator.geolocation) {
      setLocation({ status: "unavailable" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setLocation({
          lat: coords.latitude,
          lng: coords.longitude,
          status: "ready",
        }),
      () => setLocation({ status: "unavailable" }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
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
    if (!profile?.householdId) {
      setError("Set up your household before checking your bins.");
      return;
    }
    if (!requiredComplete) {
      setError("Add at least one photo for your green, blue, and red bins.");
      return;
    }
    setSubmitting(true);
    setError("");
    let latest = location;
    if (navigator.geolocation) {
      try {
        const coords = await new Promise<GeolocationCoordinates>(
          (resolve, reject) =>
            navigator.geolocation.getCurrentPosition(
              (position) => resolve(position.coords),
              reject,
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
            ),
        );
        latest = {
          lat: coords.latitude,
          lng: coords.longitude,
          status: "ready",
        };
        setLocation(latest);
      } catch {}
    }
    if (!latest.lat || !latest.lng) {
      setSubmitting(false);
      setError(
        "Location is needed to confirm you are at your registered household.",
      );
      return;
    }
    const body = new FormData();
    body.append("householdId", String(profile.householdId));
    body.append("lat", String(latest.lat));
    body.append("lng", String(latest.lng));
    bins.forEach((bin) =>
      photos[bin.type].forEach((photo) => {
        body.append("binImages", photo);
        body.append("binTypes", bin.type);
      }),
    );
    try {
      setResult(await api.submitBins(body));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to check your bins.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  const attempts = useMemo(() => result?.attemptNumber || 0, [result]);
  if (result)
    return (
      <ResultScreen
        result={result}
        onRetry={() => {
          setResult(null);
          clearPhotos();
        }}
      />
    );
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[264px_minmax(0,1fr)]">
        <CaptureSidebar profile={profile} />
        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-7 lg:py-6 xl:px-9">
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11 rounded-full"
                >
                  <ArrowLeft />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-semibold">Submit Waste</h1>
                <p className="mt-1 text-[15px] text-slate-500">
                  Capture clear photos of your bins before collection for AI
                  verification.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 sm:flex sm:items-center sm:gap-3">
                <House className="size-5 text-emerald-700" />
                <span>
                  <strong className="block text-[13px]">Household ID</strong>
                  <span className="block text-[12px] text-slate-500">
                    {profile?.houseNumber || "Not set"},{" "}
                    {profile?.ward || "Add ward"}
                  </span>
                </span>
              </div>
              <Link href="/citizen/notifications">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative size-10"
                  aria-label="Notifications"
                >
                  <Bell className="size-5" />
                  <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white">
                    3
                  </span>
                </Button>
              </Link>
            </div>
          </header>
          <section className="mt-5 grid gap-4 rounded-lg border border-emerald-100 bg-emerald-50/60 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.25fr_1fr_auto] lg:items-center">
            <StatusItem
              icon={<CalendarDays />}
              label="Submission Date"
              value={new Intl.DateTimeFormat("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date())}
            />
            <StatusItem
              icon={<ShieldCheck />}
              label="Attempts Left Today"
              value={`${Math.max(0, 3 - attempts)} / 3`}
            />
            <StatusItem
              icon={<LocateFixed />}
              label="Location Status"
              value={
                location.status === "ready"
                  ? "Location ready"
                  : location.status === "loading"
                    ? "Checking location"
                    : "Location unavailable"
              }
              detail={
                location.status === "ready"
                  ? "Within registered household area"
                  : undefined
              }
            />
            <StatusItem
              icon={<MapPinIcon />}
              label="Coordinates"
              value={location.lat ? `${location.lat.toFixed(4)} N` : "--"}
              detail={location.lng ? `${location.lng.toFixed(4)} E` : undefined}
            />
            <Button
              variant="outline"
              size="icon"
              className="size-10"
              onClick={refreshLocation}
              aria-label="Refresh location"
            >
              <RefreshCw className="size-4" />
            </Button>
          </section>
          {!profile?.householdId && (
            <Alert className="mt-4 flex items-center gap-2 border-amber-200 bg-amber-50 text-amber-900">
              <TriangleAlert className="size-4" />
              Set up your household on the dashboard before submitting a
              verification.
            </Alert>
          )}
          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <section>
                <h2 className="text-xl font-semibold">
                  Upload Photos of Your Bins
                </h2>
                <p className="mt-1 text-[14px] text-slate-500">
                  Upload clear photos of each bin. You can add up to 2 photos
                  per bin.
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                  {bins.map((bin) => (
                    <BinUploadCard
                      key={bin.type}
                      bin={bin}
                      files={photos[bin.type]}
                      onAdd={(files) => addPhotos(bin.type, files)}
                      onRemove={(index) => removePhoto(bin.type, index)}
                    />
                  ))}
                </div>
              </section>
              <Card className="mt-5 border-slate-200">
                <CardHeader className="p-5">
                  <CardTitle className="text-[17px]">
                    About Your Submission
                  </CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="grid gap-4 p-5 md:grid-cols-3">
                  <About
                    icon={<Sparkles />}
                    title="AI Verification"
                    copy="Our AI will analyze your photos to check segregation quality."
                  />
                  <About
                    icon={<QrCode />}
                    title="Green QR Token"
                    copy="If approved, you will get a QR code for collection."
                  />
                  <About
                    icon={<UserRound />}
                    title="Human Validation"
                    copy="Final verification will be done by our collection worker."
                  />
                </CardContent>
              </Card>
            </div>
            <aside className="grid content-start gap-4">
              <Card className="border-slate-200" id="photo-guidelines">
                <CardHeader className="flex-row items-center justify-between space-y-0 p-5">
                  <CardTitle className="text-[17px]">
                    Photo Guidelines
                  </CardTitle>
                  <HelpCircle className="size-5 text-slate-500" />
                </CardHeader>
                <Separator />
                <CardContent className="grid gap-4 p-5">
                  <Guideline
                    icon={<Sparkles />}
                    title="Capture each bin clearly"
                    copy="Make sure the waste is visible inside the bin."
                  />
                  <Guideline
                    icon={<CheckCircle2 />}
                    title="Use good lighting"
                    copy="Avoid dark or blurry photos."
                  />
                  <Guideline
                    icon={<Recycle />}
                    title="No lids covering waste"
                    copy="Keep bin open while taking photos."
                  />
                  <Guideline
                    icon={<Camera />}
                    title="Stand close to the bin"
                    copy="Ensure the entire bin is in the frame."
                  />
                  <Guideline
                    icon={<Sparkles />}
                    title="Avoid edited photos"
                    copy="Do not use filters or edit the images."
                  />
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardHeader className="p-5">
                  <CardTitle className="text-[17px]">Need Help?</CardTitle>
                  <CardDescription className="mt-2">
                    Watch a short guide or contact support.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 p-5 pt-0">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() =>
                      document
                        .getElementById("photo-guidelines")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                  >
                    <HelpCircle />
                    Photo guidelines
                  </Button>
                  <Link href="/citizen/support">
                    <Button variant="outline" className="w-full justify-start">
                      <HelpCircle />
                      Contact support
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </aside>
          </div>
          {error && (
            <Alert className="mt-5 flex items-center gap-2 border-rose-200 bg-rose-50 text-rose-900">
              <TriangleAlert className="size-4" />
              {error}
            </Alert>
          )}
          <footer className="sticky bottom-0 mt-5 flex flex-col gap-4 border-t border-slate-200 bg-slate-50 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 rounded-md bg-amber-50 px-4 py-3 text-amber-900">
              <LockKeyhole className="size-5" />
              <div>
                <strong className="block text-[13px]">
                  Your data is safe and secure
                </strong>
                <span className="text-[12px]">
                  We do not share your personal information with anyone.
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" className="h-11" onClick={clearPhotos}>
                <Trash2 />
                Clear All
              </Button>
              <Button
                className="h-11 rounded-md px-5 text-[15px]"
                disabled={submitting || !profile?.householdId}
                onClick={submit}
              >
                {submitting ? (
                  "Analysing bins..."
                ) : (
                  <>
                    <Send />
                    Submit for Verification
                  </>
                )}
              </Button>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}

function CaptureSidebar({ profile }: { profile: Profile | null }) {
  return (
    <aside className="hidden border-r border-slate-200 bg-white px-4 py-8 lg:flex lg:flex-col">
      <Link href="/dashboard" className="mb-12 flex items-center gap-3 px-3">
        <span className="flex size-11 items-center justify-center rounded-full bg-emerald-700 text-white">
          <Leaf className="size-6" />
        </span>
        <span>
          <strong className="block text-[27px] font-bold leading-none text-emerald-950">
            CivicMitra
          </strong>
          <small className="mt-1 block text-[11px] text-slate-500">
            Clean City. Better Tomorrow.
          </small>
        </span>
      </Link>
      <nav className="grid gap-1">
        <CaptureLink href="/dashboard" icon={<House />}>
          Dashboard
        </CaptureLink>
        <CaptureLink href="/citizen/submit" icon={<ClipboardCheck />} active>
          Submit Waste
        </CaptureLink>
        <CaptureLink href="/citizen/submissions" icon={<Recycle />}>
          My Submissions
        </CaptureLink>
        <CaptureLink href="/citizen/qr" icon={<QrCode />}>
          My QR Tokens
        </CaptureLink>
        <CaptureLink href="/citizen/calendar" icon={<CalendarDays />}>
          Collection Schedule
        </CaptureLink>
        <CaptureLink href="/citizen/rewards" icon={<Gift />}>
          Rewards & Badges
        </CaptureLink>
        <CaptureLink href="/dashboard" icon={<House />}>
          My Household
        </CaptureLink>
        <CaptureLink href="/grievances" icon={<CircleAlert />}>
          Grievances
        </CaptureLink>
        <CaptureLink href="/citizen/support" icon={<HelpCircle />}>
          Help & Support
        </CaptureLink>
        <CaptureLink href="/citizen/settings" icon={<Settings />}>
          Settings
        </CaptureLink>
      </nav>
      <Card className="mt-auto border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-emerald-700">
                Trust Score
              </p>
              <strong className="text-2xl">
                --<small className="text-sm text-slate-500">/100</small>
              </strong>
            </div>
          </div>
          <p className="mt-3 text-[12px] text-slate-500">
            Build your score with verified checks.
          </p>
        </CardContent>
      </Card>
      <div className="mt-4 flex items-center gap-3 px-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-[13px] font-bold text-emerald-800">
          {profile?.name?.[0] || "C"}
        </span>
        <span>
          <strong className="block text-[13px]">
            {profile?.name || "Citizen"}
          </strong>
          <small className="text-[11px] text-slate-500">Citizen</small>
        </span>
        <ChevronRight className="ml-auto size-4 text-slate-400" />
      </div>
    </aside>
  );
}
function CaptureLink({
  href,
  icon,
  children,
  active = false,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium ${active ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-100"}`}
    >
      <span className="[&>svg]:size-[18px]">{icon}</span>
      {children}
    </Link>
  );
}
function StatusItem({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white text-emerald-700">
        {icon}
      </span>
      <span>
        <strong className="block text-[12px] font-medium text-slate-500">
          {label}
        </strong>
        <span className="mt-1 block text-[14px] font-semibold">{value}</span>
        {detail && (
          <small className="mt-1 block text-[11px] text-slate-500">
            {detail}
          </small>
        )}
      </span>
    </div>
  );
}
function BinUploadCard({
  bin,
  files,
  onAdd,
  onRemove,
}: {
  bin: (typeof bins)[number];
  files: File[];
  onAdd: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <Card
      className={`overflow-hidden border-slate-200 border-t-2 ${bin.border}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-full text-white ${bin.tone}`}
          >
            <Recycle className="size-5" />
          </span>
          <div className="min-w-0">
            <strong className="block text-[14px]">{bin.title}</strong>
            <p className="mt-1 text-[12px] font-medium text-slate-700">
              {bin.detail}
            </p>
            <p className="mt-2 text-[11px] leading-4 text-slate-500">
              {bin.contents}
            </p>
            <span
              className={`mt-3 inline-flex rounded px-2 py-1 text-[10px] font-semibold ${bin.required ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
            >
              {bin.required ? "Required" : "Optional"}
            </span>
          </div>
        </div>
        <label className="mt-4 grid min-h-28 cursor-pointer place-items-center rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-center text-[12px] hover:border-emerald-500 hover:bg-emerald-50">
          <span>
            <Camera className="mx-auto mb-2 size-6 text-slate-600" />
            <strong className="block">Add Photo</strong>
            <span className="mt-1 block text-slate-500">
              or click to capture
            </span>
            <small className="mt-2 block text-slate-400">Max 2 photos</small>
          </span>
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={(event) => onAdd(event.target.files)}
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <PhotoPreview
              key={`${file.name}-${index}`}
              file={file}
              label={bin.title}
              onRemove={() => onRemove(index)}
            />
          ))}
        </div>
        <p className="mt-3 text-center text-[12px] font-semibold text-slate-600">
          {files.length} / 2 photos
        </p>
      </CardContent>
    </Card>
  );
}
function PhotoPreview({
  file,
  label,
  onRemove,
}: {
  file: File;
  label: string;
  onRemove: () => void;
}) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <div className="relative size-[76px] overflow-hidden rounded-md border border-slate-200">
      <img
        className="size-full object-cover"
        src={src}
        alt={`${label} preview`}
      />
      <button
        type="button"
        className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-white text-slate-700"
        onClick={onRemove}
        aria-label={`Remove ${label} photo`}
      >
        ×
      </button>
    </div>
  );
}
function About({
  icon,
  title,
  copy,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex gap-3 rounded-md bg-emerald-50/60 p-4">
      <span className="text-emerald-700">{icon}</span>
      <div>
        <strong className="block text-[14px] text-emerald-800">{title}</strong>
        <p className="mt-1 text-[12px] leading-5 text-slate-600">{copy}</p>
      </div>
    </div>
  );
}
function Guideline({
  icon,
  title,
  copy,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
        {icon}
      </span>
      <div>
        <strong className="block text-[13px]">{title}</strong>
        <p className="mt-1 text-[12px] leading-5 text-slate-500">{copy}</p>
      </div>
    </div>
  );
}
function MapPinIcon() {
  return <LocateFixed className="size-5" />;
}
function ResultScreen({
  result,
  onRetry,
}: {
  result: Submission;
  onRetry: () => void;
}) {
  const approved = result.status === "APPROVED";
  const [showDetails, setShowDetails] = useState(false);
  const [notice, setNotice] = useState("");
  const qrSource = result.qrCodeBase64
    ? `data:image/png;base64,${result.qrCodeBase64}`
    : "";
  const descriptions: Record<BinColor, string> = {
    GREEN: "Food scraps, vegetable peels, leaves and garden waste",
    BLUE: "Paper, cardboard, plastic, glass and metal",
    RED: "Sanitary pads, diapers, bandages and tissues",
    BLACK: "Batteries, e-waste, chemicals and expired medicines",
  };
  const colors: Record<BinColor, string> = {
    GREEN: "bg-emerald-600",
    BLUE: "bg-blue-600",
    RED: "bg-red-600",
    BLACK: "bg-slate-800",
  };

  function downloadQr() {
    if (!qrSource) return;
    const link = document.createElement("a");
    link.href = qrSource;
    link.download = `civicmitra-pickup-${result.submissionId}.png`;
    link.click();
    setNotice("QR image downloaded.");
  }
  async function shareQr() {
    const message = `My CivicMitra pickup QR is active until ${formatDate(result.qrExpiresAt)}.`;
    try {
      if (navigator.share)
        await navigator.share({ title: "CivicMitra pickup QR", text: message });
      else {
        await navigator.clipboard.writeText(result.qrToken || message);
        setNotice("Pickup token copied to your clipboard.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setNotice("Unable to share the QR from this device.");
    }
  }

  if (!approved)
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
        <Card className="w-full max-w-xl border-slate-200">
          <CardContent className="p-7 text-center sm:p-10">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <TriangleAlert className="size-7" />
            </span>
            <h1 className="mt-5 text-3xl font-semibold">
              {result.status === "PENDING_RETRY"
                ? "A quick update is needed"
                : "Verification not approved"}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[16px] leading-7 text-slate-600">
              {result.failureReason || "Review your bin photos and try again."}
            </p>
            <Button className="mt-7 h-11" onClick={onRetry}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </main>
    );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-10"
            aria-label="Back to dashboard"
          >
            <ArrowLeft />
          </Button>
          <span className="hidden items-center gap-3 sm:flex">
            <span className="grid size-10 place-items-center rounded-full bg-emerald-700 text-white">
              <Leaf className="size-5" />
            </span>
            <span>
              <strong className="block text-2xl leading-none text-emerald-950">
                CivicMitra
              </strong>
              <small className="block pt-1 text-[11px] text-slate-500">
                Clean City. Better Tomorrow.
              </small>
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/citizen/notifications">
            <Button
              variant="ghost"
              size="icon"
              className="relative size-10"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              <span className="absolute right-0 top-0 grid size-4 place-items-center rounded-full bg-rose-500 text-[10px] text-white">
                3
              </span>
            </Button>
          </Link>
          <span className="grid size-10 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
            {readSession()?.name?.[0] || "C"}
          </span>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:py-10">
        <div className="grid gap-7 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
          <section className="px-2 py-5 text-center lg:text-left">
            <span className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-600 text-white lg:mx-0">
              <CheckCircle2 className="size-11" />
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
              Verification
              <br />
              <span className="text-emerald-700">successful.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-8 text-slate-600">
              Your waste is well segregated. Thank you for keeping your
              neighbourhood clean and green.
            </p>
            <div className="mt-7 inline-flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-left">
              <ShieldCheck className="size-6 text-emerald-700" />
              <div>
                <p className="font-semibold text-emerald-900">
                  Submission #{result.submissionId}
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                  Submitted {formatDate(result.submittedAt)}
                </p>
              </div>
            </div>
          </section>
          <Card className="border-slate-200">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Your Green QR code</h2>
                  <p className="mt-2 text-[15px] leading-6 text-slate-600">
                    Show this code to the sanitation worker during pickup.
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-700">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
              <img
                className="mx-auto mt-6 aspect-square w-full max-w-[270px] rounded-lg border border-slate-200 bg-white p-3"
                src={qrSource}
                alt="Active household pickup QR code"
              />
              <div className="mt-5 flex items-center justify-center gap-2 rounded-md bg-emerald-50 py-3 font-semibold text-emerald-800">
                <QrCode className="size-5" />
                Valid until {formatDate(result.qrExpiresAt)}
              </div>
            </CardContent>
          </Card>
        </div>
        <section className="mt-7 grid divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <ResultMetric
            icon={<Award />}
            label="Overall score"
            value={`${Math.round(result.overallScore)}%`}
            detail="Excellent"
            tone="emerald"
          />
          <ResultMetric
            icon={<BarChart3 />}
            label="Attempt number"
            value={`${result.attemptNumber} / 3`}
            detail="Today"
            tone="blue"
          />
          <ResultMetric
            icon={<CalendarDays />}
            label="Next pickup"
            value="Tomorrow"
            detail="7:00 AM - 9:00 AM"
            tone="amber"
          />
          <ResultMetric
            icon={<Gift />}
            label="Rewards earned"
            value="+20"
            detail="Green points"
            tone="violet"
          />
        </section>
        <Card className="mt-7 border-slate-200">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">AI analysis results</h2>
                <p className="mt-1 text-sm text-slate-500">
                  All verified bins passed the segregation check.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800">
                <CheckCircle2 className="size-4" />
                All bins passed
              </span>
            </div>
            <div className="mt-5 divide-y divide-slate-100">
              {result.binResults.map((bin) => (
                <div key={bin.binType} className="flex items-center gap-3 py-4">
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-md text-white ${colors[bin.binType]}`}
                  >
                    <Recycle className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {bin.binType === "GREEN"
                        ? "Green bin (Wet Waste)"
                        : bin.binType === "BLUE"
                          ? "Blue bin (Dry Waste)"
                          : bin.binType === "RED"
                            ? "Red bin (Sanitary Waste)"
                            : "Black bin (Hazardous Waste)"}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-500">
                      {bin.contaminationDetail || descriptions[bin.binType]}
                    </p>
                    {showDetails && (
                      <p className="mt-2 text-sm text-emerald-700">
                        AI confidence: {Math.round(bin.aiConfidence * 100)}%
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                      Passed
                      <CheckCircle2 className="size-4" />
                    </span>
                    <strong className="mt-1 block">
                      {Math.round(bin.aiConfidence * 100)}%
                    </strong>
                  </div>
                </div>
              ))}
            </div>
            <Button
              className="mt-5 h-11 w-full bg-emerald-700 text-[15px] hover:bg-emerald-800"
              onClick={() => setShowDetails((current) => !current)}
            >
              <Eye className="size-4" />
              {showDetails ? "Hide details" : "View details"}
              <ChevronRight className="ml-auto size-4" />
            </Button>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                className="h-11 border-slate-200 text-[15px]"
                onClick={downloadQr}
              >
                <Download className="size-4" />
                Download QR
              </Button>
              <Button
                variant="outline"
                className="h-11 border-slate-200 text-[15px]"
                onClick={shareQr}
              >
                <Share2 className="size-4" />
                Share QR
              </Button>
            </div>
            {notice && (
              <Alert className="mt-4 border-emerald-100 bg-emerald-50 text-emerald-900">
                {notice}
              </Alert>
            )}
            <div className="mt-5 flex gap-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-4">
              <Leaf className="mt-0.5 size-5 shrink-0 text-emerald-700" />
              <div>
                <p className="font-semibold text-emerald-900">Great job</p>
                <p className="mt-1 text-sm leading-5 text-emerald-800">
                  Keep maintaining good segregation. Your efforts make the city
                  cleaner every day.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
function ResultMetric({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "emerald" | "blue" | "amber" | "violet";
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };
  return (
    <div className="p-5 text-center">
      <span
        className={`mx-auto grid size-10 place-items-center rounded-full ${colors[tone]}`}
      >
        {icon}
      </span>
      <p className="mt-3 text-sm font-medium text-slate-600">{label}</p>
      <strong className="mt-2 block text-2xl font-semibold">{value}</strong>
      <p
        className={`mt-1 text-sm font-medium ${tone === "emerald" ? "text-emerald-700" : tone === "blue" ? "text-blue-700" : tone === "amber" ? "text-amber-700" : "text-violet-700"}`}
      >
        {detail}
      </p>
    </div>
  );
}
function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "--";
}
