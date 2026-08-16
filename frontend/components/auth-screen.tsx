"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, CheckCircle2, LockKeyhole,
  Mail, Phone, UserRound, MessageSquare, Loader2,
  Eye, EyeOff, KeyRound, HardHat, Shield,
  Building2, ChevronLeft, ShieldCheck, UserCheck,
  HelpCircle, Info
} from "lucide-react";

import { api } from "@/lib/api";
import { saveSession } from "@/lib/session";
// Rule 1: Updated context import to app/_context/ (private directory)
import { useAuth } from "@/app/_context/AuthContext";
import { Logo } from "@/components/Logo";
import type { OtpSendResult, UserRole } from "@/lib/types";

// ── City Skyline SVG Watermark ────────────────────────────────────────────────

function CitySkylineBackground() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-0 opacity-[0.15] flex justify-center overflow-hidden">
      <svg
        viewBox="0 0 1440 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-7xl h-auto text-emerald-900"
      >
        <path
          d="M0 280V220H30V280H0ZM40 280V180H90V280H40ZM60 190H70V205H60V190ZM60 215H70V230H60V215ZM60 240H70V255H60V240ZM100 280V240H140V280H100ZM150 280V140H220V280H150ZM170 155H200V170H170V155ZM170 180H200V195H170V180ZM170 205H200V220H170V205ZM170 230H200V245H170V230ZM230 280V200H270V280H230ZM280 280V160H340V280H280ZM295 175H325V190H295V175ZM295 200H325V215H295V200ZM295 225H325V240H295V225ZM350 280V230H390V280H350ZM400 280V120H480V280H400ZM420 140H460V155H420V140ZM420 168H460V183H420V168ZM420 196H460V211H420V196ZM420 224H460V239H420V224ZM490 280V190H540V280H490ZM550 280V210H600V280H550ZM610 280V150H680V280H610ZM630 170H660V185H630V170ZM630 195H660V210H630V195ZM630 220H660V235H630V220ZM690 280V240H730V280H690ZM740 280V130H820V280H740ZM760 150H800V165H760V150ZM760 178H800V193H760V178ZM760 206H800V221H760V206ZM760 234H800V249H760V234ZM830 280V180H880V280H830ZM890 280V220H930V280H890ZM940 280V140H1010V280H940ZM960 160H990V175H960V160ZM960 185H990V200H960V185ZM960 210H990V225H960V210ZM1020 280V200H1070V280H1020ZM1080 280V160H1150V280H1080ZM1100 180H1130V195H1100V180ZM1100 205H1130V220H1100V205ZM1160 280V230H1210V280H1160ZM1220 280V150H1300V280H1220ZM1240 170H1280V185H1240V170ZM1240 195H1280V210H1240V195ZM1240 220H1280V235H1240V220ZM1310 280V190H1360V280H1310ZM1370 280V220H1440V280H1370Z"
          fill="currentColor"
        />
        <circle cx="35" cy="245" r="10" fill="currentColor" opacity="0.6" />
        <circle cx="225" cy="255" r="14" fill="currentColor" opacity="0.6" />
        <circle cx="545" cy="250" r="12" fill="currentColor" opacity="0.6" />
        <circle cx="885" cy="245" r="15" fill="currentColor" opacity="0.6" />
        <circle cx="1215" cy="250" r="11" fill="currentColor" opacity="0.6" />
      </svg>
    </div>
  );
}

// ── Role Configuration ────────────────────────────────────────────────────────

interface RoleConfig {
  value: UserRole;
  label: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  iconBgClass: string;
  iconColorClass: string;
  subtitleColorClass: string;
  bulletColorClass: string;
  badgeText?: string;
  features: string[];
}

