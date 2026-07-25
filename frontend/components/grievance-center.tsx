"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Camera, CircleAlert, Plus, Send } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CitizenHeader } from "@/components/CitizenHeader";
import { api } from "@/lib/api";
import { readSession } from "@/lib/session";
import type { Complaint, Profile } from "@/lib/types";

export function GrievanceCenter() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reports, setReports] = useState<Complaint[]>([]);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    try {
      const [nextProfile, nextReports] = await Promise.all([api.profile(), api.complaints()]);
      setProfile(nextProfile);
      setReports(nextReports);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load reports.");
    }
  };

  useEffect(() => {
    if (!readSession()) {
      window.location.assign("/");
      return;
    }
    void refresh();
  }, []);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile?.wardId) {
      setMessage("Your account needs a ward before you can report an issue.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const image = form.get("image");
    if (!(image instanceof File) || image.size === 0) {
      setMessage("Add a photo to help the collection team understand the issue.");
      return;
    }
    setLoading(true);
    setMessage("");
    const payload = new FormData();
    payload.append("image", image);
    payload.append(
      "complaint",
      new Blob(
        [
          JSON.stringify({
            title: form.get("title"),
            description: form.get("description"),
            category: form.get("category"),
            wardId: profile.wardId,
          }),
        ],
        { type: "application/json" }
      )
    );
    try {
      await api.createComplaint(payload);
      setCreating(false);
      setMessage("Your report has been submitted.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit report.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <CitizenHeader activeTab="grievances" profile={profile} />
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-bold text-[#059669] hover:underline">
              <ArrowLeft className="size-4" /> Back to Dashboard
            </Link>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">Grievances</h1>
            <p className="mt-1 text-sm text-slate-500">Track and report neighbourhood waste issues.</p>
          </div>
          <Button className="h-11 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs" onClick={() => setCreating(true)}>
            <Plus className="mr-1.5 size-4" /> Report an issue
          </Button>
        </header>

        {message && <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">{message}</Alert>}

        {creating && (
          <Card className="border-slate-200/80 shadow-2xs rounded-2xl">
            <CardHeader className="p-6">
              <CardTitle className="text-xl font-bold text-slate-900">Report an Issue</CardTitle>
              <CardDescription className="text-xs text-slate-500">Give the collection team details and photo evidence to take action.</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-6">
              <form onSubmit={create} className="grid gap-5">
                <Field>
                  <FieldLabel htmlFor="report-title">Issue title</FieldLabel>
                  <Input id="report-title" name="title" placeholder="For example, missed collection" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="report-description">What happened?</FieldLabel>
                  <Textarea id="report-description" name="description" rows={4} placeholder="Describe the issue clearly" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="report-category">Category</FieldLabel>
                  <Input id="report-category" name="category" placeholder="For example, collection" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="report-photo">Photo evidence</FieldLabel>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800">
                    <Camera className="size-5" /> Add a photo
                    <input id="report-photo" className="sr-only" name="image" type="file" accept="image/*" required />
                  </label>
                </Field>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" className="rounded-xl font-semibold" onClick={() => setCreating(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="rounded-xl bg-[#059669] font-bold">
                    {loading ? "Submitting..." : <><Send className="mr-1.5 size-4" /> Submit report</>}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <section className="grid gap-4">
          {reports.length ? (
            reports.map((report) => (
              <Card key={report.id} className="border-slate-200/80 shadow-2xs rounded-2xl">
                <CardContent className="grid gap-4 p-5 sm:grid-cols-[auto_minmax(0,1fr)_160px]">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 shrink-0">
                    <CircleAlert className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <StatusBadge status={report.status} />
                    <h2 className="mt-2 text-lg font-bold text-slate-900">{report.title}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{report.description}</p>
                    <p className="mt-3 text-[11px] text-slate-400 font-medium">
                      {report.location || profile?.ward || "Your neighbourhood"} · {formatDate(report.createdAt)}
                    </p>
                  </div>
                  {report.imagePath && (
                    <img
                      className="h-32 w-full rounded-xl border border-slate-200 object-cover sm:h-28"
                      src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/uploads/${encodeURIComponent(report.imagePath)}`}
                      alt="Reported issue"
                    />
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-slate-200/80 shadow-2xs rounded-2xl">
              <CardContent className="grid min-h-60 place-items-center p-6 text-center">
                <div>
                  <CircleAlert className="mx-auto size-9 text-slate-400" />
                  <h2 className="mt-3 text-xl font-bold text-slate-900">No reports yet</h2>
                  <p className="mt-1 text-xs text-slate-500">Use “Report an issue” when something needs attention in your ward.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const done = ["RESOLVED", "REJECTED"].includes(status);
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${done ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-800"}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function formatDate(value?: string) {
  return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)) : "Recently added";
}
