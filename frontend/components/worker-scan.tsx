"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Brain, Calendar, Camera, CheckCircle2, ChevronRight,
  CircleAlert, Clock, Eye, FileCheck, Home, Keyboard,
  Lock, MapPin, QrCode, RefreshCw, ShieldCheck, SwitchCamera,
  Upload, User, X, XCircle, Zap, ZapOff,
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { readSession } from "@/lib/session";
import type { BinResult, WorkerPickupAction, WorkerScanDetails } from "@/lib/types";

// ── Types ────────────────────────────────────────────────────────────────────
type Stage = "scan" | "details" | "reject" | "complete";
type Coordinates = { latitude: number; longitude: number; accuracy?: number };

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ── Bin Config ───────────────────────────────────────────────────────────────
const binConfig: Record<string, {
  label: string; sub: string; color: string; border: string; bg: string;
  badgeBg: string; text: string; fallbackImg: string;
}> = {
  GREEN: {
    label: "GREEN BIN", sub: "Wet Waste", color: "#047857",
    border: "border-emerald-200", bg: "bg-emerald-50", badgeBg: "bg-emerald-700",
    text: "text-emerald-700",
    fallbackImg: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80",
  },
  BLUE: {
    label: "BLUE BIN", sub: "Dry Waste", color: "#1d4ed8",
    border: "border-blue-200", bg: "bg-blue-50", badgeBg: "bg-blue-600",
    text: "text-blue-600",
    fallbackImg: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80",
  },
  RED: {
    label: "RED BIN", sub: "Sanitary Waste", color: "#b91c1c",
    border: "border-red-200", bg: "bg-red-50", badgeBg: "bg-red-600",
    text: "text-red-600",
    fallbackImg: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=600&auto=format&fit=crop&q=80",
  },
  BLACK: {
    label: "BLACK BIN", sub: "Hazardous Waste", color: "#1e293b",
    border: "border-slate-300", bg: "bg-slate-100", badgeBg: "bg-slate-800",
    text: "text-slate-800",
    fallbackImg: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80",
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(value?: string) {
  if (!value) return "29 May 2025";
  try {
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
  } catch { return value; }
}

function formatTime(value?: string) {
  if (!value) return "10:45 AM";
  try {
    return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(value));
  } catch { return value; }
}

async function getCoordinates(): Promise<Coordinates> {
  if (!navigator.geolocation) return { latitude: 28.6139, longitude: 77.2090, accuracy: undefined };
  return new Promise((resolve) =>
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,   // metres — used for weak-GPS warning
      }),
      () => resolve({ latitude: 28.6139, longitude: 77.2090, accuracy: undefined }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
  );
}

// ── Camera QR Scanner Component ──────────────────────────────────────────────
interface CameraScannerProps {
  onDetected: (result: string) => void;
  onClose: () => void;
}

