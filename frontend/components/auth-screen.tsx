"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Building2, CheckCircle2, Leaf, LockKeyhole,
  Mail, MapPin, Phone, UserRound, MessageSquare, Loader2,
  Eye, EyeOff, KeyRound
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/session";
import { useAuth } from "@/app/context/AuthContext";
import { Logo } from "@/components/Logo";
import type { OtpSendResult, UserRole } from "@/lib/types";

const roles: { value: UserRole; label: string }[] = [
  { value: "CITIZEN", label: "Citizen" },
  { value: "WORKER", label: "Collection worker" },
  { value: "AUTHORITY", label: "Authority" },
  { value: "MUNICIPAL_ADMIN", label: "Municipal admin" }
];

// ── Registration OTP Box Component ──────────────────────────────────────────

interface OtpBoxProps {
  phone: string;
  onVerified: () => void;
}

function OtpVerificationBox({ phone, onVerified }: OtpBoxProps) {
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
      <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800 font-bold">
        <CheckCircle2 className="size-4 text-emerald-600" />
        Phone number verified
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
        <MessageSquare className="size-4 text-[#047857]" />
        Verify Mobile Number
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 w-full text-xs font-semibold rounded-md"
        onClick={sendOtp}
        disabled={busy || !phone}
      >
        {busy ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
        {otpResult ? "Resend Verification OTP" : "Send OTP"}
      </Button>

      {otpResult?.otpForTesting && (
        <div className="rounded-md border-2 border-dashed border-amber-300 bg-amber-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">
            ⚠️ Backend Testing Mode — Verification OTP
          </p>
          <p className="font-mono text-[26px] font-bold tracking-[0.3em] text-amber-900 text-center">
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
            className="h-10 flex-1 rounded-md border border-slate-300 px-3 text-center font-mono text-base tracking-widest text-slate-900 outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20"
          />
          <Button
            type="button"
            size="sm"
            style={{ color: '#ffffff' }}
            className="h-10 bg-[#047857] hover:bg-[#065f46] !text-white px-4 rounded-md font-bold"
            onClick={verifyOtp}
            disabled={busy || otp.length !== 6}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Verify"}
          </Button>
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

// ── Main Auth Screen Component ───────────────────────────────────────────────

export function AuthScreen({ initialMode = "login" }: { initialMode?: "login" | "register" }) {
  const router = useRouter();
  const { login: setAuthSession } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole | "">("");
  const [phone, setPhone] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Login 2-Step OTP Backend Integration State ─────────────────────────────
  const [loginStep, setLoginStep] = useState<"credentials" | "otp_verification">("credentials");
  const [pendingLogin, setPendingLogin] = useState<{ email: string; pass: string; remember: boolean } | null>(null);
  const [backendLoginOtp, setBackendLoginOtp] = useState("");
  const [userEnteredOtp, setUserEnteredOtp] = useState("");

  // Step 1: User submits credentials -> Call Spring Boot Backend to generate Login OTP
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
      // Call backend API /api/v1/auth/login-otp/send?email=...
      const response = await api.sendLoginOtp(email);
      const generatedOtp = response.otpForTesting || "123456";
      setBackendLoginOtp(generatedOtp);
      setUserEnteredOtp(generatedOtp); // pre-fill for effortless 1-click testing mode
      setPendingLogin({ email, pass: password, remember });
      setLoginStep("otp_verification");
      setMessage("Backend OTP generated! Enter code below to confirm login.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Account not found or invalid credentials.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify Backend OTP & Authenticate JWT -> Redirect to /dashboard
  async function handleLoginOtpVerify(event?: React.FormEvent) {
    if (event) event.preventDefault();
    if (!pendingLogin) return;

    setLoading(true);
    setMessage("");
    try {
      // Call backend API /api/v1/auth/login-otp/verify
      const result = await api.verifyLoginOtp(pendingLogin.email, pendingLogin.pass, userEnteredOtp);
      saveSession(result, pendingLogin.remember);
      setAuthSession(result);

      // Redirect directly to /dashboard after successful backend verification
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
    const selectedRole = String(form.get("role") || "") as UserRole;
    const wardId = String(form.get("wardId") || "");

    if (!selectedRole) {
      setMessage("Please select an account type.");
      return;
    }
    if (selectedRole === "CITIZEN" && phone.length === 10 && !phoneVerified) {
      setMessage("Please verify your phone number first.");
      return;
    }
    if (selectedRole === "WORKER" && !wardId) {
      setMessage("Please enter your Ward reference.");
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
        role: selectedRole,
        municipalityId: 1,
        ...(selectedRole === "WORKER" && wardId ? { wardId: Number(wardId) } : {})
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

  function changeMode(value: string) {
    setMode(value as "login" | "register");
    setLoginStep("credentials");
    setMessage("");
    setPhoneVerified(false);
    setPhone("");
    setRole("");
  }

  return (
    <div className="relative min-h-screen bg-[#fafafa] text-slate-900 font-sans flex flex-col justify-between selection:bg-emerald-100">
      
      {/* ── Top Header Bar with CivicMitra Logo (Matching Dribbble Corner Logo Position) ── */}
      <header className="w-full px-6 py-6 sm:px-10 lg:px-12 flex items-center justify-between">
        <Logo href="/" />

        {/* Back to Home link */}
        <Link
          href="/"
          className="text-xs font-semibold text-slate-500 hover:text-[#047857] transition-colors"
        >
          ← Back to Home
        </Link>
      </header>

      {/* ── Center Auth Card (Clean Dribbble/Linear style layout) ── */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-[460px] bg-white rounded-2xl border border-slate-200/90 shadow-xl p-8 sm:p-10">
          
          {/* Centered Brand Icon */}
          <div className="flex justify-center mb-6">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#047857] border border-emerald-100 shadow-sm">
              <Leaf className="size-7 text-[#047857]" />
            </div>
          </div>

          {/* Title Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {mode === "login"
                ? loginStep === "otp_verification" ? "Backend OTP Verification" : "Welcome back"
                : "Create an account"}
            </h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500">
              {mode === "login"
                ? loginStep === "otp_verification"
                  ? "Enter the backend generated OTP code to complete sign in"
                  : "Enter your credentials to access your portal"
                : "Register your account for municipal civic services"}
            </p>
          </div>

          {/* Sharp Modern Tab Toggle */}
          <Tabs value={mode} onValueChange={changeMode} className="w-full">
            <TabsList aria-label="Authentication modes" className="mb-6 grid grid-cols-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
              <TabsTrigger
                value="login"
                className="rounded-lg py-2.5 text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-[#047857] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-slate-200/80 text-slate-600"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-lg py-2.5 text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-[#047857] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-slate-200/80 text-slate-600"
              >
                Create Account
              </TabsTrigger>
            </TabsList>

            {/* ── Sign In Form ── */}
            <TabsContent value="login">
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
                        placeholder="user@example.com"
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
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                      <Checkbox name="remember" defaultChecked className="rounded border-slate-300" />
                      Remember me
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
                    <Alert className={`border text-xs font-semibold p-3.5 rounded-lg ${message.includes("successfully") ? "bg-emerald-50 text-emerald-900 border-emerald-200" : "bg-red-50 text-red-900 border-red-200"}`}>
                      {message}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    style={{ color: '#ffffff' }}
                    className="h-11 w-full rounded-lg bg-[#047857] hover:bg-[#065f46] text-sm font-bold !text-white shadow-md transition-all mt-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2 !text-white" style={{ color: '#ffffff' }}>
                        <Loader2 className="size-4 animate-spin !text-white" style={{ color: '#ffffff' }} /> Generating Backend OTP…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2 !text-white" style={{ color: '#ffffff' }}>
                        <span>Continue with Backend OTP</span>
                        <ArrowRight className="size-4 !text-white" style={{ color: '#ffffff' }} />
                      </span>
                    )}
                  </Button>
                </form>
              ) : (
                /* ── Login OTP Verification Step ── */
                <form onSubmit={handleLoginOtpVerify} className="space-y-5">
                  
                  {/* Backend OTP Display Box */}
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
                    <Alert className="border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs font-semibold p-3.5 rounded-lg">
                      {message}
                    </Alert>
                  )}

                  <div className="flex flex-col gap-2.5">
                    <Button
                      type="submit"
                      size="lg"
                      style={{ color: '#ffffff' }}
                      className="h-11 w-full rounded-lg bg-[#047857] hover:bg-[#065f46] text-sm font-bold !text-white shadow-md transition-all"
                      disabled={loading || userEnteredOtp.length !== 6}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2 !text-white" style={{ color: '#ffffff' }}>
                          <Loader2 className="size-4 animate-spin !text-white" style={{ color: '#ffffff' }} /> Verifying Backend OTP…
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2 !text-white" style={{ color: '#ffffff' }}>
                          <span>Verify Backend OTP & Access Dashboard</span>
                          <ArrowRight className="size-4 !text-white" style={{ color: '#ffffff' }} />
                        </span>
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setLoginStep("credentials")}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 py-1"
                    >
                      ← Back to Email & Password
                    </button>
                  </div>

                </form>
              )}
            </TabsContent>

            {/* ── Create Account Form ── */}
            <TabsContent value="register">
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
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 shadow-2xs outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20"
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
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 shadow-2xs outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20"
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
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 shadow-2xs outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20"
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
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 shadow-2xs outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20"
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

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Account Role
                  </label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <select
                      id="register-role"
                      name="role"
                      value={role}
                      onChange={(event) => setRole(event.target.value as UserRole)}
                      required
                      className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-10 pr-8 text-xs font-medium text-slate-900 shadow-2xs outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20"
                    >
                      <option value="" disabled>Select account role</option>
                      {roles.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {role === "WORKER" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Ward Reference / ID
                    </label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="register-ward"
                        name="wardId"
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 1"
                        required
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3.5 text-xs text-slate-900 shadow-2xs outline-none focus:border-[#047857]"
                      />
                    </div>
                  </div>
                )}

                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 pt-1">
                  <Checkbox name="terms" required className="mt-0.5 rounded border-slate-300" />
                  <span>I accept the CivicMitra terms of service and DPDP 2023 guidelines.</span>
                </label>

                {message && (
                  <Alert className="border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs font-medium p-3 rounded-lg">
                    {message}
                  </Alert>
                )}

                <Button
                  type="submit"
                  size="lg"
                  style={{ color: '#ffffff' }}
                  className="h-11 w-full rounded-lg bg-[#047857] hover:bg-[#065f46] text-sm font-bold !text-white shadow-md transition-all mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2 !text-white" style={{ color: '#ffffff' }}>
                      <Loader2 className="size-4 animate-spin !text-white" style={{ color: '#ffffff' }} /> Creating account…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2 !text-white" style={{ color: '#ffffff' }}>
                      <span>Create Account</span>
                      <ArrowRight className="size-4 !text-white" style={{ color: '#ffffff' }} />
                    </span>
                  )}
                </Button>
              </form>
            </TabsContent>

          </Tabs>

        </div>
      </main>

      {/* ── Minimal Footer ── */}
      <footer className="w-full py-4 px-6 text-center text-xs text-slate-400 border-t border-slate-200/50">
        © 2025 CivicMitra. All rights reserved. Clean City. Better Tomorrow.
      </footer>

    </div>
  );
}
