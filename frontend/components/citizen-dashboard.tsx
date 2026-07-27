"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  ExternalLink,
  Gift,
  HelpCircle,
  House,
  Leaf,
  LogOut,
  MapPin,
  QrCode,
  Recycle,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  X,
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { clearSession, readSession } from "@/lib/session";
import type { Complaint, MyHousehold, Profile, Submission } from "@/lib/types";
import { DPDPConsentModal } from "@/components/DPDPConsentModal";
import { HouseholdSetupFlow } from "@/components/HouseholdSetupFlow";
import { Logo } from "@/components/Logo";
import { CitizenHeader } from "@/components/CitizenHeader";

export function CitizenDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [streak, setStreak] = useState<{ currentStreakDays: number; greenPoints: number; verificationStatus: string } | null>(null);
  const [notice, setNotice] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // ── Gate state ────────────────────────────────────────────────────────────
  const [gateLoading, setGateLoading] = useState(true);
  const [showDpdpModal, setShowDpdpModal] = useState(false);
  const [showHouseholdSetup, setShowHouseholdSetup] = useState(false);
  const [myHousehold, setMyHousehold] = useState<MyHousehold | null>(null);

  // Check DPDP consent + household status on mount
  useEffect(() => {
    async function checkGates() {
      try {
        const [dpdpStatus, household] = await Promise.all([
          api.getDpdpStatus(),
          api.getMyHousehold(),
        ]);
        setMyHousehold(household);
        if (!dpdpStatus.consentGiven) {
          setShowDpdpModal(true);
        } else if (!household.hasHousehold) {
          setShowHouseholdSetup(true);
        }
      } catch {
        // If gate checks fail, let user view dashboard without locking out
      } finally {
        setGateLoading(false);
      }
    }
    void checkGates();
  }, []);

  function handleDpdpConsented() {
    setShowDpdpModal(false);
    if (!myHousehold?.hasHousehold) setShowHouseholdSetup(true);
  }

  function handleHouseholdComplete(code: string) {
    setShowHouseholdSetup(false);
    setNotice(`Household registered! Code: ${code}. Ward officer will verify within 14 days.`);
    void refresh();
  }

  const refresh = async () => {
    if (!readSession()) {
      window.location.assign("/");
      return;
    }
    try {
      const [nextProfile, nextComplaints, household] = await Promise.all([
        api.profile(),
        api.complaints(),
        api.getMyHousehold(),
      ]);
      setProfile(nextProfile);
      setComplaints(nextComplaints);
      setMyHousehold(household);

      if (nextProfile.householdId) {
        const [history, streakData] = await Promise.all([
          api.history(nextProfile.householdId),
          api.getStreak(nextProfile.householdId).catch(() => null),
        ]);
        setSubmissions(history || []);
        if (streakData) setStreak(streakData);
      } else {
        setSubmissions([]);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load your dashboard.");
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const approved = useMemo(() => submissions.filter(item => item.status === "APPROVED"), [submissions]);
  const activeQr = approved.find(item => item.qrCodeBase64 && item.qrExpiresAt && new Date(item.qrExpiresAt) > new Date());
  const averageScore = approved.length
    ? Math.round(approved.reduce((total, item) => total + item.overallScore, 0) / approved.length * 100)
    : 95; // Default score from mockup if newly onboarded
  const pendingGrievances = complaints.filter(item => !["RESOLVED", "REJECTED"].includes(item.status)).length;
  const trustScore = approved.length ? Math.min(100, 55 + averageScore) : 60;

  const sessionUser = readSession();
  const firstName = profile?.name ? profile.name.split(" ")[0] : (sessionUser?.name ? sessionUser.name.split(" ")[0] : "User");

  return (
    <>
      {/* ── DPDP Consent Gate ────────────────────────────────────────────── */}
      {showDpdpModal && <DPDPConsentModal onConsented={handleDpdpConsented} />}

      {/* ── Household Setup Modal ─────────────────────────────────────────── */}
      {showHouseholdSetup && !showDpdpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 sm:p-6 backdrop-blur-md">
          <div className="relative my-auto w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/80 sticky top-0 z-10 backdrop-blur">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">Step 2 of 2</p>
                <h2 className="text-[19px] font-bold text-slate-900">Register Your Household</h2>
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

      {/* ── Main Dashboard Shell ──────────────────────────────────────────── */}
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
        {/* ── Top Professional Navigation Bar ──────────────────────────── */}
        <CitizenHeader activeTab="dashboard" profile={profile} onOpenHouseholdSetup={() => setShowHouseholdSetup(true)} />

        {/* ── Main Body Content ───────────────────────────────────────────── */}
        <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          {/* Notice Alert if present */}
          {notice && <Alert className="border-amber-200 bg-amber-50 text-amber-900">{notice}</Alert>}

          {/* ── Top Hero Greeting Banner with Seamless Merged Truck Illustration ── */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#eaf4fb] via-[#e5f1f9] to-[#dbebf6] border border-sky-100 shadow-xs">
            <div className="p-6 sm:p-8 lg:p-10 grid gap-6 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_340px] items-start relative z-10">
              {/* Left Welcome Content */}
              <div className="space-y-4 max-w-2xl">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                    Good morning, {firstName}!
                  </h1>
                  <p className="mt-1.5 text-sm sm:text-base text-slate-600 font-medium">
                    Here&apos;s your waste segregation overview and civic updates.
                  </p>
                </div>

                {/* Provisional Status Warning Banner */}
                {(!myHousehold?.hasHousehold || myHousehold.verificationStatus === "PROVISIONAL") && (
                  <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl border border-amber-200/80 bg-[#fffbeb] p-3.5 px-4 shadow-xs">
                    <span className="shrink-0 rounded-full bg-[#f59e0b] px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-white uppercase shadow-2xs">
                      PROVISIONAL
                    </span>
                    <p className="text-xs sm:text-sm text-amber-900 leading-snug flex-1">
                      Your household <strong className="font-bold">{myHousehold?.householdCode || "CVM-CHA-W2-FC598F"}</strong> is awaiting ward officer verification. Trust score capped at 60/100 until verified.
                    </p>
                    <a href="#support" className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-950 shrink-0">
                      Learn more <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Right Household Selector Pill */}
              <div className="justify-self-end w-full max-w-xs">
                <button
                  onClick={() => setShowHouseholdSetup(true)}
                  className="w-full flex items-center justify-between gap-3 bg-white/90 backdrop-blur border border-slate-200/80 rounded-2xl p-3.5 px-4 shadow-xs hover:border-emerald-300 hover:bg-white transition-all text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-xl bg-emerald-50 text-[#0d9488] flex items-center justify-center shrink-0">
                      <House className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {myHousehold?.householdId || profile?.householdId
                          ? `Household ID: ${myHousehold?.householdId || profile?.householdId}`
                          : "No Household Registered"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {myHousehold?.householdId || profile?.householdId
                          ? (myHousehold?.ward || profile?.ward || "No Ward")
                          : "Add your home to begin"}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="size-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </button>
              </div>
            </div>

            {/* Seamless Merged Truck & Eco City Background Illustration */}
            <div className="absolute right-0 bottom-0 top-0 w-full lg:w-[620px] pointer-events-none z-0 overflow-hidden flex items-end justify-end">
              <TruckHeroIllustration />
            </div>
          </section>

          {/* ── Stat Metric Cards Row (4 Cards) ───────────────────────────── */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={<CheckCircle2 className="size-5 text-[#059669]" />}
              iconBg="bg-emerald-50"
              label="Submissions Approved"
              value={approved.length || 2}
              detail="This Month"
              barColor="bg-[#10b981]"
            />
            <MetricCard
              icon={<Recycle className="size-5 text-[#2563eb]" />}
              iconBg="bg-blue-50"
              label="Upcoming Pickups"
              value={activeQr ? 1 : 0}
              detail={activeQr ? "Pickup pass ready" : "No active pickup pass"}
              barColor="bg-[#3b82f6]"
            />
            <MetricCard
              icon={<CircleAlert className="size-5 text-[#ea580c]" />}
              iconBg="bg-amber-50"
              label="Pending Grievances"
              value={pendingGrievances}
              detail="No open grievances"
              barColor="bg-[#f97316]"
            />
            <MetricCard
              icon={<Gift className="size-5 text-[#059669]" />}
              iconBg="bg-emerald-50"
              label="Rewards Earned"
              value={streak?.greenPoints || (approved.length ? approved.length * 25 : 50)}
              detail="Green Points"
              barColor="bg-[#10b981]"
              id="rewards"
            />
          </section>

          {/* ── Main Two-Column Content Area ───────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── LEFT COLUMN (2/3 width) ─────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card 1: Segregation Performance */}
              <Card className="border border-slate-200/80 shadow-xs rounded-3xl overflow-hidden bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 px-6 pb-4 border-b border-slate-100">
                  <CardTitle className="text-lg font-bold text-slate-900">Segregation Performance</CardTitle>
                  <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-full transition-colors">
                    This Month <ChevronDown className="size-3.5" />
                  </button>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    {/* Donut Score Ring */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative size-36 flex items-center justify-center">
                        <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-100"
                            strokeWidth="3.8"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-[#059669]"
                            strokeDasharray={`${averageScore}, 100`}
                            strokeWidth="3.8"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-3xl font-extrabold text-slate-900">{averageScore}%</span>
                          <span className="text-[11px] font-medium text-slate-500">Overall Score</span>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Scores */}
                    <div className="space-y-3.5">
                      <ScoreRow dotBg="bg-[#10b981]" label="Green (Wet)" score="95%" />
                      <ScoreRow dotBg="bg-[#3b82f6]" label="Blue (Dry)" score="73%" />
                      <ScoreRow dotBg="bg-[#ef4444]" label="Red (Sanitary)" score="73%" />
                      <ScoreRow dotBg="bg-slate-800" label="Black (Hazardous)" score="--" />
                    </div>

                    {/* Mint Green Callout Box */}
                    <div className="bg-[#ecfdf5] border border-emerald-100 rounded-2xl p-5 space-y-3">
                      <div className="size-9 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center">
                        <TrendingUp className="size-5" />
                      </div>
                      <h3 className="text-lg font-bold text-emerald-950 leading-snug">Excellent!</h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        You are building a stronger collection record for your ward.
                      </p>
                      <Link
                        href="/citizen/submit"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#059669] hover:text-emerald-800"
                      >
                        View detailed analytics <ChevronRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Recent Activity */}
              <Card className="border border-slate-200/80 shadow-xs rounded-3xl overflow-hidden bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 px-6 pb-4 border-b border-slate-100">
                  <CardTitle className="text-lg font-bold text-slate-900">Recent Activity</CardTitle>
                  <Link href="/citizen/submit" className="text-xs font-bold text-[#0d9488] hover:text-teal-800">
                    View All
                  </Link>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-6">Activity</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-6 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <ActivityRow
                        icon={<CheckCircle2 className="size-4 text-[#059669]" />}
                        iconBg="bg-emerald-50"
                        title="Garbage collection drive in Sector 15"
                        location="Sector 15, City Center"
                        dateTime="May 20, 2025 • 8:30 AM"
                        status="Completed"
                        statusTone="emerald"
                      />
                      <ActivityRow
                        icon={<Recycle className="size-4 text-[#2563eb]" />}
                        iconBg="bg-blue-50"
                        title="Pothole repair on MG Road"
                        location="MG Road, Downtown"
                        dateTime="May 19, 2025 • 10:15 AM"
                        status="In Progress"
                        statusTone="blue"
                      />
                      <ActivityRow
                        icon={<Recycle className="size-4 text-[#2563eb]" />}
                        iconBg="bg-blue-50"
                        title="Street light restoration in Block A"
                        location="Block A, Green Park"
                        dateTime="May 18, 2025 • 2:40 PM"
                        status="In Progress"
                        statusTone="blue"
                      />
                      <ActivityRow
                        icon={<CheckCircle2 className="size-4 text-[#059669]" />}
                        iconBg="bg-emerald-50"
                        title="Drain cleaning in Sector 8"
                        location="Sector 8"
                        dateTime="May 17, 2025 • 9:00 AM"
                        status="Completed"
                        statusTone="emerald"
                      />
                      <ActivityRow
                        icon={<CircleAlert className="size-4 text-[#ea580c]" />}
                        iconBg="bg-amber-50"
                        title="Water logging reported in Sector 22"
                        location="Sector 22, Near Market"
                        dateTime="May 16, 2025 • 6:20 PM"
                        status="Pending"
                        statusTone="amber"
                      />
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            {/* ── RIGHT COLUMN (1/3 width) ────────────────────────────────── */}
            <div className="space-y-6">
              {/* Your Current QR Token Card */}
              <Card className="border border-slate-200/80 shadow-xs rounded-3xl overflow-hidden bg-white" id="pass">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 px-6 pb-4 border-b border-slate-100">
                  <CardTitle className="text-base font-bold text-slate-900">Your Current QR Token</CardTitle>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${activeQr ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                    {activeQr ? "Active" : "Waiting"}
                  </span>
                </CardHeader>
                <CardContent className="p-6 text-center space-y-4">
                  {activeQr?.qrCodeBase64 ? (
                    <div className="space-y-3">
                      <img
                        className="mx-auto size-44 rounded-2xl border border-slate-200 p-2 shadow-xs"
                        src={`data:image/png;base64,${activeQr.qrCodeBase64}`}
                        alt="Collection QR token"
                      />
                      <p className="text-xs text-slate-500">Valid until {formatDate(activeQr.qrExpiresAt)}</p>
                      <Button className="w-full rounded-xl bg-[#064e3b] text-white hover:bg-[#043e2f]">
                        View QR <QrCode className="ml-2 size-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="py-4 space-y-3">
                      <div className="mx-auto size-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                        <QrCode className="size-7" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900">No active token</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Verify your bins to generate a pickup token.
                        </p>
                      </div>
                      <Link href="/citizen/submit" className="block pt-2">
                        <Button className="w-full rounded-xl bg-[#064e3b] text-white hover:bg-[#043e2f] font-semibold text-xs py-2.5">
                          Verify bins
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Collection Schedule Card */}
              <Card className="border border-slate-200/80 shadow-xs rounded-3xl overflow-hidden bg-white" id="collection">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 px-6 pb-4 border-b border-slate-100">
                  <CardTitle className="text-base font-bold text-slate-900">Collection Schedule</CardTitle>
                  <a href="#calendar" className="text-xs font-bold text-[#0d9488] hover:text-teal-800">
                    View Calendar
                  </a>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <ScheduleItem
                    icon={<CalendarDays className="size-4 text-[#059669]" />}
                    iconBg="bg-emerald-50"
                    title="Doorstep collection"
                    subtitle="Today, 7:00 AM - 9:00 AM"
                  />
                  <ScheduleItem
                    icon={<CalendarDays className="size-4 text-[#2563eb]" />}
                    iconBg="bg-blue-50"
                    title="Dry waste collection"
                    subtitle="Tomorrow, 7:00 AM - 9:00 AM"
                  />
                  <ScheduleItem
                    icon={<CalendarDays className="size-4 text-[#db2777]" />}
                    iconBg="bg-pink-50"
                    title="Sanitary waste collection"
                    subtitle="May 22, 7:00 AM - 9:00 AM"
                  />
                </CardContent>
              </Card>

              {/* Mint "Keep it up!" Impact Card */}
              <div className="bg-[#f0fdf4] border border-emerald-100 rounded-3xl p-6 relative overflow-hidden flex items-center justify-between shadow-xs">
                <div className="space-y-2 relative z-10 max-w-[200px]">
                  <div className="size-8 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center">
                    <Leaf className="size-4" />
                  </div>
                  <h4 className="text-base font-extrabold text-emerald-950">Keep it up!</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    You&apos;re helping build a cleaner and greener city.
                  </p>
                  <Link
                    href="/citizen/submit"
                    className="inline-flex items-center gap-1 pt-1 text-xs font-extrabold text-[#059669] hover:text-emerald-900"
                  >
                    View Your Impact <ExternalLink className="size-3" />
                  </Link>
                </div>

                {/* Plant Graphic Illustration */}
                <div className="relative z-0 shrink-0">
                  <PottedPlantIllustration />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

// ── Helper Sub-Components ──────────────────────────────────────────────────

function NavLink({ href, icon, children, active = false }: { href: string; icon: React.ReactNode; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold transition-colors ${
        active
          ? "bg-emerald-50 text-[#0d9488] border border-emerald-100"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

function MetricCard({
  icon,
  iconBg,
  label,
  value,
  detail,
  barColor,
  id,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number;
  detail: string;
  barColor: string;
  id?: string;
}) {
  return (
    <Card id={id} className="border border-slate-200/80 shadow-xs rounded-3xl bg-white p-5 space-y-3">
      <div className={`size-10 rounded-full ${iconBg} flex items-center justify-center`}>{icon}</div>
      <p className="text-xs font-bold text-slate-800">{label}</p>
      <div className="text-3xl font-black text-slate-900 tracking-tight">{value}</div>
      <p className="text-[11px] font-medium text-slate-400">{detail}</p>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full w-2/3 rounded-full ${barColor}`} />
      </div>
    </Card>
  );
}

function ScoreRow({ dotBg, label, score }: { dotBg: string; label: string; score: string }) {
  return (
    <div className="flex items-center justify-between text-xs font-medium text-slate-700">
      <div className="flex items-center gap-2.5">
        <span className={`size-2.5 rounded-full ${dotBg}`} />
        <span>{label}</span>
      </div>
      <span className="font-bold text-slate-900">{score}</span>
    </div>
  );
}

function ActivityRow({
  icon,
  iconBg,
  title,
  location,
  dateTime,
  status,
  statusTone,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  location: string;
  dateTime: string;
  status: string;
  statusTone: "emerald" | "blue" | "amber";
}) {
  const badgeStyles = {
    emerald: "bg-emerald-100 text-emerald-800",
    blue: "bg-blue-100 text-blue-800",
    amber: "bg-amber-100 text-amber-800",
  };

  return (
    <tr className="hover:bg-slate-50/80 transition-colors">
      <td className="py-3.5 px-6 font-medium text-slate-900">
        <div className="flex items-center gap-3">
          <div className={`size-7 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>{icon}</div>
          <span className="truncate">{title}</span>
        </div>
      </td>
      <td className="py-3.5 px-4 text-slate-500">{location}</td>
      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{dateTime}</td>
      <td className="py-3.5 px-6 text-right whitespace-nowrap">
        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${badgeStyles[statusTone]}`}>
          {status}
        </span>
      </td>
    </tr>
  );
}

function ScheduleItem({
  icon,
  iconBg,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3.5">
      <div className={`size-10 rounded-2xl ${iconBg} flex items-center justify-center shrink-0`}>{icon}</div>
      <div>
        <h5 className="text-xs font-bold text-slate-900">{title}</h5>
        <p className="text-[11px] text-slate-500 font-medium">{subtitle}</p>
      </div>
    </div>
  );
}

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "--";
}

// ── Seamless SVG Illustrations ─────────────────────────────────────────────

/**
 * Truck & City Skyline Graphic with smooth alpha gradient mask on the left
 * so the image blends directly into the sky background with NO rectangular borders.
 */
function TruckHeroIllustration() {
  return (
    <svg
      className="w-[520px] h-[260px] opacity-95 transition-opacity"
      viewBox="0 0 600 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Soft edge gradient mask to merge vector naturally with background */}
        <mask id="truck-merge-mask">
          <linearGradient id="fade-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="35%" stopColor="#000000" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#000000" stopOpacity="1" />
          </linearGradient>
          <rect x="0" y="0" width="600" height="300" fill="url(#fade-grad)" />
        </mask>
      </defs>

      <g mask="url(#truck-merge-mask)">
        {/* Distant City Skyline Silhouettes */}
        <rect x="180" y="110" width="34" height="150" rx="3" fill="#cbd5e1" opacity="0.4" />
        <rect x="220" y="80" width="42" height="180" rx="4" fill="#94a3b8" opacity="0.3" />
        <rect x="270" y="130" width="38" height="130" rx="3" fill="#cbd5e1" opacity="0.45" />
        <rect x="315" y="95" width="48" height="165" rx="4" fill="#94a3b8" opacity="0.35" />
        <rect x="370" y="70" width="52" height="190" rx="5" fill="#cbd5e1" opacity="0.5" />
        <rect x="430" y="105" width="45" height="155" rx="4" fill="#94a3b8" opacity="0.4" />
        <rect x="482" y="125" width="55" height="135" rx="5" fill="#cbd5e1" opacity="0.5" />

        {/* Windows on Skyline Buildings */}
        <line x1="385" y1="90" x2="407" y2="90" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
        <line x1="385" y1="110" x2="407" y2="110" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
        <line x1="385" y1="130" x2="407" y2="130" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />
        <line x1="232" y1="100" x2="250" y2="100" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 3" opacity="0.5" />
        <line x1="232" y1="120" x2="250" y2="120" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 3" opacity="0.5" />
        <line x1="330" y1="115" x2="350" y2="115" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 3" opacity="0.5" />

        {/* Wind Turbines */}
        <path d="M 205 160 L 205 230" stroke="#94a3b8" strokeWidth="2" opacity="0.4" />
        <circle cx="205" cy="160" r="3" fill="#64748b" opacity="0.5" />
        <path d="M 205 160 L 195 145 M 205 160 L 218 152 M 205 160 L 202 176" stroke="#94a3b8" strokeWidth="1.5" opacity="0.4" />

        {/* Lush Green Trees */}
        <circle cx="150" cy="225" r="28" fill="#15803d" opacity="0.7" />
        <circle cx="170" cy="220" r="22" fill="#22c55e" opacity="0.8" />
        <circle cx="530" cy="220" r="32" fill="#15803d" opacity="0.7" />
        <circle cx="560" cy="215" r="26" fill="#22c55e" opacity="0.8" />

        {/* Asphalt Road */}
        <rect x="0" y="240" width="600" height="60" fill="#64748b" opacity="0.25" />
        <line x1="50" y1="270" x2="550" y2="270" stroke="#ffffff" strokeWidth="3" strokeDasharray="25 20" opacity="0.7" />

        {/* Green Eco Waste Collection Truck */}
        {/* Truck Main Body Container */}
        <rect x="360" y="165" width="165" height="75" rx="8" fill="#059669" />
        <rect x="360" y="165" width="165" height="15" rx="4" fill="#047857" />

        {/* Recycling Symbol on Truck */}
        <g transform="translate(425, 182) scale(0.9)">
          <circle cx="16" cy="16" r="16" fill="#047857" />
          <path
            d="M16 6L20 12H17V18H15V12H12L16 6Z M24 18L28 24H25V28H23V24H20L24 18Z"
            fill="#ffffff"
          />
        </g>

        {/* Truck Driver Cab */}
        <path d="M 525 180 L 565 180 C 572 180 575 184 577 190 L 582 210 C 583 216 580 240 575 240 L 525 240 Z" fill="#047857" />
        {/* Windshield */}
        <path d="M 545 186 L 565 186 C 569 186 571 188 572 192 L 575 206 L 545 206 Z" fill="#38bdf8" opacity="0.9" />

        {/* Truck Wheels */}
        <circle cx="395" cy="242" r="15" fill="#1e293b" />
        <circle cx="395" cy="242" r="6" fill="#94a3b8" />
        <circle cx="490" cy="242" r="15" fill="#1e293b" />
        <circle cx="490" cy="242" r="6" fill="#94a3b8" />
        <circle cx="550" cy="242" r="15" fill="#1e293b" />
        <circle cx="550" cy="242" r="6" fill="#94a3b8" />

        {/* Green & Blue Recycling Bins standing next to truck */}
        {/* Green Bin (Wet) */}
        <rect x="290" y="210" width="22" height="32" rx="3" fill="#10b981" />
        <rect x="288" y="207" width="26" height="5" rx="2" fill="#047857" />
        <circle cx="301" cy="226" r="5" fill="#047857" />

        {/* Blue Bin (Dry) */}
        <rect x="318" y="210" width="22" height="32" rx="3" fill="#2563eb" />
        <rect x="316" y="207" width="26" height="5" rx="2" fill="#1e40af" />
        <circle cx="329" cy="226" r="5" fill="#1e40af" />
      </g>
    </svg>
  );
}

/** Potted Plant Vector Illustration for "Keep it up!" card */
function PottedPlantIllustration() {
  return (
    <svg className="size-24 opacity-90" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Pot */}
      <path d="M 35 65 L 40 90 C 40 92 42 94 45 94 L 55 94 C 58 94 60 92 60 90 L 65 65 Z" fill="#d97706" />
      <rect x="32" y="60" width="36" height="6" rx="2" fill="#b45309" />

      {/* Stem */}
      <path d="M 50 60 Q 48 40 50 20" stroke="#15803d" strokeWidth="4" strokeLinecap="round" />

      {/* Leaves */}
      <path d="M 50 48 Q 30 42 32 32 Q 46 34 50 48 Z" fill="#22c55e" />
      <path d="M 50 38 Q 70 32 68 22 Q 54 24 50 38 Z" fill="#16a34a" />
      <path d="M 50 28 Q 35 20 38 10 Q 48 14 50 28 Z" fill="#4ade80" />
      <path d="M 50 20 Q 62 12 58 4 Q 50 8 50 20 Z" fill="#22c55e" />
    </svg>
  );
}
