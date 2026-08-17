"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { CitizenHeader } from "@/components/CitizenHeader";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { readSession } from "@/lib/session";
import type { Profile, Submission } from "@/lib/types";

function formatDate(value?: string) {
  if (!value) return "N/A";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatTime(value?: string) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function MyTokensPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      const session = readSession();
      if (!session) {
        window.location.assign("/login");
        return;
      }
      try {
        const nextProfile = await api.profile();
        setProfile(nextProfile);

        if (nextProfile.householdId) {
          const history = await api.history(nextProfile.householdId);
          setSubmissions(history || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load QR tokens.");
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  const approved = submissions.filter((s) => s.status === "APPROVED" && s.qrCodeBase64);
  const activeToken = approved.find(
    (s) => s.qrExpiresAt && new Date(s.qrExpiresAt) > new Date()
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <CitizenHeader activeTab="tokens" profile={profile} />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
              <Link href="/dashboard" className="hover:underline flex items-center gap-1">
                <ArrowLeft className="size-3.5" /> Citizen Portal
              </Link>
              <span>/</span>
              <span className="text-slate-500">My QR Tokens</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Green QR Tokens & Doorstep Pass
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
              Present your active Green QR Token to sanitation workers during doorstep collection.
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="size-8 animate-spin text-emerald-600" />
              <p className="text-xs font-semibold text-slate-500">Loading your QR tokens…</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-900">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Pass Focus Card */}
            <div className="lg:col-span-1">
              <Card className="border-2 border-emerald-500 bg-gradient-to-b from-emerald-900 to-[#044E3A] text-white shadow-xl rounded-3xl overflow-hidden p-6 text-center">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-200 mb-4">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="size-4 text-emerald-400" /> VERIFIED PASS
                  </span>
                  <span className="bg-emerald-800/80 px-2.5 py-0.5 rounded-full text-[10px] text-white border border-emerald-600">
                    ACTIVE
                  </span>
                </div>

                {activeToken?.qrCodeBase64 ? (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-2xl mx-auto w-fit shadow-md">
                      <img
                        src={
                          activeToken.qrCodeBase64.startsWith("data:image")
                            ? activeToken.qrCodeBase64
                            : `data:image/png;base64,${activeToken.qrCodeBase64}`
                        }
                        alt="Green QR Token"
                        className="size-48 mx-auto"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-200">TOKEN ID</p>
                      <p className="text-sm font-mono font-bold tracking-wider text-white">
                        {activeToken.qrToken || "CVM-QR-ACTIVE"}
                      </p>
                    </div>
                    <div className="text-xs text-emerald-100 bg-white/10 rounded-xl p-2.5 border border-white/10">
                      Expires: {formatDate(activeToken.qrExpiresAt ?? undefined)} at {formatTime(activeToken.qrExpiresAt ?? undefined)}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 space-y-3">
                    <QrCode className="size-16 mx-auto text-emerald-300/50" />
                    <p className="text-sm font-bold text-emerald-100">No Active QR Token</p>
                    <p className="text-xs text-emerald-200/80 max-w-xs mx-auto">
                      Upload your daily waste segregation photos to receive your active doorstep QR pass.
                    </p>
                    <Link
                      href="/citizen/submit"
                      className="inline-block mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
                    >
                      Upload Waste Photos
                    </Link>
                  </div>
                )}
              </Card>
            </div>

            {/* Historical Tokens List */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">QR Token Log</h2>

              {approved.length === 0 ? (
                <Card className="border border-slate-200 bg-white p-8 text-center rounded-2xl">
                  <p className="text-xs font-medium text-slate-500">No issued QR tokens yet.</p>
                </Card>
              ) : (
                approved.map((item) => (
                  <Card
                    key={item.submissionId}
                    className="border border-slate-200 bg-white shadow-xs rounded-2xl p-5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      {item.qrCodeBase64 && (
                        <img
                          src={
                            item.qrCodeBase64.startsWith("data:image")
                              ? item.qrCodeBase64
                              : `data:image/png;base64,${item.qrCodeBase64}`
                          }
                          alt="QR Thumbnail"
                          className="size-14 rounded-lg border border-slate-200 bg-slate-50 shrink-0"
                        />
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-900 font-mono">
                          {item.qrToken || `TOKEN #${item.submissionId}`}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                          Issued on {formatDate(item.submittedAt)} · Overall Score {Math.round(item.overallScore * 100)}%
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                          Verified Segregation
                        </span>
                      </div>
                    </div>

                    {item.qrCodeBase64 && (
                      <a
                        href={
                          item.qrCodeBase64.startsWith("data:image")
                            ? item.qrCodeBase64
                            : `data:image/png;base64,${item.qrCodeBase64}`
                        }
                        download={`GreenQR_${item.qrToken || item.submissionId}.png`}
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-emerald-700 transition-colors shrink-0"
                        title="Download QR Image"
                      >
                        <Download className="size-4" />
                      </a>
                    )}
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
