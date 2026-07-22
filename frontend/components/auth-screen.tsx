"use client";

import Image from "next/image";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Building2, CheckCircle2, Leaf, LockKeyhole,
  Mail, MapPin, Phone, ShieldCheck, UserRound, MessageSquare, Loader2
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/session";
import type { OtpSendResult, UserRole } from "@/lib/types";

const roles: { value: UserRole; label: string }[] = [
  { value: "CITIZEN", label: "Citizen" },
  { value: "WORKER", label: "Collection worker" },
  { value: "AUTHORITY", label: "Authority" },
  { value: "MUNICIPAL_ADMIN", label: "Municipal admin" }
];

// ── OTP sub-component ─────────────────────────────────────────────────────────

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
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-[13px] text-emerald-700 font-semibold">
        <CheckCircle2 className="size-4" />
        Phone number verified
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700">
        <MessageSquare className="size-4 text-emerald-600" />
        Verify phone number
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 w-full text-[13px]"
        onClick={sendOtp}
        disabled={busy || !phone}
      >
        {busy ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
        {otpResult ? "Resend OTP" : "Send OTP"}
      </Button>

      {/* ⚠️ Testing mode: show OTP on screen */}
      {otpResult?.otpForTesting && (
        <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">
            ⚠️ Testing Mode — OTP visible on screen
          </p>
          <p className="font-mono text-[28px] font-bold tracking-[0.3em] text-amber-900 text-center">
            {otpResult.otpForTesting}
          </p>
          <p className="text-[11px] text-amber-700 text-center mt-1">
            Expires in {otpResult.expiresInMinutes} minutes · Remove in production
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
            placeholder="6-digit code"
            className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-center font-mono text-[16px] tracking-widest text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <Button
            type="button"
            size="sm"
            className="h-10 bg-emerald-700 hover:bg-emerald-800 text-white px-4"
            onClick={verifyOtp}
            disabled={busy || otp.length !== 6}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Verify"}
          </Button>
        </div>
      )}

      {message && (
        <p className={`text-[12px] ${message.startsWith("✓") ? "text-emerald-600" : "text-slate-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

// ── Main auth screen ──────────────────────────────────────────────────────────

export function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole | "">("");
  const [phone, setPhone] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);

  async function signIn(form: FormData) {
    setLoading(true);
    setMessage("");
    try {
      const result = await api.login(
        String(form.get("email") || ""),
        String(form.get("password") || "")
      );
      saveSession(result, form.get("remember") === "on");
      router.push(
        result.role === "WORKER"
          ? "/worker/scan"
          : result.role === "CITIZEN"
          ? "/dashboard"
          : "/authority/reports"
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function register(form: FormData) {
    const selectedRole = String(form.get("role") || "") as UserRole;
    const wardId = String(form.get("wardId") || "");

    if (!selectedRole) {
      setMessage("Choose an account type to continue.");
      return;
    }
    if (selectedRole === "CITIZEN" && !phoneVerified) {
      setMessage("Please verify your phone number before registering.");
      return;
    }
    if (selectedRole === "WORKER" && !wardId) {
      setMessage("Add your ward reference to continue.");
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
      setMessage("Account created. Sign in to continue.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  }

  function changeMode(value: string) {
    setMode(value as "login" | "register");
    setMessage("");
    setPhoneVerified(false);
    setPhone("");
    setRole("");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="grid min-h-screen w-full overflow-hidden bg-white lg:grid-cols-[0.92fr_1.08fr]">

        {/* Left panel */}
        <section className="relative flex min-h-[460px] flex-col overflow-hidden bg-[#f1faf5] px-6 py-8 sm:px-10 sm:py-10 lg:min-h-0 lg:px-12 lg:py-12">
          <Image
            src="/auth-recycling-bin.png"
            alt="Civic waste collection illustration"
            fill
            priority
            sizes="(min-width: 1024px) 46vw, 100vw"
            className="pointer-events-none absolute inset-0 z-0 size-full object-cover object-center"
          />
          <div className="relative z-10 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-emerald-700 text-white">
              <Leaf className="size-6" />
            </span>
            <span>
              <strong className="block text-[28px] font-bold leading-none text-emerald-950">
                CivicMitra
              </strong>
              <small className="mt-1 block text-[13px] font-medium text-slate-500">
                Clean City. Better Tomorrow.
              </small>
            </span>
          </div>

          <div className="relative z-10 mt-12 max-w-md lg:mt-[clamp(3rem,10vh,8rem)]">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-3 py-1.5 text-[13px] font-bold text-emerald-800">
              <ShieldCheck className="size-4" /> Trusted household services
            </p>
            <h1 className="max-w-[520px] text-[34px] font-semibold leading-[1.12] text-slate-950 sm:text-[44px]">
              A cleaner neighbourhood starts at home.
            </h1>
            <p className="mt-5 max-w-md text-[17px] leading-7 text-slate-600">
              Keep waste verification, collection updates, and household services in one clear place.
            </p>
            <div className="mt-8 grid max-w-[500px] grid-cols-1 gap-4 sm:grid-cols-2">
              <Benefit icon={<CheckCircle2 />} title="Clear pickup status" />
              <Benefit icon={<MapPin />} title="Local civic support" />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-28 bg-gradient-to-t from-[#eef9f3]/75 to-transparent" />
        </section>

        {/* Right panel */}
        <section className="flex items-center justify-center bg-gradient-to-br from-[#f7fcf9] via-white to-[#eef9f3] px-6 py-8 sm:px-10 sm:py-10 lg:px-16 lg:py-12">
          <Card className="w-full max-w-[570px] border-0 bg-transparent shadow-none">
            <CardHeader className="gap-2 px-0 pb-8 pt-0">
              <p className="text-[15px] font-semibold text-emerald-700">Welcome to CivicMitra</p>
              <CardTitle className="text-[30px] tracking-normal">
                Your civic services, simply managed.
              </CardTitle>
              <CardDescription>
                Use your account to manage household waste services and community requests.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-0 pb-0">
              <Tabs value={mode} onValueChange={changeMode}>
                <TabsList aria-label="Account options" className="mb-8 grid grid-cols-2">
                  <TabsTrigger value="login">Sign in</TabsTrigger>
                  <TabsTrigger value="register">Create account</TabsTrigger>
                </TabsList>

                {/* ── Login tab ── */}
                <TabsContent value="login">
                  <form action={signIn} className="grid gap-6">
                    <div>
                      <h2 className="text-xl font-semibold">Welcome back</h2>
                      <p className="mt-1 text-[15px] leading-6 text-slate-500">
                        Sign in to continue with your household services.
                      </p>
                    </div>
                    <FormField label="Email address" icon={<Mail />}>
                      <Input id="login-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
                    </FormField>
                    <FormField label="Password" icon={<LockKeyhole />}>
                      <Input id="login-password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required />
                    </FormField>
                    <div className="flex items-center justify-between gap-4">
                      <label className="flex cursor-pointer items-center gap-2 text-[15px] text-slate-600">
                        <Checkbox name="remember" defaultChecked /> Remember me
                      </label>
                      <button type="button" className="text-[15px] font-semibold text-emerald-700 hover:text-emerald-900">
                        Forgot password?
                      </button>
                    </div>
                    {message && <Alert className="border-emerald-100 bg-emerald-50 text-emerald-900">{message}</Alert>}
                    <Button
                      type="submit"
                      size="lg"
                      className="h-12 w-full rounded-md bg-emerald-700 text-base hover:bg-emerald-800"
                      disabled={loading}
                    >
                      {loading ? "Signing in…" : <><span>Sign in</span> <ArrowRight data-icon="inline-end" /></>}
                    </Button>
                  </form>
                </TabsContent>

                {/* ── Register tab ── */}
                <TabsContent value="register">
                  <form action={register} className="grid gap-5">
                    <div>
                      <h2 className="text-xl font-semibold">Create your account</h2>
                      <p className="mt-1 text-[15px] leading-6 text-slate-500">
                        Start with the details we need to serve you locally.
                      </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField label="Full name" icon={<UserRound />}>
                        <Input id="register-name" name="name" autoComplete="name" placeholder="Your full name" required />
                      </FormField>
                      <FormField label="Email address" icon={<Mail />}>
                        <Input id="register-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
                      </FormField>
                      <FormField label="Password" icon={<LockKeyhole />}>
                        <Input id="register-password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required />
                      </FormField>
                      <FormField label="Phone number" icon={<Phone />}>
                        <Input
                          id="register-phone"
                          name="phone"
                          inputMode="numeric"
                          autoComplete="tel"
                          placeholder="10 digit number"
                          required
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            setPhoneVerified(false); // reset if changed
                          }}
                        />
                      </FormField>
                    </div>

                    {/* OTP verification — shown only for CITIZEN or when phone is entered */}
                    {phone.length === 10 && (
                      <OtpVerificationBox
                        phone={phone}
                        onVerified={() => setPhoneVerified(true)}
                      />
                    )}

                    {/* Account type */}
                    <Field>
                      <FieldLabel htmlFor="register-role">Account type</FieldLabel>
                      <div className="relative">
                        <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <select
                          id="register-role"
                          name="role"
                          value={role}
                          onChange={(event) => setRole(event.target.value as UserRole)}
                          required
                          className="flex h-11 w-full appearance-none rounded-md border border-slate-200 bg-white px-10 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100"
                        >
                          <option value="" disabled>Select account type</option>
                          {roles.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                          ))}
                        </select>
                      </div>
                    </Field>

                    {role === "WORKER" && (
                      <FormField label="Ward reference" icon={<MapPin />}>
                        <Input id="register-ward" name="wardId" inputMode="numeric" placeholder="For example, 1" required />
                      </FormField>
                    )}

                    {role === "CITIZEN" && !phoneVerified && phone.length === 10 && (
                      <p className="text-[12px] text-amber-600 font-medium">
                        ⚠️ Please verify your phone number above before registering.
                      </p>
                    )}

                    <label className="flex cursor-pointer items-start gap-2 text-[15px] leading-6 text-slate-600">
                      <Checkbox name="terms" required className="mt-0.5" />
                      I agree to the terms of service and privacy policy.
                    </label>

                    {message && <Alert className="border-emerald-100 bg-emerald-50 text-emerald-900">{message}</Alert>}

                    <Button
                      type="submit"
                      size="lg"
                      className="h-12 w-full rounded-md bg-emerald-700 text-base hover:bg-emerald-800"
                      disabled={loading}
                    >
                      {loading
                        ? "Creating account…"
                        : <><span>Create account</span> <ArrowRight data-icon="inline-end" /></>}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function FormField({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactElement<{ id?: string; className?: string }> }) {
  return (
    <Field>
      <FieldLabel htmlFor={children.props.id}>{label}</FieldLabel>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400">{icon}</span>
        {React.cloneElement(children, { className: "pl-10" })}
      </div>
    </Field>
  );
}

function Benefit({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-emerald-100 bg-white/75 px-4 py-3 text-[15px] font-semibold text-slate-700">
      <span className="text-emerald-700">{icon}</span>{title}
    </div>
  );
}
