"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Camera, CheckCircle2, ChevronRight, CircleAlert, Clock3,
  MapPin, QrCode, RefreshCw, ShieldCheck, Upload, XCircle,
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { readSession } from "@/lib/session";
import type { WorkerPickupAction, WorkerScanDetails } from "@/lib/types";

type Stage = "scan" | "details" | "reject" | "complete";
type Coordinates = { latitude: number; longitude: number };

const binLabels: Record<string, string> = { GREEN: "Wet waste", BLUE: "Dry waste", RED: "Sanitary waste", BLACK: "Hazardous waste" };
const binStyles: Record<string, string> = { GREEN: "bg-emerald-500", BLUE: "bg-blue-500", RED: "bg-red-500", BLACK: "bg-slate-800" };

function dateTime(value?: string) {
  return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not available";
}

async function getCoordinates(): Promise<Coordinates> {
  if (!navigator.geolocation) throw new Error("Location services are not available in this browser.");
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(
    position => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
    () => reject(new Error("Allow location access to validate this doorstep pickup.")),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
  ));
}

export function WorkerScan() {
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
  const proofInput = useRef<HTMLInputElement>(null);

  const previews = useMemo(() => proofs.map(file => ({ file, url: URL.createObjectURL(file) })), [proofs]);
  const reset = () => { setStage("scan"); setToken(""); setDetails(null); setReceipt(null); setMessage(""); setReason("Improper segregation"); setSubReason(""); setRemarks(""); setProofs([]); };

  async function scan(event: React.FormEvent) {
    event.preventDefault();
    if (!token.trim()) return;
    setLoading(true); setMessage("");
    try {
      const coords = await getCoordinates();
      const next = await api.scanQr(token.trim(), coords.latitude, coords.longitude);
      if (next.scanResult !== "VALID") { setMessage(next.message); return; }
      setDetails(next); setStage("details");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to scan this QR token."); }
    finally { setLoading(false); }
  }

  async function accept() {
    const session = readSession();
    if (!session?.userId || !details) { window.location.assign("/"); return; }
    setLoading(true); setMessage("");
    try {
      const coords = await getCoordinates();
      const next = await api.confirmPickup(details.tokenId, session.userId, coords.latitude, coords.longitude);
      if (next.status !== "PICKUP_COMPLETED") { setMessage(next.message); return; }
      setReceipt(next); setStage("complete");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to record the pickup."); }
    finally { setLoading(false); }
  }

  async function reject(event: React.FormEvent) {
    event.preventDefault();
    const session = readSession();
    if (!session?.userId || !details) { window.location.assign("/"); return; }
    if (!proofs.length) { setMessage("Add at least one clear photo as evidence before submitting."); return; }
    setLoading(true); setMessage("");
    try {
      const coords = await getCoordinates();
      const body = new FormData();
      body.append("tokenId", details.tokenId); body.append("workerId", String(session.userId));
      body.append("workerLat", String(coords.latitude)); body.append("workerLng", String(coords.longitude));
      body.append("reason", reason); body.append("subReason", subReason); body.append("remarks", remarks);
      proofs.forEach(file => body.append("proofImages", file));
      const next = await api.rejectPickup(body);
      if (next.status !== "PICKUP_REJECTED") { setMessage(next.message); return; }
      setReceipt(next); setStage("complete");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to submit the rejection."); }
    finally { setLoading(false); }
  }

  function addProofs(files: FileList | null) {
    if (!files) return;
    setProofs(current => [...current, ...Array.from(files).filter(file => file.type.startsWith("image/")).slice(0, 4 - current.length)]);
  }

  return <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-10 lg:py-8">
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex items-start justify-between gap-4 sm:mb-8">
        <div><Link href="/" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><ArrowLeft className="size-4" />CivicMitra</Link><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Worker pickup validation</h1><p className="mt-1 text-[15px] text-slate-600">Verify the household QR, inspect the submission, and record the collection outcome.</p></div>
        <div className="hidden items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 sm:flex"><ShieldCheck className="size-4" />Sanitation worker</div>
      </header>

      <div className="mb-6 grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 bg-white text-sm font-medium">
        {["Scan QR", "Verify details", "Record outcome"].map((label, index) => { const active = (stage === "scan" ? 0 : stage === "details" ? 1 : 2) >= index; return <div key={label} className={`flex items-center justify-center gap-2 px-3 py-3 ${active ? "bg-emerald-50 text-emerald-800" : "text-slate-400"}`}><span className={`flex size-5 items-center justify-center rounded-full text-xs ${active ? "bg-emerald-700 text-white" : "bg-slate-100"}`}>{index + 1}</span><span className="hidden sm:inline">{label}</span></div>; })}
      </div>

      {stage === "scan" && <section className="grid overflow-hidden rounded-lg border border-slate-200 bg-white lg:grid-cols-[.9fr_1.1fr]">
        <div className="flex min-h-[440px] flex-col justify-between bg-emerald-900 p-6 text-white sm:p-8">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-100"><MapPin className="size-4" />Doorstep validation</div>
          <div className="mx-auto flex w-full max-w-[330px] flex-col items-center"><p className="mb-5 text-sm text-emerald-100">Position the citizen QR within view</p><div className="grid aspect-square w-full max-w-[280px] place-items-center rounded-xl border-2 border-emerald-300/80 bg-emerald-950/40 p-7"><div className="grid size-full place-items-center rounded-lg bg-white"><QrCode className="size-40 text-slate-950" strokeWidth={1.5} /></div></div></div>
          <div className="grid grid-cols-2 gap-3 text-sm text-emerald-100"><div className="flex items-center gap-2"><CheckCircle2 className="size-4" />At the household</div><div className="flex items-center gap-2"><ShieldCheck className="size-4" />Location checked</div></div>
        </div>
        <div className="p-6 sm:p-8"><div className="max-w-md"><span className="flex size-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><Camera className="size-5" /></span><h2 className="mt-5 text-2xl font-semibold">Scan a household QR</h2><p className="mt-2 text-[15px] leading-6 text-slate-600">Use the token shown by the citizen. Your current location is checked before the verification is opened.</p>
          <form onSubmit={scan} className="mt-7 space-y-5"><Field><FieldLabel htmlFor="pickup-token">QR token</FieldLabel><div className="relative"><QrCode className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input id="pickup-token" value={token} onChange={event => setToken(event.target.value)} placeholder="Enter or paste the QR token" className="pl-10" required /></div></Field><Button className="h-11 w-full bg-emerald-700 text-[15px] hover:bg-emerald-800" disabled={loading}>{loading ? "Checking location..." : "Verify QR"}<ChevronRight className="size-4" /></Button></form>
          {message && <Alert className="mt-5 flex gap-2 border-rose-200 bg-rose-50 text-rose-900"><CircleAlert className="mt-0.5 size-4 shrink-0" />{message}</Alert>}
          <div className="mt-7 border-t border-slate-100 pt-5 text-sm text-slate-600"><p className="font-medium text-slate-900">Before you start</p><ul className="mt-3 space-y-2"><li>Ask the citizen to open their active QR token.</li><li>Confirm you are at the registered pickup location.</li></ul></div>
        </div></div>
      </section>}

      {stage === "details" && details && <section className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]"><Card><CardContent className="p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="size-5" /><span className="text-sm font-semibold">Verification found</span></div><h2 className="mt-4 text-2xl font-semibold">Review pickup details</h2><p className="mt-1 text-[15px] text-slate-600">Compare the AI analysis with the bins at the doorstep before deciding.</p></div><Button variant="outline" className="border-slate-200" onClick={reset}><RefreshCw className="size-4" />New scan</Button></div>
        <div className="mt-7 grid gap-4 rounded-lg border border-slate-200 p-5 sm:grid-cols-2"><div><p className="text-sm text-slate-500">Resident</p><p className="mt-1 font-semibold">{details.residentName || "Resident"}</p><p className="text-sm text-slate-600">{details.houseNumber} · {details.ward}</p></div><div><p className="text-sm text-slate-500">Submission</p><p className="mt-1 font-semibold">#{details.submissionId}</p><p className="text-sm text-slate-600">Submitted {dateTime(details.submittedAt)}</p></div><div><p className="text-sm text-slate-500">AI score</p><p className="mt-1 text-2xl font-semibold text-emerald-700">{Math.round(details.overallScore || 0)}%</p></div><div><p className="text-sm text-slate-500">Valid until</p><p className="mt-1 flex items-center gap-2 font-medium"><Clock3 className="size-4 text-slate-400" />{dateTime(details.expiresAt)}</p></div></div>
        <div className="mt-6"><div className="flex items-center justify-between"><h3 className="font-semibold">AI analysis summary</h3><span className="text-sm text-slate-500">Confirm in person</span></div><div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">{details.binResults.map(bin => <div key={bin.binType} className="flex items-center justify-between gap-4 px-4 py-3"><div className="flex items-center gap-3"><span className={`size-3 rounded-full ${binStyles[bin.binType] || "bg-slate-400"}`} /><div><p className="font-medium">{binLabels[bin.binType] || bin.binType}</p><p className="text-sm text-slate-500">{Math.round(bin.aiConfidence)}% confidence</p></div></div><span className={bin.passed ? "text-sm font-medium text-emerald-700" : "text-sm font-medium text-amber-700"}>{bin.passed ? "Good" : "Review"}</span></div>)}</div></div>
      </CardContent></Card>
      <aside className="space-y-4"><Card><CardContent className="p-5"><h3 className="font-semibold">Your decision</h3><p className="mt-2 text-sm leading-6 text-slate-600">Only accept when the displayed submission matches the bins available for pickup.</p><Button className="mt-5 h-11 w-full bg-emerald-700 text-[15px] hover:bg-emerald-800" disabled={loading} onClick={accept}><CheckCircle2 className="size-4" />{loading ? "Recording..." : "Accept and record pickup"}</Button><Button variant="outline" className="mt-3 h-11 w-full border-red-200 text-[15px] text-red-700 hover:bg-red-50 hover:text-red-800" disabled={loading} onClick={() => { setMessage(""); setStage("reject"); }}><XCircle className="size-4" />Reject submission</Button></CardContent></Card>{message && <Alert className="flex gap-2 border-rose-200 bg-rose-50 text-rose-900"><CircleAlert className="mt-0.5 size-4 shrink-0" />{message}</Alert>}<Card><CardContent className="p-5"><p className="font-medium">Need a hand?</p><p className="mt-1 text-sm leading-6 text-slate-600">Record a clear reason and evidence whenever the bins do not match the verified submission.</p></CardContent></Card></aside></section>}

      {stage === "reject" && details && <section className="mx-auto max-w-3xl"><Card><CardContent className="p-6 sm:p-8"><Button variant="ghost" className="-ml-2 mb-5" onClick={() => { setMessage(""); setStage("details"); }}><ArrowLeft className="size-4" />Back to verification</Button><div className="flex gap-3 rounded-lg border border-red-100 bg-red-50 p-4 text-red-950"><CircleAlert className="mt-0.5 size-5 shrink-0 text-red-600" /><div><p className="font-semibold">Reject this submission</p><p className="mt-1 text-sm leading-5 text-red-800">Provide a reason and clear proof. The record will be sent to the authority for review.</p></div></div>
        <form className="mt-7 space-y-5" onSubmit={reject}><div className="grid gap-5 sm:grid-cols-2"><Field><FieldLabel htmlFor="reason">Reason for rejection</FieldLabel><select id="reason" value={reason} onChange={event => setReason(event.target.value)} className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-[15px] outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100"><option>Improper segregation</option><option>Wrong bins presented</option><option>Unsafe or prohibited waste</option><option>QR does not match pickup</option><option>Other</option></select></Field><Field><FieldLabel htmlFor="sub-reason">Specific issue</FieldLabel><select id="sub-reason" value={subReason} onChange={event => setSubReason(event.target.value)} className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-[15px] outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100"><option value="">Select if applicable</option><option>Mixed wet and dry waste</option><option>Sanitary waste is unwrapped</option><option>Hazardous waste is present</option><option>Bin photo does not reflect contents</option></select></Field></div>
          <Field><FieldLabel>Proof photos <span className="text-red-600">*</span></FieldLabel><p className="mt-1 text-sm text-slate-500">Add up to four clear photos of the issue.</p><input ref={proofInput} type="file" accept="image/*" multiple className="sr-only" onChange={event => addProofs(event.target.files)} /><div className="mt-3 flex flex-wrap gap-3">{previews.map(({ file, url }, index) => <div key={`${file.name}-${index}`} className="relative size-24 overflow-hidden rounded-md border border-slate-200 bg-slate-100"><img src={url} alt={`Evidence ${index + 1}`} className="size-full object-cover" /><button type="button" aria-label={`Remove evidence ${index + 1}`} onClick={() => setProofs(current => current.filter((_, fileIndex) => fileIndex !== index))} className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-white text-slate-700"><XCircle className="size-4" /></button></div>)}{proofs.length < 4 && <button type="button" onClick={() => proofInput.current?.click()} className="flex size-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 text-sm font-medium text-slate-600 hover:border-emerald-500 hover:text-emerald-700"><Upload className="size-4" />Add photo</button>}</div></Field>
          <Field><FieldLabel htmlFor="remarks">Additional remarks</FieldLabel><Textarea id="remarks" value={remarks} maxLength={250} onChange={event => setRemarks(event.target.value)} placeholder="Briefly describe what you observed at the doorstep." /><p className="mt-1 text-right text-xs text-slate-500">{remarks.length}/250</p></Field>{message && <Alert className="flex gap-2 border-rose-200 bg-rose-50 text-rose-900"><CircleAlert className="mt-0.5 size-4 shrink-0" />{message}</Alert>}<div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="outline" className="h-11 border-slate-200" onClick={() => setStage("details")}>Cancel</Button><Button className="h-11 bg-red-600 text-[15px] hover:bg-red-700" disabled={loading}>{loading ? "Submitting..." : "Submit rejection"}<ChevronRight className="size-4" /></Button></div></form>
      </CardContent></Card></section>}

      {stage === "complete" && receipt && <section className="mx-auto max-w-xl"><Card><CardContent className="p-8 text-center sm:p-12"><span className={`mx-auto grid size-16 place-items-center rounded-full ${receipt.status === "PICKUP_COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{receipt.status === "PICKUP_COMPLETED" ? <CheckCircle2 className="size-8" /> : <XCircle className="size-8" />}</span><h2 className="mt-5 text-2xl font-semibold">{receipt.status === "PICKUP_COMPLETED" ? "Pickup completed" : "Submission rejected"}</h2><p className="mx-auto mt-2 max-w-sm text-[15px] leading-6 text-slate-600">{receipt.message}</p><div className="mt-7 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">{receipt.houseNumber} · {dateTime(receipt.completedAt)}</div><Button className="mt-7 h-11 bg-emerald-700 text-[15px] hover:bg-emerald-800" onClick={reset}><QrCode className="size-4" />Scan next household</Button></CardContent></Card></section>}
    </div>
  </main>;
}
