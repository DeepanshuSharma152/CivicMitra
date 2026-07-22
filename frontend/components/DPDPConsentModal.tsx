"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import {
  ShieldCheck, FileText, Camera, MapPin, BarChart3,
  UserCheck, Info, AlertCircle, ChevronDown, ChevronUp, X
} from "lucide-react";

interface Props {
  onConsented: () => void;
}

// ── Consent item definitions ──────────────────────────────────────────────────

interface ConsentItem {
  id: string;
  required: boolean;
  icon: React.ReactNode;
  title: string;
  badge: string;
  summary: string;
  details: {
    what: string;
    why: string;
    who: string;
    retention: string;
  };
}

const consentItems: ConsentItem[] = [
  {
    id: "photos",
    required: true,
    icon: <Camera className="size-4" />,
    title: "Waste Bin Photo Capture & AI Analysis",
    badge: "Required to use photo submission",
    summary:
      "I consent to CivicMitra capturing and processing photos of my waste bins for AI verification and QR token generation.",
    details: {
      what: "Photographs of your Green, Blue, Red, and Black waste bins submitted during each collection cycle.",
      why: "To automatically verify waste segregation quality, generate a one-time pickup QR code, and compute your household's compliance score.",
      who: "Photos are processed by an AI model (via OpenRouter API). Municipal ward officers may view flagged photos during disputes.",
      retention: "Photos are retained for 90 days for audit purposes, then permanently deleted.",
    },
  },
  {
    id: "gps",
    required: true,
    icon: <MapPin className="size-4" />,
    title: "GPS Location Verification",
    badge: "Required for location validation",
    summary:
      "I consent to GPS location being captured at my registered household address during photo submission.",
    details: {
      what: "Your device's GPS coordinates (latitude & longitude) at the time of each waste submission, and once during initial household registration.",
      why: "To verify that photos are submitted from your registered address and not a remote location, protecting against fraudulent submissions.",
      who: "GPS data is processed server-side by CivicMitra and compared to your registered household coordinates. Raw coordinates are never shared publicly.",
      retention: "Submission GPS logs are retained for 6 months, then anonymised to ward-level precision only.",
    },
  },
  {
    id: "trust_score",
    required: false,
    icon: <BarChart3 className="size-4" />,
    title: "Household Trust Score Sharing",
    badge: "Optional — incentives & rewards require this",
    summary:
      "I consent to my household trust score being calculated and shared with municipal ward officers for route planning and compliance reporting.",
    details: {
      what: "An aggregated numerical score (0–100) derived from your segregation history, GPS compliance, and streak data — not raw photos.",
      why: "Enables ward officers to prioritise collection routes and identify households needing support. Required for public ward leaderboard rankings and green incentive rewards.",
      who: "Shared with your assigned ward officer and municipal administration. Score is visible (without your name) on public ward dashboards if you opt into rankings.",
      retention: "Score history is retained for the duration of your account. Anonymised aggregate data may be used in municipal reports.",
    },
  },
  {
    id: "age",
    required: true,
    icon: <UserCheck className="size-4" />,
    title: "Age Confirmation",
    badge: "Required",
    summary:
      "I confirm that I am 18 years or older, OR that I am a parent/guardian providing verifiable consent for a minor-headed household.",
    details: {
      what: "A self-declaration of your age or guardian status.",
      why: "The DPDP Act 2023 requires parental/guardian consent for processing personal data of minors. This confirmation is required before any data collection begins.",
      who: "This declaration is stored in your account record and may be audited by the Data Protection Board of India if a complaint is filed.",
      retention: "Retained for the lifetime of your account.",
    },
  },
];

// ── Legal principle chip ──────────────────────────────────────────────────────

const principles = [
  { label: "Free", desc: "Refusing optional consent does not deny you waste collection, which is a statutory right under SWM Rules, 2016." },
  { label: "Specific", desc: "Each consent is separate and granular — no bundled checkboxes." },
  { label: "Informed", desc: "What data, why, who processes it, and how long it is kept — disclosed before you tick anything." },
  { label: "Unconditional", desc: "Optional processing is never a condition of basic service." },
  { label: "Unambiguous", desc: "No pre-ticked boxes. No implied consent from scrolling." },
  { label: "Withdrawable", desc: "You can withdraw any consent at any time via your ward officer or by deleting your account." },
];

// ── Main component ────────────────────────────────────────────────────────────

/**
 * DPDP-compliant consent modal.
 *
 * Required consents: photos, gps, age — must be checked to proceed.
 * Optional consent: trust_score — unchecking is allowed; certain features will be limited.
 *
 * Pre-ticked boxes are illegal under DPDP Act 2023 — all start unchecked.
 */