const roleConfigs: RoleConfig[] = [
  {
    value: "CITIZEN",
    label: "Citizen",
    subtitle: "Resident Portal",
    description: "Submit bin photos, track segregation scores, earn Green QR tokens and compliance streaks.",
    icon: <UserRound className="size-6 text-emerald-700" />,
    iconBgClass: "bg-emerald-50 border border-emerald-100",
    iconColorClass: "text-[#047857]",
    subtitleColorClass: "text-emerald-700 font-semibold",
    bulletColorClass: "bg-emerald-600",
    features: [
      "Daily segregation reports",
      "Green QR tokens",
      "Compliance streaks",
      "Household dashboard"
    ],
  },
  {
    value: "WORKER",
    label: "Field Worker",
    subtitle: "Collection Staff",
    description: "Scan citizen QR codes, confirm or reject pickups, and log daily collection routes.",
    icon: <HardHat className="size-6 text-blue-600" />,
    iconBgClass: "bg-blue-50 border border-blue-100",
    iconColorClass: "text-blue-600",
    subtitleColorClass: "text-blue-600 font-semibold",
    bulletColorClass: "bg-blue-600",
    badgeText: "MOST POPULAR",
    features: [
      "PIN-based instant login",
      "QR code scanner",
      "Pickup confirmation",
      "Route logging"
    ],
  },
  {
    value: "AUTHORITY",
    label: "Authority",
    subtitle: "Municipal Officer",
    description: "Monitor ward-level compliance, review grievances, manage violations and generate reports.",
    icon: <Shield className="size-6 text-purple-600" />,
    iconBgClass: "bg-purple-50 border border-purple-100",
    iconColorClass: "text-purple-600",
    subtitleColorClass: "text-purple-600 font-semibold",
    bulletColorClass: "bg-purple-600",
    features: [
      "Ward analytics",
      "Complaint management",
      "Violation logs",
      "Compliance reports"
    ],
  },
  {
    value: "MUNICIPAL_ADMIN",
    label: "Municipal Admin",
    subtitle: "System Administrator",
    description: "Full system control — manage wards, workers, policies and all municipality-level settings.",
    icon: <Building2 className="size-6 text-amber-600" />,
    iconBgClass: "bg-amber-50 border border-amber-100",
    iconColorClass: "text-amber-600",
    subtitleColorClass: "text-amber-600 font-semibold",
    bulletColorClass: "bg-amber-600",
    features: [
      "Municipality control",
      "Worker management",
      "Ward configuration",
      "System settings"
    ],
  },
];

// ── OTP Verification Box Component ──────────────────────────────────────────