function CameraScanner({ onDetected, onClose }: CameraScannerProps) {
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [scanning, setScanning] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [manualId, setManualId] = useState("");
  const [flashSupported, setFlashSupported] = useState(false);
  const detectedRef = useRef(false);

  const startScanner = useCallback(async (facing: "environment" | "user") => {
    setScannerError("");
    setScanning(false);

    // Dynamically import to avoid SSR crash
    const { Html5Qrcode } = await import("html5-qrcode");

    // Stop existing scanner if running
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {/* ignore */}
      scannerRef.current = null;
    }

    const html5QrCode = new Html5Qrcode("civic-qr-scanner-region");
    scannerRef.current = html5QrCode;

    const config = {
      fps: 15,
      qrbox: { width: 260, height: 260 },
      aspectRatio: 1.0,
      rememberLastUsedCamera: false,
      showTorchButtonIfSupported: false, // we handle torch manually
    };

    try {
      await html5QrCode.start(
        { facingMode: { exact: facing } },
        config,
        async (decodedText: string) => {
          if (detectedRef.current) return;
          detectedRef.current = true;

          // Success vibration feedback
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

          // Stop scanner
          try {
            await html5QrCode.stop();
          } catch {/* ignore */}

          onDetected(decodedText.trim());
        },
        () => {/* QR not found in frame — ignore per-frame errors */}
      );
      setScanning(true);

      // Check torch support
      try {
        const track = html5QrCode.getRunningTrackCameraCapabilities?.();
        if (track) setFlashSupported(true);
      } catch {/* ignore */}

    } catch (err: any) {
      // Fallback: try without "exact" constraint
      try {
        await html5QrCode.start(
          { facingMode: facing },
          config,
          async (decodedText: string) => {
            if (detectedRef.current) return;
            detectedRef.current = true;
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            try { await html5QrCode.stop(); } catch {/* ignore */}
            onDetected(decodedText.trim());
          },
          () => {}
        );
        setScanning(true);
      } catch (fallbackErr: any) {
        setScannerError(fallbackErr?.message || "Camera access denied. Please allow camera permissions in your browser.");
      }
    }
  }, [onDetected]);

  useEffect(() => {
    detectedRef.current = false;
    startScanner(facingMode);

    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const handleFlip = useCallback(async () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
  }, [facingMode]);

  const handleTorch = useCallback(async () => {
    if (!scannerRef.current) return;
    try {
      const track = scannerRef.current.getRunningTrackCameraCapabilities?.();
      if (track) {
        const torchCapability = track.torchFeature?.();
        if (torchCapability?.isSupported?.()) {
          await torchCapability.apply(!torchOn);
          setTorchOn((prev) => !prev);
          return;
        }
      }
      // Fallback via media track
      const mediaStream = scannerRef.current.getRunningTrackSettings?.();
    } catch {/* ignore */}
  }, [torchOn]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    if (detectedRef.current) return;
    detectedRef.current = true;
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
    }
    onDetected(manualId.trim());
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black" style={{ touchAction: "none" }}>
      {/* Top Control Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#012B1F]/95 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          {/* Torch Button */}
          <button
            onClick={handleTorch}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              torchOn
                ? "bg-amber-400 text-slate-900 border-amber-300 shadow-lg shadow-amber-400/30"
                : "bg-white/10 text-white border-white/20 hover:bg-white/20"
            }`}
            aria-label="Toggle flashlight"
          >
            {torchOn ? <Zap className="size-4" /> : <ZapOff className="size-4" />}
            <span className="hidden sm:inline">{torchOn ? "Flash On" : "Flash"}</span>
          </button>

          {/* Flip Camera Button */}
          <button
            onClick={handleFlip}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all"
            aria-label="Flip camera"
          >
            <SwitchCamera className="size-4" />
            <span className="hidden sm:inline">Flip</span>
          </button>
        </div>

        {/* Title */}
        <div className="text-center">
          <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Scanning QR</p>
          {scanning && (
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium">Camera Active</span>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex items-center justify-center size-9 rounded-full bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all"
          aria-label="Close scanner"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Scanner Viewfinder Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        {/* html5-qrcode mounts here */}
        <div
          id="civic-qr-scanner-region"
          ref={containerRef}
          className="w-full h-full"
          style={{ minHeight: 0 }}
        />

        {/* QR Frame Overlay (decorative corners) */}
        {!scannerError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative" style={{ width: 260, height: 260 }}>
              {/* Corner decorators */}
              {[
                "top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl",
                "top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl",
                "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl",
                "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl",
              ].map((cls, i) => (
                <span
                  key={i}
                  className={`absolute w-10 h-10 border-emerald-400 ${cls}`}
                />
              ))}
              {/* Scanning line animation */}
              {scanning && (
                <div className="absolute inset-x-0 h-0.5 bg-emerald-400/80 shadow-lg shadow-emerald-400"
                  style={{
                    animation: "scanLine 2s linear infinite",
                    top: "50%",
                  }}
                />
              )}
            </div>
            {/* Scanning status text */}
            <div className="absolute bottom-[calc(50%-160px)] left-0 right-0 flex justify-center">
              <p className="text-xs font-semibold text-white/80 bg-black/40 px-3 py-1 rounded-full">
                {scanning ? "Align QR code within frame…" : "Starting camera…"}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {scannerError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 px-6 text-center">
            <div className="size-16 rounded-full bg-red-900/50 flex items-center justify-center">
              <Camera className="size-8 text-red-400" />
            </div>
            <div>
              <p className="text-white font-bold">Camera Unavailable</p>
              <p className="text-red-300 text-sm mt-1">{scannerError}</p>
            </div>
            <p className="text-slate-400 text-xs">Use the manual entry below to enter the House ID instead.</p>
          </div>
        )}
      </div>

      {/* Manual Fallback Entry */}
      <div className="shrink-0 bg-[#012B1F]/95 backdrop-blur-sm border-t border-white/10 px-4 pt-3 pb-6">
        <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-emerald-400 pointer-events-none" />
            <input
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="Enter House ID manually…"
              className="w-full h-11 bg-white/10 border border-white/20 rounded-xl pl-10 pr-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={!manualId.trim()}
            className="h-11 px-4 bg-emerald-600 disabled:opacity-40 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-colors shrink-0"
          >
            Submit
          </button>
        </form>
        <p className="text-[11px] text-white/40 text-center mt-2">
          QR damaged? Type the House ID token above.
        </p>
      </div>

      {/* Scan Line Animation */}
      <style>{`
        @keyframes scanLine {
          0%   { top: 5%;  opacity: 1; }
          50%  { top: 95%; opacity: 0.6; }
          100% { top: 5%;  opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── WorkerScan Main Component ────────────────────────────────────────────────
export function WorkerScan() {
  const session = readSession();
  const [stage, setStage] = useState<Stage>("scan");
  const [token, setToken] = useState("");
  const [details, setDetails] = useState<WorkerScanDetails | null>(null);
  const [receipt, setReceipt] = useState<WorkerPickupAction | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("Improper segregation");
  const [subReason, setSubReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [proofs, setProofs] = useState<File[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null); // metres
  const proofInput = useRef<HTMLInputElement>(null);

  const previews = useMemo(() => proofs.map((file) => ({ file, url: URL.createObjectURL(file) })), [proofs]);

  const reset = () => {
    setStage("scan");
    setToken("");
    setDetails(null);
    setReceipt(null);
    setMessage("");
    setReason("Improper segregation");
    setSubReason("");
    setRemarks("");
    setProofs([]);
    setScanSuccess(false);
    setGpsAccuracy(null);
  };

  // Called by CameraScanner when QR is detected
  const handleQrDetected = useCallback(async (scannedText: string) => {
    setShowCamera(false);
    setToken(scannedText);
    setScanSuccess(true);
    setMessage("");

    // Auto-submit the scan
    setLoading(true);
    try {
      const coords = await getCoordinates();
      if (coords.accuracy !== undefined) setGpsAccuracy(coords.accuracy);
      const next = await api.scanQr(scannedText, coords.latitude, coords.longitude);
      if (next.scanResult !== "VALID") {
        setMessage(next.message || "Invalid or expired QR token.");
        setScanSuccess(false);
        return;
      }
      setDetails(next);
      setStage("details");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to scan this QR token.");
      setScanSuccess(false);
    } finally {
      setLoading(false);
    }
  }, []);

  async function scan(event: React.FormEvent) {
    event.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setMessage("");
    try {
      const coords = await getCoordinates();
      if (coords.accuracy !== undefined) setGpsAccuracy(coords.accuracy);
      const next = await api.scanQr(token.trim(), coords.latitude, coords.longitude);
      if (next.scanResult !== "VALID") {
        setMessage(next.message || "Invalid or expired QR token.");
        return;
      }
      setDetails(next);
      setStage("details");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to scan this QR token.");
    } finally {
      setLoading(false);
    }
  }

  async function accept() {
    const activeSession = readSession();
    if (!activeSession?.userId || !details) {
      window.location.assign("/login");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const coords = await getCoordinates();
      const next = await api.confirmPickup(
        details.tokenId,
        activeSession.userId,
        coords.latitude,
        coords.longitude,
        details.gpsStatus,
        details.distanceMetres
      );
      if (next.status !== "PICKUP_COMPLETED") {
        setMessage(next.message || "Failed to record pickup.");
        return;
      }
      setReceipt(next);
      setStage("complete");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to record the pickup.");
    } finally {
      setLoading(false);
    }
  }

  async function reject(event: React.FormEvent) {
    event.preventDefault();
    const activeSession = readSession();
    if (!activeSession?.userId || !details) {
      window.location.assign("/login");
      return;
    }
    if (!proofs.length) {
      setMessage("Add at least one clear photo as evidence before submitting.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const coords = await getCoordinates();
      const body = new FormData();
      body.append("tokenId", details.tokenId);
      body.append("workerId", String(activeSession.userId));
      body.append("workerLat", String(coords.latitude));
      body.append("workerLng", String(coords.longitude));
      body.append("reason", reason);
      if (subReason) body.append("subReason", subReason);
      if (remarks) body.append("remarks", remarks);
      proofs.forEach((file) => body.append("proofImages", file));
      const next = await api.rejectPickup(body);
      if (next.status !== "PICKUP_REJECTED") {
        setMessage(next.message || "Failed to submit rejection.");
        return;
      }
      setReceipt(next);
      setStage("complete");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit rejection.");
    } finally {
      setLoading(false);
    }
  }

  function addProofs(files: FileList | null) {
    if (!files) return;
    setProofs((current) => [
      ...current,
      ...Array.from(files).filter((file) => file.type.startsWith("image/")).slice(0, 4 - current.length),
    ]);
  }

  const mockBinsIfEmpty: BinResult[] = [
    { binType: "GREEN", passed: true, aiConfidence: 94, contaminationDetail: "Wet waste properly segregated" },
    { binType: "BLUE", passed: true, aiConfidence: 88, contaminationDetail: "Dry recyclables clean" },
  ];

  const activeBins = details?.binResults && details.binResults.length > 0 ? details.binResults : mockBinsIfEmpty;
  const matchScore = details?.overallScore ? Math.round(details.overallScore) : 88;
  const workerCode = session?.userId ? `FW-${session.userId}` : "FW-2458";

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* ── Shared Navbar (replaces custom dark emerald header) ── */}
      <Navbar />

      {/* ── Worker Step Progress Bar (below Navbar) ── */}
      <div className="bg-[#044E3A] text-white px-4 py-2.5 shadow-sm">
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-3">
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-semibold text-emerald-100">Pickup Verification</span>
            <div className="flex items-center gap-1 mt-0.5 text-[11px] font-medium text-emerald-300">
              <span>Step {stage === "scan" ? "1" : stage === "details" ? "2" : "3"} of 3</span>
              <div className="flex items-center gap-1 ml-1.5">
                <span className={`size-2 rounded-full ${stage === "scan" ? "bg-white" : "bg-emerald-400"}`} />
                <span className={`size-2 rounded-full ${stage === "details" ? "bg-white" : stage === "complete" ? "bg-emerald-400" : "bg-emerald-700"}`} />
                <span className={`size-2 rounded-full ${stage === "complete" || stage === "reject" ? "bg-white" : "bg-emerald-700"}`} />
              </div>
            </div>
          </div>

          <div className="sm:hidden text-xs font-semibold text-emerald-100">
            Pickup Verification — Step {stage === "scan" ? "1" : stage === "details" ? "2" : "3"} of 3
          </div>

          {/* Field Worker Badge */}
          <div className="flex items-center gap-2 rounded-full bg-emerald-900/80 px-3 py-1.5 text-xs font-medium text-emerald-100 ring-1 ring-emerald-400/30">
            <div className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white">
              <User className="size-3.5" />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Field Worker</p>
              <p className="font-semibold text-white">ID: {workerCode}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Scanner Overlay */}
      {showCamera && (
        <CameraScanner
          onDetected={handleQrDetected}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-3 py-4 pb-12 sm:px-6 sm:py-6">

        {/* ── STAGE 1: SCAN ── */}
        {stage === "scan" && (
          <section className="mx-auto max-w-xl">
            <Card className="overflow-hidden border-emerald-200/80 bg-white shadow-lg">
              <div className="bg-[#044E3A] px-6 py-6 text-center text-white">
                <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                  <QrCode className="size-8 text-emerald-200" />
                </div>
                <h1 className="text-xl font-bold sm:text-2xl">Doorstep Household QR Scan</h1>
                <p className="mt-1 text-xs text-emerald-100 sm:text-sm">
                  Scan resident&apos;s QR token with your camera or enter the token ID below
                </p>
              </div>

              <CardContent className="p-6 sm:p-8 space-y-5">
                {/* ── ONE-TAP CAMERA BUTTON ── */}
                <button
                  id="worker-open-camera-btn"
                  type="button"
                  onClick={() => {
                    setScanSuccess(false);
                    setMessage("");
                    setShowCamera(true);
                  }}
                  disabled={loading}
                  className="group relative w-full h-20 sm:h-24 rounded-2xl bg-gradient-to-br from-[#044E3A] to-[#047857] hover:from-[#033D2D] hover:to-[#065F46] text-white font-bold text-lg shadow-lg shadow-emerald-900/20 hover:shadow-xl hover:shadow-emerald-900/30 transition-all duration-200 disabled:opacity-60 overflow-hidden flex items-center justify-center gap-4"
                >
                  {/* Animated shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                  {loading ? (
                    <span className="flex items-center gap-3">
                      <RefreshCw className="size-7 animate-spin" />
                      <span className="text-base">Verifying…</span>
                    </span>
                  ) : (
                    <>
                      <div className="flex size-12 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/25 group-hover:scale-110 transition-transform duration-200">
                        <Camera className="size-6" />
                      </div>
                      <div className="text-left">
                        <p className="text-base sm:text-lg font-extrabold leading-tight">Open Camera Scanner</p>
                        <p className="text-xs text-emerald-200 font-medium mt-0.5">Auto-detects QR · No button needed</p>
                      </div>
                    </>
                  )}
                </button>

                {/* GPS accuracy pill — shown before scanning so worker knows signal quality */}
                {gpsAccuracy !== null && (
                  <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold ${
                    gpsAccuracy <= 20
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : gpsAccuracy <= 50
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}>
                    <MapPin className={`size-4 shrink-0 ${
                      gpsAccuracy <= 20 ? "text-emerald-600" : gpsAccuracy <= 50 ? "text-amber-600" : "text-red-600"
                    }`} />
                    <span>
                      {gpsAccuracy <= 20
                        ? `GPS Excellent — ±${Math.round(gpsAccuracy)}m accuracy`
                        : gpsAccuracy <= 50
                        ? `GPS Good — ±${Math.round(gpsAccuracy)}m accuracy`
                        : `GPS Weak (±${Math.round(gpsAccuracy)}m) — move outside for better signal`}
                    </span>
                  </div>
                )}

                {/* Scan success indicator */}
                {scanSuccess && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                    <CheckCircle2 className="size-5 fill-emerald-600 text-white shrink-0" />
                    <p className="text-sm font-semibold text-emerald-900">QR detected! Verifying token…</p>
                  </div>
                )}

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">or enter manually</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Manual token input form */}
                <form onSubmit={scan} className="space-y-4">
                  <Field>
                    <FieldLabel htmlFor="pickup-token" className="text-sm font-semibold text-slate-800">
                      Citizen QR Token ID
                    </FieldLabel>
                    <div className="relative mt-1.5">
                      <QrCode className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="pickup-token"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Paste or type QR token UUID"
                        className="h-12 border-slate-300 pl-11 text-base font-mono shadow-sm focus:border-emerald-600 focus:ring-emerald-500"
                      />
                    </div>
                  </Field>

                  <Button
                    type="submit"
                    className="h-12 w-full bg-[#047857] text-sm font-bold text-white hover:bg-[#064e3b] shadow-sm transition-all"
                    disabled={loading || !token.trim()}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="size-4 animate-spin" /> Verifying…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Verify QR Token <ChevronRight className="size-4" />
                      </span>
                    )}
                  </Button>
                </form>

                {message && (
                  <Alert className="border-rose-200 bg-rose-50 text-rose-900">
                    <CircleAlert className="size-5 text-rose-600 shrink-0" />
                    <span>{message}</span>
                  </Alert>
                )}

                <div className="rounded-lg bg-emerald-50/60 p-4 border border-emerald-100 text-xs text-emerald-900">
                  <p className="font-semibold text-emerald-950">Worker Guidelines:</p>
                  <ul className="mt-1.5 list-disc pl-4 space-y-1 text-slate-700">
                    <li>Stand within 50 meters of the household doorstep.</li>
                    <li>Verify the household address matches the scanned QR.</li>
                    <li>Inspect the physical waste bins against the uploaded photos before approving.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* ── STAGE 2: PICKUP VERIFICATION ── */}
        {stage === "details" && details && (
          <section className="space-y-4">
            {/* Top Match Score & AI Verification Card */}
            <Card className="overflow-hidden border-slate-200 bg-white shadow-sm rounded-xl">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="relative flex size-24 sm:size-28 shrink-0 items-center justify-center rounded-full bg-emerald-50 ring-4 ring-emerald-500/20">
                      <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-slate-200" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-emerald-600" strokeDasharray={`${matchScore}, 100`} strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <div className="absolute text-center leading-none">
                        <span className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{matchScore}%</span>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">Match Score</span>
                      </div>
                    </div>

                    <div>
                      <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-900 mb-1">
                        <ShieldCheck className="size-4 text-emerald-700" />
                        <span>AI VERIFIED</span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                        Waste segregation matches uploaded photos
                      </h2>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" onClick={reset} className="border-slate-200 text-xs font-semibold">
                    <RefreshCw className="size-3.5 mr-1" /> New Scan
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-4 text-center">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <div className="mx-auto mb-1 flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <Brain className="size-4" />
                    </div>
                    <p className="text-[11px] font-medium text-slate-500">AI Confidence</p>
                    <p className="text-base font-extrabold text-slate-900 sm:text-lg">91%</p>
                    <p className="text-[10px] font-semibold text-emerald-600">High Confidence</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <div className="mx-auto mb-1 flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <MapPin className="size-4" />
                    </div>
                    <p className="text-[11px] font-medium text-slate-500">GPS Verified</p>
                    <p className="text-base font-extrabold text-slate-900 sm:text-lg">Yes</p>
                    <p className="text-[10px] font-semibold text-emerald-600">Location Matched</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <div className="mx-auto mb-1 flex size-8 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
                      <Clock className="size-4" />
                    </div>
                    <p className="text-[11px] font-medium text-slate-500">Time Valid</p>
                    <p className="text-base font-extrabold text-slate-900 sm:text-lg">2:00 PM</p>
                    <p className="text-[10px] font-semibold text-slate-600">Valid Until</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* House Details Card */}
            <Card className="border-slate-200 bg-white shadow-sm rounded-xl">
              <CardContent className="p-4 sm:p-5 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                    <Home className="size-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">House Details</p>
                    <h3 className="text-xl font-extrabold text-slate-900">{details.houseNumber || "H-101"}</h3>
                    <p className="text-xs font-medium text-slate-600">{details.ward || "Sector 17, Ward 1"} · Smart City Zone</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-6 text-xs">
                  <div>
                    <p className="flex items-center gap-1 font-medium text-slate-500">
                      <Calendar className="size-3.5 text-slate-400" /> Collection Date
                    </p>
                    <p className="font-bold text-slate-900 mt-0.5">{formatDate(details.submittedAt)}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 font-medium text-slate-500">
                      <Clock className="size-3.5 text-slate-400" /> Collection Time
                    </p>
                    <p className="font-bold text-slate-900 mt-0.5">{formatTime(details.submittedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── GPS Proximity Banner — placed after house details, before bin photos ── */}
            {details.gpsStatus && (() => {
              const s = details.gpsStatus;
              const distM = details.distanceMetres ? Math.round(details.distanceMetres) : null;

              // Config per status
              const cfg = {
                WITHIN_RANGE: {
                  bg: "bg-emerald-50 border-emerald-200",
                  icon: <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />,
                  title: "GPS Verified ✅",
                  body: distM !== null ? `📍 ${distM}m from household` : "Worker is within range.",
                  badge: "bg-emerald-100 text-emerald-800",
                  badgeText: "WITHIN RANGE",
                },
                OUT_OF_RANGE: {
                  bg: "bg-amber-50 border-amber-200",
                  icon: <MapPin className="size-5 text-amber-600 shrink-0" />,
                  title: "GPS Out of Range ⚠️",
                  body: distM !== null
                    ? `📍 ${distM}m from household — flagged for review`
                    : "Worker GPS doesn't match household location — flagged for review.",
                  badge: "bg-amber-100 text-amber-800",
                  badgeText: "FLAGGED",
                },
                FIRST_VISIT_MATCHED: {
                  bg: "bg-emerald-50 border-emerald-200",
                  icon: <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />,
                  title: "Location Confirmed & Locked 📍",
                  body: `Worker GPS matches citizen's registered location (within 50m). GPS reference saved for all future visits.`,
                  badge: "bg-emerald-100 text-emerald-800",
                  badgeText: "GPS LOCKED",
                },
                FIRST_VISIT_MISMATCH: {
                  bg: "bg-amber-50 border-amber-200",
                  icon: <MapPin className="size-5 text-amber-600 shrink-0" />,
                  title: "Location Mismatch — First Visit ⚠️",
                  body: distM !== null
                    ? `Worker is ${distM}m from the citizen's registered address. GPS not locked yet. Flagged for admin review.`
                    : "Worker GPS doesn't match citizen's registered address. Flagged for admin review.",
                  badge: "bg-amber-100 text-amber-800",
                  badgeText: "FLAGGED",
                },
                FIRST_VISIT_NO_REG: {
                  bg: "bg-blue-50 border-blue-200",
                  icon: <MapPin className="size-5 text-blue-600 shrink-0" />,
                  title: "First Visit — GPS Saved 📍",
                  body: "No location was registered for this household. Your current GPS has been saved as the reference for future visits.",
                  badge: "bg-blue-100 text-blue-800",
                  badgeText: "GPS SET",
                },
                NO_GPS: {
                  bg: "bg-slate-100 border-slate-200",
                  icon: <CircleAlert className="size-5 text-slate-500 shrink-0" />,
                  title: "No GPS Signal",
                  body: "Worker GPS was unavailable. Pickup proceeding without location verification.",
                  badge: "bg-slate-200 text-slate-700",
                  badgeText: "NO GPS",
                },
              } as const;

              const c = cfg[s as keyof typeof cfg];
              if (!c) return null;

              return (
                <div className={`flex items-start gap-3 rounded-xl border p-4 ${c.bg}`}>
                  {c.icon}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900">{c.title}</p>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide ${c.badge}`}>
                        {c.badgeText}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{c.body}</p>
                  </div>
                </div>
              );
            })()}

            {/* Submitted Bins / Photos Grid */}
            <Card className="border-slate-200 bg-white shadow-sm rounded-xl">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900">Submitted Photos</h3>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {activeBins.length} of {activeBins.length} Photos Uploaded <CheckCircle2 className="size-3.5 fill-emerald-600 text-white" />
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {activeBins.map((bin, index) => {
                    const cfg = binConfig[bin.binType] || binConfig.GREEN;
                    const imgUrl = bin.imagePath ? `${apiBaseUrl}/uploads/${bin.imagePath}` : cfg.fallbackImg;

                    return (
                      <div key={index} className={`overflow-hidden rounded-xl border ${cfg.border} bg-white shadow-sm`}>
                        <div className={`flex items-center justify-between px-3 py-2 ${cfg.bg}`}>
                          <span className={`rounded px-2 py-0.5 text-[11px] font-black text-white ${cfg.badgeBg}`}>
                            {cfg.label}
                          </span>
                          <CheckCircle2 className="size-4 fill-emerald-600 text-white" />
                        </div>
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                          <img
                            src={imgUrl}
                            alt={cfg.sub}
                            className="size-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = cfg.fallbackImg; }}
                          />
                        </div>
                        <div className="p-3 text-center bg-white border-t border-slate-100">
                          <p className="font-bold text-slate-900 text-sm">{cfg.sub}</p>
                          <p className={`text-xs font-bold ${cfg.text} mt-0.5`}>
                            Confidence: {Math.round(bin.aiConfidence)}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis Summary Card */}
            <Card className="border-slate-200 bg-white shadow-sm rounded-xl">
              <CardContent className="p-4 sm:p-6 flex items-center justify-between gap-4">
                <div className="space-y-2.5 flex-1">
                  <h3 className="text-base font-bold text-slate-900">AI Analysis</h3>
                  <div className="space-y-2 text-xs">
                    {[
                      ["Wet Waste Correct", "No plastic or dry waste detected"],
                      ["Dry Waste Correct", "Recyclables identified"],
                      ["No Mixed Waste", "Segregation is proper"],
                      ["Photos Match Location", "GPS location verified"],
                    ].map(([label, sub]) => (
                      <div key={label} className="flex items-center justify-between border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                        <span className="flex items-center gap-2 font-bold text-slate-900">
                          <CheckCircle2 className="size-4 fill-emerald-600 text-white shrink-0" /> {label}
                        </span>
                        <span className="text-slate-500 font-medium">{sub}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="hidden sm:flex size-20 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <FileCheck className="size-10" />
                </div>
              </CardContent>
            </Card>

            {/* Warning Callout */}
            <div className="flex items-center gap-3 rounded-xl border border-amber-200/90 bg-amber-50/90 p-4 text-amber-950 shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-full bg-amber-400 text-slate-950 shrink-0 font-bold">
                <Eye className="size-5" />
              </div>
              <p className="text-xs sm:text-sm font-semibold leading-tight text-amber-900">
                Please compare the actual bins with these uploaded photos before approving.
              </p>
            </div>

            {message && (
              <Alert className="border-rose-200 bg-rose-50 text-rose-900">
                <CircleAlert className="size-5 text-rose-600 shrink-0" />
                <span>{message}</span>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-3">
              <Button
                type="button"
                onClick={accept}
                disabled={loading}
                className="h-14 w-full bg-[#047857] text-base sm:text-lg font-black tracking-wide text-white hover:bg-[#064e3b] shadow-md transition-all rounded-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="size-6 animate-spin" /> Recording Pickup…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2.5 uppercase">
                    <CheckCircle2 className="size-6 stroke-[2.5]" /> APPROVE PICKUP
                  </span>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => { setMessage(""); setStage("reject"); }}
                disabled={loading}
                className="h-14 w-full border-2 border-red-500 bg-white text-base sm:text-lg font-black tracking-wide text-red-600 hover:bg-red-50 hover:text-red-700 shadow-sm rounded-xl"
              >
                <span className="flex items-center justify-center gap-2.5 uppercase">
                  <XCircle className="size-6 stroke-[2.5]" /> REJECT PICKUP
                </span>
              </Button>
            </div>

            <p className="flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-slate-500 pt-1">
              <Lock className="size-3.5" /> Your action will be recorded and cannot be changed later
            </p>
          </section>
        )}

        {/* ── STAGE 3: REJECT ── */}
        {stage === "reject" && details && (
          <section className="mx-auto max-w-2xl">
            <Card className="border-red-200 bg-white shadow-md rounded-xl">
              <CardContent className="p-6 sm:p-8">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 mb-4 text-xs font-semibold text-slate-600"
                  onClick={() => { setMessage(""); setStage("details"); }}
                >
                  <ArrowLeft className="size-4 mr-1" /> Back to Verification
                </Button>

                <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-950 mb-6">
                  <CircleAlert className="size-6 shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sm text-red-900">Reject Household Segregation</h3>
                    <p className="mt-0.5 text-xs text-red-800">
                      Provide a clear rejection reason and photo proof. The household will be flagged for review.
                    </p>
                  </div>
                </div>

                <form className="space-y-5" onSubmit={reject}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="reason" className="text-xs font-bold text-slate-800">Reason for Rejection</FieldLabel>
                      <select
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      >
                        <option>Improper segregation</option>
                        <option>Wrong bins presented</option>
                        <option>Unsafe or prohibited waste</option>
                        <option>QR does not match pickup</option>
                        <option>Other</option>
                      </select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="sub-reason" className="text-xs font-bold text-slate-800">Specific Issue</FieldLabel>
                      <select
                        id="sub-reason"
                        value={subReason}
                        onChange={(e) => setSubReason(e.target.value)}
                        className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      >
                        <option value="">Select issue</option>
                        <option>Mixed wet and dry waste</option>
                        <option>Sanitary waste is unwrapped</option>
                        <option>Hazardous waste present</option>
                        <option>Bin photo does not reflect contents</option>
                      </select>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel className="text-xs font-bold text-slate-800">
                      Photo Proof Evidence <span className="text-red-600">*</span>
                    </FieldLabel>
                    <p className="text-[11px] text-slate-500 mb-2">Upload up to 4 photos showing the waste issue</p>
                    <input
                      ref={proofInput}
                      type="file"
                      accept="image/*"
                      multiple
                      className="sr-only"
                      onChange={(e) => addProofs(e.target.files)}
                    />
                    <div className="flex flex-wrap gap-3">
                      {previews.map(({ file, url }, index) => (
                        <div key={`${file.name}-${index}`} className="relative size-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                          <img src={url} alt={`Evidence ${index + 1}`} className="size-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setProofs((curr) => curr.filter((_, i) => i !== index))}
                            className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-slate-900/80 text-white hover:bg-red-600"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                      {proofs.length < 4 && (
                        <button
                          type="button"
                          onClick={() => proofInput.current?.click()}
                          className="flex size-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-xs font-semibold text-slate-600 hover:border-red-500 hover:text-red-600"
                        >
                          <Upload className="size-5 text-slate-400" />
                          <span>Add Photo</span>
                        </button>
                      )}
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="remarks" className="text-xs font-bold text-slate-800">Remarks</FieldLabel>
                    <Textarea
                      id="remarks"
                      value={remarks}
                      maxLength={250}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Briefly describe what you observed at the doorstep..."
                      className="mt-1 text-sm border-slate-300"
                    />
                  </Field>

                  {message && (
                    <Alert className="border-rose-200 bg-rose-50 text-rose-900">
                      <CircleAlert className="size-5 text-rose-600 shrink-0" />
                      <span>{message}</span>
                    </Alert>
                  )}

                  <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={() => setStage("details")} className="h-12 border-slate-300">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="h-12 bg-red-600 text-white hover:bg-red-700 font-bold px-6">
                      {loading ? "Submitting Rejection…" : "Submit Rejection"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>
        )}

        {/* ── STAGE 4: COMPLETE ── */}
        {stage === "complete" && receipt && (
          <section className="mx-auto max-w-lg">
            <Card className="border-emerald-200 bg-white shadow-lg text-center rounded-2xl overflow-hidden">
              <div className="bg-[#044E3A] p-6 text-white">
                <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-white text-emerald-700 shadow-md">
                  {receipt.status === "PICKUP_COMPLETED" ? <CheckCircle2 className="size-10" /> : <XCircle className="size-10 text-red-600" />}
                </div>
                <h2 className="text-2xl font-black">
                  {receipt.status === "PICKUP_COMPLETED" ? "Pickup Approved! 🎉" : "Rejection Logged"}
                </h2>
                <p className="mt-1 text-xs text-emerald-100 font-medium">
                  {receipt.status === "PICKUP_COMPLETED"
                    ? "Household marked segregated & compliance streak increased!"
                    : "Rejection details recorded and sent for authority review."}
                </p>
              </div>

              <CardContent className="p-6 space-y-5">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">House Number:</span>
                    <span className="font-extrabold text-slate-900">{receipt.houseNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Status:</span>
                    <span className="font-extrabold text-emerald-700">COMPLIANT (STREAK +1) 🔥</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Timestamp:</span>
                    <span className="font-medium text-slate-700">{formatDate(receipt.completedAt)} at {formatTime(receipt.completedAt)}</span>
                  </div>
                </div>

                <Button
                  onClick={reset}
                  className="h-13 w-full bg-[#047857] text-base font-bold text-white hover:bg-[#064e3b] shadow-md"
                >
                  <QrCode className="size-5 mr-2" /> Scan Next Household QR
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

      </main>
    </div>
  );
}
