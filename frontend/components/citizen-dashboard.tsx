"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, CircleAlert, ClipboardCheck, Gift, HelpCircle, House, Leaf, LogOut, MapPin, QrCode, Recycle, Settings, ShieldCheck, Sparkles, X } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { clearSession, readSession } from "@/lib/session";
import type { Complaint, MyHousehold, Profile, Submission } from "@/lib/types";
import { DPDPConsentModal } from "@/components/DPDPConsentModal";
import { HouseholdSetupFlow } from "@/components/HouseholdSetupFlow";

export function CitizenDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notice, setNotice] = useState("");
  const [houseNumber, setHouseNumber] = useState("");

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
        // If gate checks fail (e.g. network), let them through to avoid locking out
      } finally {
        setGateLoading(false);
      }
    }
    void checkGates();
  }, []);

  function handleDpdpConsented() {
    setShowDpdpModal(false);
    // After consent, check if household setup is needed
    if (!myHousehold?.hasHousehold) setShowHouseholdSetup(true);
  }

  function handleHouseholdComplete(code: string) {
    setShowHouseholdSetup(false);
    setNotice(`Household registered! Code: ${code}. Ward officer will verify within 14 days.`);
    void refresh();
  }

  const refresh = async () => { if (!readSession()) { window.location.assign("/"); return; } try { const [nextProfile, nextComplaints] = await Promise.all([api.profile(), api.complaints()]); setProfile(nextProfile); setComplaints(nextComplaints); setHouseNumber(nextProfile.houseNumber || ""); if (nextProfile.householdId) setSubmissions(await api.history(nextProfile.householdId)); else { setSubmissions([]); setNotice("Set up your household to activate verification and pickup services."); } } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to load your dashboard."); } };
  useEffect(() => { void refresh(); }, []);
  const approved = useMemo(() => submissions.filter(item => item.status === "APPROVED"), [submissions]);
  const activeQr = approved.find(item => item.qrCodeBase64 && item.qrExpiresAt && new Date(item.qrExpiresAt) > new Date());
  const average = approved.length ? Math.round(approved.reduce((total, item) => total + item.overallScore, 0) / approved.length * 100) : 0;
  const pending = complaints.filter(item => !["RESOLVED", "REJECTED"].includes(item.status)).length;
  const trustScore = approved.length ? Math.min(100, 55 + average) : 0;
  
  return <>
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

    {/* ── Main dashboard ───────────────────────────────────────────────── */}
    <main className="min-h-screen bg-slate-50 text-slate-950"><div className="grid min-h-screen w-full lg:grid-cols-[264px_minmax(0,1fr)]"><aside className="hidden border-r border-slate-200 bg-white px-4 py-8 lg:flex lg:flex-col"><Link href="/dashboard" className="mb-12 flex items-center gap-3 px-3"><span className="flex size-11 items-center justify-center rounded-full bg-emerald-700 text-white"><Leaf className="size-6" /></span><span><strong className="block text-[27px] font-bold leading-none text-emerald-950">CivicMitra</strong><small className="mt-1 block text-[11px] text-slate-500">Clean City. Better Tomorrow.</small></span></Link><nav className="grid gap-1"><SidebarLink href="/dashboard" icon={<House />} active>Dashboard</SidebarLink><SidebarLink href="/citizen/submit" icon={<ClipboardCheck />}>Submit Waste</SidebarLink><SidebarLink href="#submissions" icon={<Recycle />}>My Submissions</SidebarLink><SidebarLink href="#pass" icon={<QrCode />}>My QR Tokens</SidebarLink><SidebarLink href="#collection" icon={<CalendarDays />}>Collection Schedule</SidebarLink><SidebarLink href="#rewards" icon={<Gift />}>Rewards &amp; Badges</SidebarLink><button onClick={() => setShowHouseholdSetup(true)} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-[15px] font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"><House className="size-[18px]" />My Household</button><SidebarLink href="/grievances" icon={<CircleAlert />}>Grievances</SidebarLink><SidebarLink href="#support" icon={<HelpCircle />}>Help &amp; Support</SidebarLink><SidebarLink href="#settings" icon={<Settings />}>Settings</SidebarLink></nav><Card className="mt-auto border-slate-200 bg-white"><CardContent className="p-5"><p className="text-[14px] font-semibold text-emerald-700">Trust Score</p><div className="mt-3 flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><ShieldCheck className="size-6" /></span><strong className="text-3xl">{approved.length ? trustScore : "--"}<small className="text-base text-slate-500">/100</small></strong></div><p className="mt-3 text-[12px] text-slate-500">{approved.length ? "Great job! Keep it up." : "Complete a check to begin."}</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${trustScore}%` }} /></div></CardContent></Card><Button variant="ghost" className="mt-3 justify-start text-[14px] text-slate-600" onClick={() => { clearSession(); window.location.assign("/"); }}><LogOut />Sign out</Button></aside>
    <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-7 lg:py-8 xl:px-9"><header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-3xl font-semibold leading-tight">Good morning, {profile?.name?.split(" ")[0] || "there"}.</h1><p className="mt-2 text-[15px] text-slate-500">Here&apos;s your waste segregation overview.</p></div><div className="flex items-center gap-3"><Button variant="outline" className="h-14 max-w-[260px] justify-start gap-3 px-3 text-left" onClick={() => setShowHouseholdSetup(true)}><House className="size-5 text-emerald-700" /><span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold">{profile?.houseNumber ? `Household ID: ${profile.houseNumber}` : "Set up household"}</span><span className="block truncate text-[12px] font-normal text-slate-500">{profile?.ward || "Add your home to begin"}</span></span><ChevronDown className="size-4" /></Button><Button variant="ghost" size="icon" className="relative size-11" aria-label="Notifications"><Bell className="size-5" />{pending > 0 && <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">{pending}</span>}</Button><span className="flex size-11 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">{profile?.name?.[0] || "C"}</span></div></header><nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:hidden"><SidebarLink href="/dashboard" icon={<House />} active>Dashboard</SidebarLink><SidebarLink href="/citizen/submit" icon={<ClipboardCheck />}>Submit</SidebarLink><SidebarLink href="/grievances" icon={<CircleAlert />}>Grievances</SidebarLink></nav>

      {/* Provisional status banner */}
      {myHousehold?.hasHousehold && myHousehold.verificationStatus === "PROVISIONAL" && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="mt-0.5 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">PROVISIONAL</span>
          <p className="text-[13px] text-amber-800">
            Your household <strong>{myHousehold.householdCode}</strong> is awaiting ward officer verification.
            Trust score capped at 60/100 until verified.
          </p>
        </div>
      )}

      {notice && <Alert className="mt-5 border-amber-200 bg-amber-50 text-amber-900">{notice}</Alert>}
      <div className="mt-7 grid gap-4 xl:grid-cols-[minmax(0,1fr)_292px]"><div className="min-w-0"><section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4"><Metric icon={<CheckCircle2 />} label="Submissions Approved" value={approved.length} detail={approved.length ? "This Month" : "Start your first check"} tone="emerald" /><Metric icon={<Recycle />} label="Upcoming Pickups" value={activeQr ? 1 : 0} detail={activeQr ? "Pickup pass ready" : "No active pickup pass"} tone="sky" /><Metric icon={<CircleAlert />} label="Pending Grievances" value={pending} detail={pending ? "Requires Action" : "No open grievances"} tone="amber" /><Metric icon={<Gift />} label="Rewards Earned" value={approved.length * 25} detail="Green Points" tone="green" id="rewards" /></section>
        <Card className="mt-4 border-slate-200"><CardHeader className="flex-row items-center justify-between space-y-0 p-5"><CardTitle className="text-[17px]">Segregation Performance</CardTitle><Button variant="outline" size="sm">This Month <ChevronDown /></Button></CardHeader><Separator /><CardContent className="grid gap-6 p-5 lg:grid-cols-[180px_minmax(0,1fr)_minmax(260px,.9fr)] lg:items-center"><ScoreRing score={average} ready={approved.length > 0} /><div className="grid gap-5"><ScoreRow color="bg-emerald-500" label="Green (Wet)" score={binScore(submissions, "GREEN")} /><ScoreRow color="bg-sky-500" label="Blue (Dry)" score={binScore(submissions, "BLUE")} /><ScoreRow color="bg-rose-500" label="Red (Sanitary)" score={binScore(submissions, "RED")} /><ScoreRow color="bg-slate-800" label="Black (Hazardous)" score={binScore(submissions, "BLACK")} /></div><div className="rounded-md bg-emerald-50 p-5"><Sparkles className="size-5 text-emerald-600" /><h3 className="mt-3 text-xl font-semibold text-emerald-950">{approved.length ? "Excellent!" : "Ready when you are"}</h3><p className="mt-2 text-[14px] leading-6 text-slate-600">{approved.length ? "You are building a stronger collection record for your ward." : "Submit your bin photos to begin your household score."}</p><Link href="/citizen/submit" className="mt-4 inline-flex items-center text-[14px] font-semibold text-emerald-700">View detailed analytics <ChevronRight className="size-4" /></Link></div></CardContent></Card>
        <div className="mt-4 grid gap-4 xl:grid-cols-2"><Card className="border-slate-200" id="submissions"><CardHeader className="flex-row items-center justify-between space-y-0 p-5"><CardTitle className="text-[17px]">Recent Submissions</CardTitle><Link href="/citizen/submit" className="text-[13px] font-semibold text-emerald-700">View All</Link></CardHeader><Separator /><CardContent className="p-5">{submissions.length ? <div className="grid">{submissions.slice(0, 3).map(item => <div key={item.submissionId} className="flex items-center gap-3 border-b border-slate-100 py-3 first:pt-0 last:border-0 last:pb-0"><span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700"><Recycle className="size-5" /></span><div className="min-w-0 flex-1"><strong className="block truncate text-[13px]">{formatDate(item.submittedAt)}</strong><span className="mt-1 block text-[12px] text-slate-500">Submission ID: #{item.submissionId}</span></div><div className="text-right"><StatusBadge status={item.status} /><strong className="mt-1 block text-[13px]">{Math.round(item.overallScore * 100)}%</strong></div></div>)}</div> : <EmptyState copy="Your verification history will appear here." />}</CardContent></Card><Card className="border-slate-200"><CardHeader className="flex-row items-center justify-between space-y-0 p-5"><CardTitle className="text-[17px]">Waste Segregation Guide</CardTitle><Link href="/citizen/submit" className="text-[13px] font-semibold text-emerald-700">View All</Link></CardHeader><Separator /><CardContent className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4"><Guide tone="emerald" title="Green Bin" detail="Wet waste" /><Guide tone="sky" title="Blue Bin" detail="Dry waste" /><Guide tone="rose" title="Red Bin" detail="Sanitary" /><Guide tone="slate" title="Hazardous" detail="Hazardous" /></CardContent></Card></div>
        <Card className="mt-4 overflow-hidden border-emerald-100 bg-emerald-50"><CardContent className="relative min-h-32 overflow-hidden p-6"><div className="relative z-10"><h2 className="text-xl font-semibold text-emerald-950">Together, we build a cleaner Chandigarh</h2><p className="mt-1 text-[14px] text-slate-600">Your small step makes a big difference.</p><Link href="/citizen/submit"><Button className="mt-4 h-9 rounded-md text-[13px]">Submit waste</Button></Link></div><Image src="/home-bins.png" alt="Clean city and collection bins" width={480} height={210} className="pointer-events-none absolute bottom-0 right-0 hidden h-full w-auto object-contain sm:block" /></CardContent></Card></div>
      <aside className="grid content-start gap-4"><Card className="border-slate-200" id="pass"><CardHeader className="flex-row items-center justify-between space-y-0 p-5"><CardTitle className="text-[17px]">Your Current QR Token</CardTitle><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${activeQr ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{activeQr ? "Active" : "Waiting"}</span></CardHeader><Separator /><CardContent className="p-5">{activeQr?.qrCodeBase64 ? <div className="grid gap-4"><img className="mx-auto size-40 rounded-md border border-slate-200 p-2" src={`data:image/png;base64,${activeQr.qrCodeBase64}`} alt="Collection QR token" /><div className="text-center"><p className="text-[12px] text-slate-500">Valid until</p><strong className="mt-1 block text-[14px]">{formatDate(activeQr.qrExpiresAt)}</strong></div><Button className="h-10 rounded-md">View QR <QrCode /></Button></div> : <div className="grid min-h-60 place-items-center text-center"><div><span className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-500"><QrCode className="size-6" /></span><h3 className="mt-4 text-[16px] font-semibold">No active token</h3><p className="mt-2 text-[13px] leading-5 text-slate-500">Verify your bins to generate a pickup token.</p><Link href="/citizen/submit"><Button className="mt-4 h-9 rounded-md text-[13px]">Verify bins</Button></Link></div></div>}</CardContent></Card><Card className="border-slate-200" id="collection"><CardHeader className="flex-row items-center justify-between space-y-0 p-5"><CardTitle className="text-[17px]">Collection Schedule</CardTitle><span className="text-[13px] font-semibold text-emerald-700">View Calendar</span></CardHeader><Separator /><CardContent className="p-5"><div className="flex items-start gap-3"><span className="flex size-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700"><CalendarDays className="size-5" /></span><div><strong className="text-[14px]">Doorstep collection</strong><p className="mt-1 text-[13px] text-slate-600">7:00 AM - 9:00 AM</p><span className="mt-2 inline-flex rounded bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800">{profile?.ward || "Your ward"}</span></div></div><Alert className="mt-5 border-sky-100 bg-sky-50 text-[12px] leading-5 text-sky-900">Please keep your verified bins ready before pickup time.</Alert></CardContent></Card><Card className="border-slate-200"><CardHeader className="flex-row items-center justify-between space-y-0 p-5"><CardTitle className="text-[17px]">Recent Notifications</CardTitle><span className="text-[13px] font-semibold text-emerald-700">View All</span></CardHeader><Separator /><CardContent className="grid gap-4 p-5"><Notification icon={<CheckCircle2 />} tone="emerald" text={approved.length ? `Your latest verification is approved.` : "Complete your first verification."} /><Notification icon={<CircleAlert />} tone="amber" text={pending ? `${pending} grievance${pending > 1 ? "s" : ""} require your response.` : "No grievances require attention."} /><Notification icon={<QrCode />} tone="sky" text={activeQr ? "Your pickup QR token is active." : "A QR token will appear after approval."} /></CardContent></Card></aside></div></section></div></main>
  </>;
}

function SidebarLink({ href, icon, children, active = false }: { href: string; icon: React.ReactNode; children: React.ReactNode; active?: boolean }) { return <Link href={href} className={`flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors ${active ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}><span className="[&>svg]:size-[18px]">{icon}</span>{children}</Link>; }
function Metric({ icon, label, value, detail, tone, id }: { icon: React.ReactNode; label: string; value: number; detail: string; tone: "emerald" | "sky" | "amber" | "green"; id?: string }) { const themes = { emerald: "bg-emerald-100 text-emerald-700", sky: "bg-sky-100 text-sky-700", amber: "bg-amber-100 text-amber-700", green: "bg-lime-100 text-lime-700" }; return <Card id={id} className="border-slate-200"><CardContent className="p-5"><span className={`flex size-10 items-center justify-center rounded-full ${themes[tone]}`}>{icon}</span><p className="mt-4 text-[14px] font-semibold">{label}</p><strong className="mt-3 block text-4xl font-semibold">{value}</strong><p className="mt-2 text-[13px] text-slate-500">{detail}</p><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full w-2/3 rounded-full ${tone === "sky" ? "bg-sky-400" : tone === "amber" ? "bg-amber-400" : "bg-emerald-500"}`} /></div></CardContent></Card>; }
function ScoreRing({ score, ready }: { score: number; ready: boolean }) { return <div className="grid place-items-center"><div className="grid size-40 place-items-center rounded-full" style={{ background: `conic-gradient(#059669 ${score}%, #e2e8f0 0)` }}><div className="grid size-[116px] place-items-center rounded-full bg-white text-center"><strong className="text-3xl font-semibold">{ready ? `${score}%` : "--"}</strong><span className="text-[12px] text-slate-500">Overall Score</span></div></div></div>; }
function ScoreRow({ color, label, score }: { color: string; label: string; score: number | null }) { return <div className="grid grid-cols-[12px_1fr_auto] items-center gap-3 text-[14px]"><span className={`size-3 rounded-full ${color}`} /><span>{label}</span><strong>{score === null ? "--" : `${score}%`}</strong></div>; }
function StatusBadge({ status }: { status: string }) { return <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold ${status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{status.replaceAll("_", " ")}</span>; }
function Guide({ tone, title, detail }: { tone: "emerald" | "sky" | "rose" | "slate"; title: string; detail: string }) { const colors = { emerald: "bg-emerald-500", sky: "bg-sky-500", rose: "bg-rose-500", slate: "bg-slate-800" }; return <div className="grid place-items-center rounded-md border border-slate-200 p-3 text-center"><span className={`flex size-9 items-center justify-center rounded-md text-white ${colors[tone]}`}><Recycle className="size-4" /></span><strong className="mt-2 text-[12px]">{title}</strong><span className="mt-1 text-[11px] text-slate-500">{detail}</span></div>; }
function Notification({ icon, tone, text }: { icon: React.ReactNode; tone: "emerald" | "amber" | "sky"; text: string }) { const colors = { emerald: "bg-emerald-100 text-emerald-700", amber: "bg-amber-100 text-amber-700", sky: "bg-sky-100 text-sky-700" }; return <div className="flex gap-3"><span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${colors[tone]}`}>{icon}</span><p className="pt-1 text-[12px] leading-5 text-slate-600">{text}</p></div>; }
function EmptyState({ copy }: { copy: string }) { return <p className="py-4 text-[14px] text-slate-500">{copy}</p>; }
function binScore(items: Submission[], type: string) { const values = items.flatMap(item => item.binResults || []).filter(bin => bin.binType === type).map(bin => bin.aiConfidence); return values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length * 100) : null; }
function formatDate(value?: string | null) { return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "--"; }
