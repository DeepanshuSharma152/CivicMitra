"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle2,
  Copy,
  Download,
  Gift,
  HelpCircle,
  Mail,
  QrCode,
  Recycle,
  Settings,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { readSession } from "@/lib/session";
import type { Complaint, Profile, Submission } from "@/lib/types";

const labels: Record<string, { title: string; copy: string }> = {
  submissions: {
    title: "My submissions",
    copy: "Review your waste verification history.",
  },
  qr: {
    title: "My QR tokens",
    copy: "Show an active QR token when the worker arrives.",
  },
  calendar: {
    title: "Collection schedule",
    copy: "Keep your verified bins ready for doorstep collection.",
  },
  rewards: {
    title: "Rewards and badges",
    copy: "Your household progress and green points.",
  },
  notifications: {
    title: "Notifications",
    copy: "Updates from verification and neighbourhood services.",
  },
  support: {
    title: "Help and support",
    copy: "Get help with a pickup, verification, or CivicMitra account.",
  },
  settings: {
    title: "Settings",
    copy: "Manage preferences for your CivicMitra account.",
  },
};
function formatDate(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "--";
}

export function CitizenUtility() {
  const params = useParams<{ section: string }>();
  const section = labels[params.section] ? params.section : "submissions";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notice, setNotice] = useState("");
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [pickupAlerts, setPickupAlerts] = useState(true);
  const [supportSubject, setSupportSubject] = useState(
    "Pickup or verification help",
  );
  const [supportMessage, setSupportMessage] = useState("");
  useEffect(() => {
    if (!readSession()) {
      window.location.assign("/");
      return;
    }
    const stored = localStorage.getItem("civicmitra-preferences");
    if (stored) {
      const preferences = JSON.parse(stored) as {
        emailUpdates?: boolean;
        pickupAlerts?: boolean;
      };
      setEmailUpdates(preferences.emailUpdates ?? true);
      setPickupAlerts(preferences.pickupAlerts ?? true);
    }
    void (async () => {
      try {
        const nextProfile = await api.profile();
        setProfile(nextProfile);
        setComplaints(await api.complaints());
        if (nextProfile.householdId)
          setSubmissions(await api.history(nextProfile.householdId));
      } catch (error) {
        setNotice(
          error instanceof Error
            ? error.message
            : "Unable to load this section.",
        );
      }
    })();
  }, []);
  const approved = useMemo(
    () => submissions.filter((item) => item.status === "APPROVED"),
    [submissions],
  );
  const activeQr = approved.find(
    (item) =>
      item.qrCodeBase64 &&
      item.qrExpiresAt &&
      new Date(item.qrExpiresAt) > new Date(),
  );
  const heading = labels[section];
  function downloadQr() {
    if (!activeQr?.qrCodeBase64) return;
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${activeQr.qrCodeBase64}`;
    link.download = `civicmitra-pickup-${activeQr.submissionId}.png`;
    link.click();
    setNotice("QR image downloaded.");
  }
  async function shareQr() {
    if (!activeQr) return;
    try {
      if (navigator.share)
        await navigator.share({
          title: "CivicMitra pickup QR",
          text: `My pickup QR is valid until ${formatDate(activeQr.qrExpiresAt)}.`,
        });
      else {
        await navigator.clipboard.writeText(activeQr.qrToken || "");
        setNotice("Pickup token copied to your clipboard.");
      }
    } catch {
      setNotice("Unable to share the QR from this device.");
    }
  }
  function savePreferences() {
    localStorage.setItem(
      "civicmitra-preferences",
      JSON.stringify({ emailUpdates, pickupAlerts }),
    );
    setNotice("Preferences saved.");
  }
  function exportCalendar() {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(7, 0, 0, 0);
    const end = new Date(start);
    end.setHours(9);
    const stamp = (date: Date) =>
      date
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "");
    const contents = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:civicmitra-${Date.now()}\nDTSTAMP:${stamp(new Date())}\nDTSTART:${stamp(start)}\nDTEND:${stamp(end)}\nSUMMARY:CivicMitra doorstep collection\nDESCRIPTION:Keep verified bins ready for pickup.\nEND:VEVENT\nEND:VCALENDAR`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([contents], { type: "text/calendar" }),
    );
    link.download = "civicmitra-collection.ics";
    link.click();
    setNotice("Collection reminder downloaded.");
  }
  function contactSupport(event: React.FormEvent) {
    event.preventDefault();
    const subject = encodeURIComponent(`[CivicMitra] ${supportSubject}`);
    const body = encodeURIComponent(
      `${supportMessage}\n\nAccount: ${profile?.email || ""}`,
    );
    window.location.href = `mailto:support@civicmitra.in?subject=${subject}&body=${body}`;
  }
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"
            >
              <ArrowLeft className="size-4" />
              Dashboard
            </Link>
            <h1 className="mt-5 text-3xl font-semibold">{heading.title}</h1>
            <p className="mt-2 text-[15px] text-slate-600">{heading.copy}</p>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
            <ShieldCheck className="size-4 text-emerald-700" />
            {profile?.houseNumber || "Household not set"}
          </span>
        </header>
        {notice && (
          <Alert className="mt-5 border-emerald-100 bg-emerald-50 text-emerald-900">
            {notice}
          </Alert>
        )}
        {section === "submissions" && (
          <div className="mt-6 grid gap-4">
            {submissions.length ? (
              submissions.map((item) => (
                <Card key={item.submissionId}>
                  <CardContent className="flex flex-wrap items-center gap-4 p-5">
                    <span className="grid size-11 place-items-center rounded-md bg-emerald-50 text-emerald-700">
                      <Recycle className="size-5" />
                    </span>
                    <div className="min-w-48 flex-1">
                      <p className="font-semibold">
                        Submission #{item.submissionId}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(item.submittedAt)} · Attempt{" "}
                        {item.attemptNumber}/3
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${item.status === "APPROVED" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}
                    >
                      {item.status.replaceAll("_", " ")}
                    </span>
                    <strong className="text-lg">
                      {Math.round(item.overallScore * 100)}%
                    </strong>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState
                icon={<Recycle />}
                title="No submissions yet"
                copy="Your verified bin checks will appear here."
                action="Submit waste"
                href="/citizen/submit"
              />
            )}
          </div>
        )}
        {section === "qr" && (
          <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_.8fr]">
            <Card>
              <CardContent className="p-6">
                {activeQr ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold">
                          Active pickup QR
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                          Show this to the worker during collection.
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                        Active
                      </span>
                    </div>
                    <img
                      className="mx-auto mt-6 size-64 rounded-lg border border-slate-200 p-3"
                      src={`data:image/png;base64,${activeQr.qrCodeBase64}`}
                      alt="Active collection QR token"
                    />
                    <p className="mt-5 text-center text-sm text-slate-600">
                      Valid until {formatDate(activeQr.qrExpiresAt)}
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <Button
                        className="h-11 bg-emerald-700 hover:bg-emerald-800"
                        onClick={downloadQr}
                      >
                        <Download />
                        Download QR
                      </Button>
                      <Button
                        variant="outline"
                        className="h-11"
                        onClick={shareQr}
                      >
                        <Share2 />
                        Share QR
                      </Button>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon={<QrCode />}
                    title="No active QR token"
                    copy="Complete a successful bin verification to generate one."
                    action="Verify bins"
                    href="/citizen/submit"
                  />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold">Token history</h2>
                <div className="mt-5 grid gap-3">
                  {approved.length ? (
                    approved.map((item) => (
                      <div
                        key={item.submissionId}
                        className="rounded-md border border-slate-200 p-4"
                      >
                        <p className="font-medium">
                          Submission #{item.submissionId}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Expires {formatDate(item.qrExpiresAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No issued tokens yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}
        {section === "calendar" && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <span className="grid size-11 place-items-center rounded-md bg-emerald-50 text-emerald-700">
                  <CalendarDays className="size-5" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold">Doorstep collection</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Tomorrow, 7:00 AM to 9:00 AM ·{" "}
                    {profile?.ward || "Your ward"}
                  </p>
                </div>
              </div>
              <Alert className="mt-6 border-sky-100 bg-sky-50 text-sky-900">
                Keep your verified bins ready before pickup time. An active QR
                token is required for collection.
              </Alert>
              <Button
                className="mt-6 h-11 bg-emerald-700 hover:bg-emerald-800"
                onClick={exportCalendar}
              >
                <Download />
                Add reminder to calendar
              </Button>
            </CardContent>
          </Card>
        )}
        {section === "rewards" && (
          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            <Reward
              title="Green points"
              value={approved.length * 25}
              icon={<Gift />}
            />
            <Reward
              title="Verified checks"
              value={approved.length}
              icon={<CheckCircle2 />}
            />
            <Reward
              title="Household score"
              value={
                approved.length
                  ? `${Math.round((approved.reduce((sum, item) => sum + item.overallScore, 0) / approved.length) * 100)}%`
                  : "--"
              }
              icon={<ShieldCheck />}
            />
            <Card className="sm:col-span-3">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold">Next badge</h2>
                <p className="mt-2 text-[15px] text-slate-600">
                  Complete {Math.max(0, 5 - approved.length)} more approved
                  verification
                  {Math.max(0, 5 - approved.length) === 1 ? "" : "s"} to earn
                  the Consistent Sorter badge.
                </p>
                <Link href="/citizen/submit">
                  <Button className="mt-5 h-11 bg-emerald-700 hover:bg-emerald-800">
                    Submit waste
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>
        )}
        {section === "notifications" && (
          <section className="mt-6">
            <div className="mb-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.setItem("civicmitra-notifications-read", "true");
                  setNotice("All notifications marked as read.");
                }}
              >
                <CheckCircle2 />
                Mark all as read
              </Button>
            </div>
            <div className="grid gap-3">
              <Notification
                icon={<QrCode />}
                title={
                  activeQr
                    ? "Your pickup QR is active"
                    : "No pickup QR is active"
                }
                copy={
                  activeQr
                    ? `Valid until ${formatDate(activeQr.qrExpiresAt)}.`
                    : "Verify your bins to generate a pickup token."
                }
              />
              <Notification
                icon={<Recycle />}
                title={
                  approved.length
                    ? "Your latest verification is approved"
                    : "Start your first verification"
                }
                copy={
                  approved.length
                    ? "Your bins are ready for collection."
                    : "Upload clear bin photos to begin."
                }
              />
              <Notification
                icon={<Bell />}
                title={
                  complaints.length
                    ? `${complaints.length} grievance update${complaints.length === 1 ? "" : "s"}`
                    : "No grievance updates"
                }
                copy={
                  complaints.length
                    ? "Open Grievances to review your reported issues."
                    : "You are all caught up."
                }
              />
            </div>
          </section>
        )}
        {section === "support" && (
          <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_.85fr]">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold">Contact support</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Describe the issue and your email app will open with the
                  details prefilled.
                </p>
                <form className="mt-6 grid gap-5" onSubmit={contactSupport}>
                  <Field>
                    <FieldLabel htmlFor="support-subject">Topic</FieldLabel>
                    <Input
                      id="support-subject"
                      value={supportSubject}
                      onChange={(event) =>
                        setSupportSubject(event.target.value)
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="support-message">
                      How can we help?
                    </FieldLabel>
                    <Textarea
                      id="support-message"
                      value={supportMessage}
                      onChange={(event) =>
                        setSupportMessage(event.target.value)
                      }
                      placeholder="Tell us what happened."
                      required
                    />
                  </Field>
                  <Button className="h-11 bg-emerald-700 hover:bg-emerald-800">
                    <Mail />
                    Email support
                  </Button>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold">Quick help</h2>
                <div className="mt-5 grid gap-4">
                  <Help text="For pickup issues, include your house number and expected pickup time." />
                  <Help text="For verification issues, include the submission ID from My submissions." />
                  <Help text="For QR issues, confirm the code is still active before collection." />
                </div>
              </CardContent>
            </Card>
          </section>
        )}
        {section === "settings" && (
          <Card className="mt-6 max-w-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-md bg-emerald-50 text-emerald-700">
                  <Settings className="size-5" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold">
                    Notification preferences
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    These choices are saved on this device.
                  </p>
                </div>
              </div>
              <Separator className="my-6" />
              <div className="grid gap-5">
                <label className="flex items-start justify-between gap-5">
                  <span>
                    <span className="block font-medium">Email updates</span>
                    <span className="mt-1 block text-sm text-slate-500">
                      Receive important verification and account updates.
                    </span>
                  </span>
                  <Checkbox
                    checked={emailUpdates}
                    onCheckedChange={(checked) =>
                      setEmailUpdates(Boolean(checked))
                    }
                  />
                </label>
                <label className="flex items-start justify-between gap-5">
                  <span>
                    <span className="block font-medium">Pickup reminders</span>
                    <span className="mt-1 block text-sm text-slate-500">
                      Show reminders before the scheduled collection window.
                    </span>
                  </span>
                  <Checkbox
                    checked={pickupAlerts}
                    onCheckedChange={(checked) =>
                      setPickupAlerts(Boolean(checked))
                    }
                  />
                </label>
              </div>
              <Button
                className="mt-7 h-11 bg-emerald-700 hover:bg-emerald-800"
                onClick={savePreferences}
              >
                <SlidersHorizontal />
                Save preferences
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

function EmptyState({
  icon,
  title,
  copy,
  action,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
  action: string;
  href: string;
}) {
  return (
    <div className="grid min-h-64 place-items-center text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500">
          {icon}
        </span>
        <h2 className="mt-4 text-xl font-semibold">{title}</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{copy}</p>
        <Link href={href}>
          <Button className="mt-5 bg-emerald-700 hover:bg-emerald-800">
            {action}
          </Button>
        </Link>
      </div>
    </div>
  );
}
function Reward({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <span className="grid size-10 place-items-center rounded-full bg-emerald-50 text-emerald-700">
          {icon}
        </span>
        <p className="mt-4 text-sm text-slate-600">{title}</p>
        <strong className="mt-2 block text-3xl">{value}</strong>
      </CardContent>
    </Card>
  );
}
function Notification({
  icon,
  title,
  copy,
}: {
  icon: React.ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <Card>
      <CardContent className="flex gap-4 p-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
          {icon}
        </span>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm text-slate-600">{copy}</p>
        </div>
      </CardContent>
    </Card>
  );
}
function Help({ text }: { text: string }) {
  return (
    <div className="flex gap-3 text-sm leading-6 text-slate-600">
      <HelpCircle className="mt-1 size-4 shrink-0 text-emerald-700" />
      {text}
    </div>
  );
}