function OtpVerificationBox({ phone, onVerified }: { phone: string; onVerified: () => void }) {
  const [otp, setOtp] = useState("");
  const [otpResult, setOtpResult] = useState<OtpSendResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [verified, setVerified] = useState(false);

  async function sendOtp() {
    if (!/^[6-9][0-9]{9}$/.test(phone)) {
      setMessage("Enter a valid 10-digit Indian mobile number first.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await api.sendOtp(phone);
      setOtpResult(result);
      setMessage(result.status === "ALREADY_SENT"
        ? "An OTP was already sent. Please wait before requesting again."
        : "OTP sent! Check below for the code (testing mode).");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not send OTP.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    if (!otp || otp.length !== 6) { setMessage("Enter the 6-digit OTP."); return; }
    setBusy(true);
    setMessage("");
    try {
      await api.verifyOtp(phone, otp);
      setVerified(true);
      setMessage("✓ Phone verified!");
      onVerified();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Invalid or expired OTP.");
    } finally {
      setBusy(false);
    }
  }

  if (verified) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs font-bold text-emerald-800">
        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
        Phone number verified
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
        <MessageSquare className="size-4 text-[#047857]" />
        Verify Mobile Number
      </div>

      <button
        type="button"
        onClick={sendOtp}
        disabled={busy || !phone}
        className="h-9 w-full rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
        {otpResult ? "Resend Verification OTP" : "Send OTP"}
      </button>

      {otpResult?.otpForTesting && (
        <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">
            ⚠️ Backend Testing Mode — OTP
          </p>
          <p className="font-mono text-2xl font-black tracking-[0.3em] text-amber-900">
            {otpResult.otpForTesting}
          </p>
        </div>
      )}

      {otpResult && (
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="6-digit OTP"
            className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-center font-mono text-base tracking-widest text-slate-900 outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20"
          />
          <button
            type="button"
            onClick={verifyOtp}
            disabled={busy || otp.length !== 6}
            className="h-10 bg-[#047857] hover:bg-[#065f46] text-white px-4 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : "Verify"}
          </button>
        </div>
      )}

      {message && (
        <p className={`text-xs font-medium ${message.startsWith("✓") ? "text-emerald-700" : "text-slate-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

// ── Role Selection Step (Matches Screenshot 2) ────────────────────────────────

function RoleSelectionStep({ onSelectRole }: { onSelectRole: (role: RoleConfig) => void }) {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {/* Top Tag Pill */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-1.5 text-xs font-semibold text-emerald-800 shadow-2xs">
          <ShieldCheck className="size-4 text-[#047857]" />
          <span>CivicMitra – Clean City Platform</span>
        </div>
      </div>

      {/* Main Title */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Who are you{" "}
          <span className="text-[#047857]">logging in as?</span>
        </h1>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          Select your role to access the right portal and tools.
        </p>
      </div>

      {/* 4 Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {roleConfigs.map((role) => (
          <div
            key={role.value}
            onClick={() => onSelectRole(role)}
            className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-xl hover:border-slate-300 transition-all duration-200 cursor-pointer"
          >
            {/* Optional Badge */}
            {role.badgeText && (
              <div className="absolute -top-3 right-4 rounded-md bg-[#047857] px-2.5 py-0.5 text-[10px] font-extrabold text-white tracking-wider shadow-xs">
                {role.badgeText}
              </div>
            )}

            <div>
              {/* Icon Container */}
              <div className={`flex size-12 items-center justify-center rounded-xl ${role.iconBgClass} mb-5 shadow-2xs`}>
                {role.icon}
              </div>

              {/* Title & Subtitle */}
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {role.label}
              </h3>
              <p className={`text-xs ${role.subtitleColorClass} mb-3`}>
                {role.subtitle}
              </p>

              {/* Description */}
              <p className="text-xs text-slate-500 leading-relaxed mb-5 min-h-[48px]">
                {role.description}
              </p>

              {/* Horizontal Divider Line */}
              <div className="h-px w-full bg-slate-100 mb-4" />

              {/* Feature List */}
              <ul className="space-y-2 mb-6">
                {role.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <span className={`size-1.5 rounded-full shrink-0 ${role.bulletColorClass}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action CTA */}
            <div className="pt-2">
              <button
                type="button"
                className="w-full flex items-center justify-between rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-[#047857] px-4 py-2.5 text-xs font-bold text-slate-700 border border-slate-200/80 transition-colors group-hover:border-emerald-200"
              >
                <span>Access Portal</span>
                <ArrowRight className="size-3.5 text-slate-400 group-hover:text-[#047857] transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom DPDP Security Banner */}
      <div className="mt-10 flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/90 px-6 py-2.5 text-xs font-medium text-slate-600 shadow-2xs">
          <ShieldCheck className="size-4 text-[#047857]" />
          <span>All sessions are encrypted and JWT-secured under DPDP 2023</span>
        </div>
      </div>
    </div>
  );
}

// ── Minimal Worker PIN Auth Form (Dedicated for Field Workers) ───────────────

function WorkerPinAuthForm({
  role,
  onBack
}: {
  role: RoleConfig;
  onBack: () => void;
}) {
  const router = useRouter();
  const { login: setAuthSession } = useAuth();

  const [workerCode, setWorkerCode] = useState("W-CHA-001");
  const [pin, setPin] = useState("1234");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleWorkerLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!workerCode.trim() || !pin.trim()) {
      setMessage("Please enter both Worker Code and Security PIN.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Call Backend API POST /api/v1/worker/auth/login
      const result = await api.workerLogin(workerCode.trim(), pin.trim());

      // Save worker session data into local session
      const sessionUser = {
        token: result.token,
        email: result.workerCode,
        name: result.name,
        role: "WORKER" as UserRole,
        userId: result.workerId
      };

      saveSession(sessionUser, true);
      setAuthSession(sessionUser);

      // Redirect to worker portal
      router.push("/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invalid Worker Code or Security PIN.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[460px] mx-auto px-4 py-6">
      {/* Back to Role Selection */}
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#047857] transition-colors"
      >
        <ChevronLeft className="size-4" />
        <span>Change Role (Current: Field Worker)</span>
      </button>

      {/* Main Worker Login Card */}
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xl p-8 sm:p-10">

        {/* Top Worker HardHat Icon */}
        <div className="flex justify-center mb-6">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#047857] border border-emerald-100 shadow-2xs">
            <HardHat className="size-7 text-[#047857]" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Field Worker Sign In
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Sanitation Staff & Collector PIN Portal
          </p>
        </div>

        {/* Notice Info Banner */}
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
          <Info className="size-4 text-[#047857] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Notice:</span> Worker accounts are provisioned by your Sanitation Supervisor. Self-registration is not required.
          </div>
        </div>

        {/* Minimal PIN Form */}
        <form onSubmit={handleWorkerLogin} className="space-y-5">
          {/* Worker Code Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Worker Code / ID
            </label>
            <div className="relative">
              <UserCheck className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                id="worker-code"
                type="text"
                value={workerCode}
                onChange={(e) => setWorkerCode(e.target.value.toUpperCase())}
                placeholder="e.g. W-CHA-001"
                required
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3.5 text-sm font-mono font-bold text-slate-900 tracking-wider shadow-2xs outline-none transition-colors focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20"
              />
            </div>
          </div>

          {/* PIN Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              4-6 Digit Security PIN
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                id="worker-pin"
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                required
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 text-sm font-mono tracking-[0.3em] font-bold text-slate-900 shadow-2xs outline-none transition-colors focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Quick Demo Credentials Helper */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-center text-[11px] font-medium text-slate-600">
            💡 <span className="font-bold">Testing Credentials:</span> Code: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-[#047857] font-bold">W-CHA-001</code> | PIN: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-[#047857] font-bold">1234</code>
          </div>

          {message && (
            <div className={`p-3.5 rounded-lg border text-xs font-semibold ${message.includes("successful") ? "bg-emerald-50 text-emerald-900 border-emerald-200" : "bg-red-50 text-red-900 border-red-200"}`}>
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg bg-[#047857] hover:bg-[#065f46] text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin text-white" />
                <span>Authenticating Worker PIN…</span>
              </>
            ) : (
              <>
                <span>Sign In to Field Portal</span>
                <ArrowRight className="size-4 text-white" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}

// ── Auth Form Step (For Citizen / Authority / Admin) ─────────────────────────

function AuthFormStep({
  role,
  onBack,
  initialMode = "login"
}: {
  role: RoleConfig;
  onBack: () => void;
  initialMode?: "login" | "register";
}) {
  const router = useRouter();
  const { login: setAuthSession } = useAuth();

  // If worker, delegate immediately to WorkerPinAuthForm!
  if (role.value === "WORKER") {
    return <WorkerPinAuthForm role={role} onBack={onBack} />;
  }

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 2-Step OTP State
  const [loginStep, setLoginStep] = useState<"credentials" | "otp_verification">("credentials");
  const [pendingLogin, setPendingLogin] = useState<{ email: string; pass: string; remember: boolean } | null>(null);
  const [backendLoginOtp, setBackendLoginOtp] = useState("");
  const [userEnteredOtp, setUserEnteredOtp] = useState("");

  async function handleCredentialsSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const remember = form.get("remember") === "on";

    if (!email || !password) {
      setMessage("Please enter email and password.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await api.sendLoginOtp(email);
      const generatedOtp = response.otpForTesting || "123456";
      setBackendLoginOtp(generatedOtp);
      setUserEnteredOtp(generatedOtp);
      setPendingLogin({ email, pass: password, remember });
      setLoginStep("otp_verification");
      setMessage("Backend OTP generated! Enter code below to confirm login.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Account not found or invalid credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoginOtpVerify(event?: React.FormEvent) {
    if (event) event.preventDefault();
    if (!pendingLogin) return;

    setLoading(true);
    setMessage("");
    try {
      const result = await api.verifyLoginOtp(pendingLogin.email, pendingLogin.pass, userEnteredOtp);
      saveSession(result, pendingLogin.remember);
      setAuthSession(result);
      router.push("/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Backend OTP verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function register(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    if (role.value === "CITIZEN" && phone.length === 10 && !phoneVerified) {
      setMessage("Please verify your phone number first.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      await api.register({
        fullName: form.get("name"),
        email: form.get("email"),
        phoneNumber: form.get("phone"),
        password: form.get("password"),
        role: role.value,
        municipalityId: 1
      });
      setMode("login");
      setLoginStep("credentials");
      setMessage("Account created successfully! Please sign in with your credentials.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[460px] mx-auto px-4 py-6">
      {/* Back to Role Selection */}
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#047857] transition-colors"
      >
        <ChevronLeft className="size-4" />
        <span>Change Role (Current: {role.label})</span>
      </button>

      {/* Main Login/Register Card */}
      <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xl p-8 sm:p-10">

        {/* Top Centered Role Shield Icon */}
        <div className="flex justify-center mb-6">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#047857] border border-emerald-100 shadow-2xs">
            {role.icon}
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {mode === "login"
              ? loginStep === "otp_verification" ? "Backend OTP Verification" : "Welcome Back"
              : `Create ${role.label} Account`}
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            {mode === "login"
              ? loginStep === "otp_verification"
                ? "Enter the backend generated OTP code to complete sign in"
                : `Login to continue to your CivicMitra ${role.label} account`
              : "Register your account for municipal civic services"}
          </p>
        </div>

        {/* ── Line-Based Tab Switcher (Matches Screenshot 1) ── */}
        <div className="mb-8 border-b border-slate-200 flex">
          <button
            type="button"
            onClick={() => { setMode("login"); setLoginStep("credentials"); setMessage(""); }}
            className={`flex-1 pb-3 text-sm font-bold transition-all relative ${
              mode === "login"
                ? "text-[#047857] border-b-2 border-[#047857]"
                : "text-slate-400 hover:text-slate-600 border-b-2 border-transparent"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setMessage(""); }}
            className={`flex-1 pb-3 text-sm font-bold transition-all relative ${
              mode === "register"
                ? "text-[#047857] border-b-2 border-[#047857]"
                : "text-slate-400 hover:text-slate-600 border-b-2 border-transparent"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* ── Sign In Form ── */}
        {mode === "login" && (
          <>
            {loginStep === "credentials" ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="rahul@gmail.com"
                      required
                      className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 shadow-2xs outline-none transition-colors focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      required
                      className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-900 shadow-2xs outline-none transition-colors focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      name="remember"
                      defaultChecked
                      className="size-4 rounded border-slate-300 text-[#047857] accent-[#047857] focus:ring-[#047857]"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setMessage("Need help? Contact support@civicmitra.gov.in for password recovery assistance.")}
                    className="font-bold text-[#047857] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                {message && (
                  <div className={`p-3.5 rounded-lg border text-xs font-semibold ${message.includes("successfully") ? "bg-emerald-50 text-emerald-900 border-emerald-200" : "bg-red-50 text-red-900 border-red-200"}`}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-lg bg-[#047857] hover:bg-[#065f46] text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-white" />
                      <span>Generating Backend OTP…</span>
                    </>
                  ) : (
                    <>
                      <span>Continue with Backend OTP</span>
                      <ArrowRight className="size-4 text-white" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* ── Login OTP Verification Step ── */
              <form onSubmit={handleLoginOtpVerify} className="space-y-5">
                <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/80 p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#047857] uppercase tracking-wider mb-1">
                    <KeyRound className="size-4" /> ⚠️ Backend Generated OTP (Testing Mode)
                  </div>
                  <div className="font-mono text-3xl font-extrabold tracking-[0.35em] text-[#047857] my-2 select-all">
                    {backendLoginOtp}
                  </div>
                  <p className="text-[11px] font-medium text-emerald-800">
                    Dispatched by Spring Boot OTP Service · Rendered for testing
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={userEnteredOtp}
                    onChange={(e) => setUserEnteredOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="6-digit OTP"
                    required
                    className="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-center font-mono text-xl tracking-[0.25em] text-slate-900 shadow-2xs outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20"
                  />
                </div>

                {message && (
                  <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs font-semibold">
                    {message}
                  </div>
                )}

                <div className="flex flex-col gap-2.5">
                  <button
                    type="submit"
                    disabled={loading || userEnteredOtp.length !== 6}
                    className="h-11 w-full rounded-lg bg-[#047857] hover:bg-[#065f46] text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin text-white" />
                        <span>Verifying Backend OTP…</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Backend OTP & Access Dashboard</span>
                        <ArrowRight className="size-4 text-white" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setLoginStep("credentials")}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 py-1 text-center"
                  >
                    ← Back to Email & Password
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* ── Create Account Form ── */}
        {mode === "register" && (
          <form onSubmit={register} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  required
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 shadow-2xs outline-none transition-colors focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="user@example.com"
                  required
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 shadow-2xs outline-none transition-colors focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="register-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Min 6 chars"
                    minLength={6}
                    required
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 shadow-2xs outline-none transition-colors focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="register-phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="10 digits"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setPhoneVerified(false);
                    }}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 shadow-2xs outline-none transition-colors focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20"
                  />
                </div>
              </div>
            </div>

            {phone.length === 10 && (
              <OtpVerificationBox
                phone={phone}
                onVerified={() => setPhoneVerified(true)}
              />
            )}

            <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 pt-1">
              <input type="checkbox" name="terms" required className="mt-0.5 rounded border-slate-300 accent-[#047857]" />
              <span>I accept the CivicMitra terms of service and DPDP 2023 guidelines.</span>
            </label>

            {message && (
              <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs font-semibold">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-[#047857] hover:bg-[#065f46] text-[#ffffff] text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin text-white" />
                  <span>Creating account…</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="size-4 text-white" />
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

// ── Main AuthScreen Container Component ───────────────────────────────────────

export function AuthScreen({ initialMode = "login" }: { initialMode?: "login" | "register" }) {
  const [selectedRole, setSelectedRole] = useState<RoleConfig | null>(null);

  return (
    <div className="relative min-h-screen bg-[#fafafa] text-slate-900 font-sans flex flex-col justify-between selection:bg-emerald-100">

      {/* Background City Skyline SVG Watermark */}
      <CitySkylineBackground />

      {/* ── Top Header Bar with CivicMitra Logo ── */}
      <header className="relative z-10 w-full px-6 py-6 sm:px-10 lg:px-12 flex items-center justify-between">
        <Logo href="/" />

        <Link
          href="/"
          className="text-xs font-bold text-slate-600 hover:text-[#047857] transition-colors"
        >
          ← Back to Home
        </Link>
      </header>

      {/* ── Main Section ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        {selectedRole ? (
          <AuthFormStep
            role={selectedRole}
            onBack={() => setSelectedRole(null)}
            initialMode={initialMode}
          />
        ) : (
          <RoleSelectionStep onSelectRole={(r) => setSelectedRole(r)} />
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 w-full py-5 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-200/60 bg-white/70 backdrop-blur-xs gap-3">
        <div>
          © 2025 CivicMitra. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <Link href="#" className="hover:text-[#047857] transition-colors">Privacy Policy</Link>
          <span className="text-slate-300">|</span>
          <Link href="#" className="hover:text-[#047857] transition-colors">Terms of Service</Link>
          <span className="text-slate-300">|</span>
          <Link href="#" className="hover:text-[#047857] transition-colors">Help & Support</Link>
        </div>
      </footer>

    </div>
  );
}
