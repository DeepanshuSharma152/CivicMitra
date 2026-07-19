"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  LogOut,
  MapPin,
  QrCode,
  RefreshCw,
  UserRound,
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { clearSession, readSession } from "@/lib/session";
import type { Profile, WorkerHistory, WorkerStop } from "@/lib/types";
import { WorkerNav } from "@/components/worker-nav";

function dateTime(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "--";
}

export function WorkerHub({ view }: { view: "stops" | "history" | "profile" }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stops, setStops] = useState<WorkerStop[]>([]);
  const [history, setHistory] = useState<WorkerHistory[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  async function refresh() {
    const session = readSession();
    if (!session?.userId) {
      window.location.assign("/");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const [nextProfile, data] = await Promise.all([
        api.profile(),
        view === "stops"
          ? api.workerStops(session.userId)
          : view === "history"
            ? api.workerHistory(session.userId)
            : Promise.resolve([]),
      ]);
      setProfile(nextProfile);
      if (view === "stops") setStops(data as WorkerStop[]);
      if (view === "history") setHistory(data as WorkerHistory[]);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load worker information.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, [view]);
  const title =
    view === "stops"
      ? "My stops"
      : view === "history"
        ? "Pickup history"
        : "Worker profile";
  const copy =
    view === "stops"
      ? "Verified household QR tokens ready for collection in your ward."
      : view === "history"
        ? "A record of your completed and rejected doorstep validations."
        : "Your active collection-worker account.";
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 text-slate-950 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <Link
              href="/"
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"
            >
              <ArrowLeft className="size-4" />
              CivicMitra
            </Link>
            <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
            <p className="mt-1 text-[15px] text-slate-600">{copy}</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Refresh"
            onClick={refresh}
          >
            <RefreshCw className="size-4" />
          </Button>
        </header>
        <WorkerNav active={view} />
        {message && (
          <Alert className="mb-5 border-rose-200 bg-rose-50 text-rose-900">
            {message}
          </Alert>
        )}
        {view === "stops" && (
          <section className="grid gap-4">
            {loading ? (
              <Card>
                <CardContent className="p-6 text-slate-600">
                  Loading stops...
                </CardContent>
              </Card>
            ) : stops.length ? (
              stops.map((stop, index) => (
                <Card key={stop.tokenId}>
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                    <span className="grid size-11 shrink-0 place-items-center rounded-md bg-emerald-50 font-semibold text-emerald-700">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{stop.residentName}</p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                        <MapPin className="size-4 text-emerald-700" />
                        {stop.houseNumber} · {stop.ward}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        AI score {Math.round(stop.overallScore * 100)}% · valid
                        until {dateTime(stop.expiresAt)}
                      </p>
                    </div>
                    <Link
                      href={`/worker/scan?token=${encodeURIComponent(stop.tokenId)}`}
                    >
                      <Button className="h-11 bg-emerald-700 hover:bg-emerald-800">
                        <QrCode />
                        Verify pickup
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Empty
                icon={<ClipboardList />}
                title="No verified stops available"
                copy="New eligible household QR tokens will appear here when they are ready for collection."
              />
            )}
          </section>
        )}
        {view === "history" && (
          <section className="grid gap-3">
            {loading ? (
              <Card>
                <CardContent className="p-6 text-slate-600">
                  Loading pickup history...
                </CardContent>
              </Card>
            ) : history.length ? (
              history.map((item) => (
                <Card key={item.tokenId}>
                  <CardContent className="flex flex-wrap items-center gap-4 p-5">
                    <span
                      className={`grid size-10 place-items-center rounded-full ${item.outcome === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                    >
                      {item.outcome === "COMPLETED" ? (
                        <CheckCircle2 className="size-5" />
                      ) : (
                        <CircleAlert className="size-5" />
                      )}
                    </span>
                    <div className="min-w-48 flex-1">
                      <p className="font-semibold">{item.houseNumber}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.outcome === "COMPLETED"
                          ? "Pickup completed"
                          : item.rejectionReason || "Submission rejected"}
                      </p>
                    </div>
                    <p className="text-sm text-slate-500">
                      {dateTime(item.completedAt)}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Empty
                icon={<CheckCircle2 />}
                title="No pickup records yet"
                copy="Your completed and rejected pickup actions will appear here."
              />
            )}
          </section>
        )}
        {view === "profile" && (
          <Card className="max-w-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <span className="grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-800">
                  <UserRound className="size-7" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold">
                    {profile?.name || "Sanitation worker"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {profile?.email}
                  </p>
                </div>
              </div>
              <div className="mt-7 grid gap-4 border-y border-slate-100 py-5">
                <div>
                  <p className="text-sm text-slate-500">Role</p>
                  <p className="mt-1 font-medium">Sanitation worker</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Assigned ward</p>
                  <p className="mt-1 font-medium">
                    {profile?.ward || "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Municipality</p>
                  <p className="mt-1 font-medium">
                    {profile?.municipality || "Not assigned"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="mt-6 h-11 border-slate-200"
                onClick={() => {
                  clearSession();
                  window.location.assign("/");
                }}
              >
                <LogOut />
                Sign out
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

function Empty({
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
      <CardContent className="grid min-h-64 place-items-center p-6 text-center">
        <div>
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500">
            {icon}
          </span>
          <h2 className="mt-4 text-xl font-semibold">{title}</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            {copy}
          </p>
          <Link href="/worker/scan">
            <Button className="mt-5 bg-emerald-700 hover:bg-emerald-800">
              <QrCode />
              Open QR scanner
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