export function DPDPConsentModal({ onConsented }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({
    photos: false,
    gps: false,
    trust_score: false,
    age: false,
  });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [principlesOpen, setPrinciplesOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // All REQUIRED items must be checked. Optional items are free.
  const requiredItems = consentItems.filter((c) => c.required);
  const allRequiredChecked = requiredItems.every((c) => checked[c.id]);

  function toggle(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleAccept() {
    if (!allRequiredChecked) return;
    setLoading(true);
    setError("");
    try {
      await api.recordDpdpConsent();
      onConsented();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record consent. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/75 backdrop-blur-sm p-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dpdp-title"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-start gap-4 border-b border-slate-100 px-6 py-5">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50">
            <FileText className="size-5 text-emerald-700" />
          </span>
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">
              Digital Personal Data Protection Act, 2023
            </p>
            <h2 id="dpdp-title" className="text-[20px] font-bold text-slate-900">
              Your Data Consent
            </h2>
            <p className="mt-1 text-[13px] text-slate-500">
              Please read each section carefully. Required consents are needed to use the app.
              Optional consent can be declined without losing access to basic waste collection.
            </p>
          </div>
        </div>

        {/* ── Legal principles accordion ── */}
        <div className="border-b border-slate-100 px-6">
          <button
            type="button"
            onClick={() => setPrinciplesOpen((o) => !o)}
            className="flex w-full items-center justify-between py-3 text-left"
          >
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700">
              <Info className="size-4 text-blue-500" />
              Your rights under DPDP Act 2023
            </div>
            {principlesOpen
              ? <ChevronUp className="size-4 text-slate-400" />
              : <ChevronDown className="size-4 text-slate-400" />}
          </button>

          {principlesOpen && (
            <div className="pb-4">
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="py-2 pl-4 pr-2 text-left font-semibold text-slate-600 w-28">Principle</th>
                      <th className="py-2 pl-2 pr-4 text-left font-semibold text-slate-600">What this means for you</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {principles.map((p) => (
                      <tr key={p.label} className="align-top">
                        <td className="py-2 pl-4 pr-2 font-semibold text-emerald-700 whitespace-nowrap">{p.label}</td>
                        <td className="py-2 pl-2 pr-4 text-slate-600 leading-5">{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                To withdraw consent or raise a concern, contact your ward officer or email{" "}
                <span className="font-medium text-slate-500">privacy@civicmitra.in</span>
              </p>
            </div>
          )}
        </div>

        {/* ── Consent items ── */}
        <div className="space-y-3 px-6 py-5">
          {consentItems.map((item) => {
            const isChecked = checked[item.id];
            const isExpanded = expanded[item.id];

            return (
              <div
                key={item.id}
                className={`rounded-xl border-2 transition-all ${
                  isChecked
                    ? item.required
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-blue-400 bg-blue-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                {/* Checkbox row */}
                <label
                  htmlFor={`consent-${item.id}`}
                  className="flex cursor-pointer items-start gap-3 p-4"
                >
                  {/* Custom checkbox */}
                  <div className="mt-0.5 shrink-0">
                    <input
                      id={`consent-${item.id}`}
                      type="checkbox"
                      className="sr-only"
                      checked={isChecked}
                      onChange={() => toggle(item.id)}
                    />
                    <div
                      className={`flex size-5 items-center justify-center rounded border-2 transition-colors ${
                        isChecked
                          ? item.required
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-blue-500 bg-blue-500"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isChecked && (
                        <svg className="size-3 text-white" fill="none" viewBox="0 0 12 12">
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Icon + text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`flex items-center gap-1 text-[13px] font-semibold ${
                        item.required ? "text-slate-800" : "text-slate-700"
                      }`}>
                        <span className={`${item.required ? "text-emerald-600" : "text-blue-500"}`}>
                          {item.icon}
                        </span>
                        {item.title}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.required
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {item.required ? "Required" : "Optional"}
                      </span>
                    </div>
                    <p className="text-[13px] leading-5 text-slate-600">{item.summary}</p>
                    <p className={`mt-1 text-[11px] font-medium ${
                      item.required ? "text-emerald-600" : "text-blue-600"
                    }`}>
                      [{item.badge}]
                    </p>
                  </div>
                </label>

                {/* Expandable details */}
                <div className="border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    className="flex w-full items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-slate-500 hover:text-slate-700"
                  >
                    {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                    {isExpanded ? "Hide details" : "What data? Why? How long?"}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {(
                        [
                          ["📋 What data", item.details.what],
                          ["🎯 Why it's needed", item.details.why],
                          ["👤 Who processes it", item.details.who],
                          ["🗓 Retention period", item.details.retention],
                        ] as [string, string][]
                      ).map(([label, value]) => (
                        <div key={label} className="rounded-lg bg-white border border-slate-100 p-3">
                          <p className="text-[11px] font-bold text-slate-500 mb-1">{label}</p>
                          <p className="text-[12px] leading-5 text-slate-700">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Withdrawal notice ── */}
        <div className="mx-6 mb-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-slate-500" />
          <p className="text-[12px] leading-5 text-slate-600">
            <strong>Right to withdraw:</strong> You can withdraw any consent at any time by visiting
            your profile settings or contacting your ward officer. Withdrawal of required consents
            will disable the corresponding features but{" "}
            <strong>will not affect your statutory right to municipal waste collection</strong>{" "}
            under Solid Waste Management Rules, 2016.
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-slate-100 px-6 py-4 space-y-3">
          {!allRequiredChecked && (
            <p className="text-center text-[12px] text-slate-500">
              Please check all <strong>Required</strong> items above to continue. Optional items are your choice.
            </p>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-700">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            id="dpdp-accept-btn"
            onClick={handleAccept}
            disabled={!allRequiredChecked || loading}
            className={`h-12 w-full rounded-xl text-[15px] font-semibold transition-all ${
              allRequiredChecked
                ? "bg-emerald-700 text-white hover:bg-emerald-800 active:scale-[0.98] shadow-sm"
                : "cursor-not-allowed bg-slate-100 text-slate-400"
            }`}
          >
            {loading ? "Recording consent…" : "I Have Read and Agree to Selected Consents"}
          </button>

          <p className="text-center text-[11px] text-slate-400">
            Consent is recorded with a timestamp under your account. Version 1.0 — effective from
            registration date.
          </p>
        </div>
      </div>
    </div>
  );
}
