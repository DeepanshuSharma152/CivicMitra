"use client";

/**
 * components/home/FourBinSection.tsx
 *
 * Section 4 — The 4-Bin System
 * White background, matches clean card style of Section 3.
 * Sections:
 *   1. Header (eyebrow + title + subtitle)
 *   2. Four bin cards (1 col mobile → 2 col tablet → 4 col desktop)
 *   3. Newspaper testimonial box
 *   4. Fines bar (3 columns)
 *
 * Icons: Lucide only | New packages: none
 * Fade-in on scroll via Intersection Observer
 */

import { useEffect, useRef, useState } from "react";
import {
  Leaf, Recycle, ShieldAlert, AlertTriangle,
  CheckCircle2,
  Gavel, FileText, Users,
  Quote,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface BinCard {
  label: string;         // "GREEN BIN"
  headerBg: string;      // tailwind/css bg color
  ringColor: string;     // icon ring color class
  iconColor: string;     // text color for icon
  icon: React.ElementType;
  title: string;
  whatGoesIn: string[];
  civicmitraChecks: string[];
}

// ── Bin data ──────────────────────────────────────────────────────────────────
const BINS: BinCard[] = [
  {
    label:      "GREEN BIN",
    headerBg:   "#22C55E",
    ringColor:  "bg-green-100",
    iconColor:  "text-green-600",
    icon:       Leaf,
    title:      "Wet Waste",
    whatGoesIn: [
      "Food scraps, vegetable peels",
      "Tea leaves, cooked food",
      "Flowers, garden waste",
    ],
    civicmitraChecks: [
      "Organic content visible",
      "No plastic contamination",
      "Bin not empty",
    ],
  },
  {
    label:      "BLUE BIN",
    headerBg:   "#3B82F6",
    ringColor:  "bg-blue-100",
    iconColor:  "text-blue-600",
    icon:       Recycle,
    title:      "Dry / Recyclable",
    whatGoesIn: [
      "Paper, plastic, metal, glass",
      "Cardboard, rubber, wood",
      "Textiles",
    ],
    civicmitraChecks: [
      "Clean recyclables only",
      "No food contamination",
      "Items rinsed before disposal",
    ],
  },
  {
    label:      "RED BIN",
    headerBg:   "#EF4444",
    ringColor:  "bg-red-100",
    iconColor:  "text-red-600",
    icon:       ShieldAlert,
    title:      "Sanitary Waste",
    whatGoesIn: [
      "Diapers, sanitary pads",
      "Bandages, masks, gloves",
    ],
    civicmitraChecks: [
      "Items properly wrapped",
      "Pouched before disposal",
    ],
  },
  {
    label:      "BLACK BIN",
    headerBg:   "#1F2937",
    ringColor:  "bg-slate-200",
    iconColor:  "text-slate-600",
    icon:       AlertTriangle,
    title:      "Hazardous Waste",
    whatGoesIn: [
      "Batteries, expired medicines",
      "CFL bulbs, chemicals",
      "Paint containers",
    ],
    civicmitraChecks: [
      "Hazardous items identified",
      "Routed to NIMBUA TSDF facility",
    ],
  },
];

// ── Fine data ──────────────────────────────────────────────────────────────────
const FINES = [
  {
    icon:   Gavel,
    amount: "₹200",
    label:  "Minimum Fine",
    sub:    "For first-time offenders",
  },
  {
    icon:   FileText,
    amount: "₹14,000",
    label:  "Maximum Fine",
    sub:    "Under SWM Rules 2026",
  },
  {
    icon:   Users,
    amount: "₹1 LAKH",
    label:  "For Bulk Violators",
    sub:    "Commercial & large generators",
  },
];

// ── Bin Card component ─────────────────────────────────────────────────────────
function BinCard({ bin }: { bin: BinCard }) {
  const Icon = bin.icon;
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-full">
      {/* Coloured header bar */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: bin.headerBg }}
      >
        <span className="text-xs font-black uppercase tracking-widest text-white">
          {bin.label}
        </span>
        <div className={`flex size-7 items-center justify-center rounded-full bg-white/20`}>
          <Icon className="size-4 text-white" />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 p-5 flex-1">
        {/* Icon + title */}
        <div className="flex items-center gap-3">
          <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${bin.ringColor}`}>
            <Icon className={`size-5 ${bin.iconColor}`} />
          </div>
          <h3 className="text-sm font-extrabold text-[#0F172A]">{bin.title}</h3>
        </div>

        {/* What goes in */}
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#047857]">
            What Goes In
          </p>
          <ul className="flex flex-col gap-1.5">
            {bin.whatGoesIn.map(item => (
              <li key={item} className="flex items-start gap-2 text-xs text-slate-600">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-slate-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* CivicMitra checks */}
        <div className="mt-auto">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#047857]">
            CivicMitra Checks
          </p>
          <ul className="flex flex-col gap-1.5">
            {bin.civicmitraChecks.map(check => (
              <li key={check} className="flex items-start gap-2 text-xs text-slate-600">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#22C55E]" />
                {check}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ── Main section ───────────────────────────────────────────────────────────────
export function FourBinSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const fadeIn = (delayClass = "") =>
    [
      "transition-all duration-700 ease-out",
      delayClass,
      visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
    ].join(" ");

  return (
    <section
      id="four-bin-system"
      ref={sectionRef}
      className="bg-white pt-16 pb-16 border-t border-slate-100"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col gap-10">

        {/* ── 1. Header ──────────────────────────────────────────────────── */}
        <div className={`text-center ${fadeIn()}`}>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-10 bg-[#047857]/40" />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#047857]">
              SWM Rules 2026
            </span>
            <div className="h-px w-10 bg-[#047857]/40" />
          </div>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl">
            Chandigarh&apos;s Mandatory{" "}
            <span className="text-[#047857]">4-Bin System</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
            Under SWM Rules 2026, every household must separate waste into four streams.
            CivicMitra verifies each one.
          </p>
        </div>

        {/* ── 2. Four bin cards ─────────────────────────────────────────── */}
        <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-4 ${fadeIn("delay-100")}`}>
          {BINS.map(bin => (
            <BinCard key={bin.label} bin={bin} />
          ))}
        </div>

        {/* ── 3. Newspaper testimonial box ──────────────────────────────── */}
        <div className={`rounded-2xl border border-slate-200 bg-[#F3F4F6] px-6 py-6 sm:px-8 sm:py-7 ${fadeIn("delay-150")}`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
            {/* Source tag */}
            <div className="shrink-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                The Tribune
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Chandigarh · June 24, 2024
              </p>
              <div className="mt-3 hidden sm:block h-px w-16 bg-slate-300" />
            </div>

            {/* Quote */}
            <div className="flex-1">
              <Quote className="mb-2 size-7 text-[#047857] opacity-40" />
              <p className="text-sm leading-relaxed text-slate-700 italic sm:text-base">
                "The four-bin system is a crucial step towards sustainable waste management
                and environmental protection. Strict adherence is non-negotiable."
              </p>
              <p className="mt-3 text-xs font-bold text-slate-500">
                — Amit Kumar, Municipal Commissioner, Chandigarh
              </p>
            </div>
          </div>
        </div>

        {/* ── 4. Fines bar ───────────────────────────────────────────────── */}
        <div className={`rounded-2xl border border-emerald-100 bg-[#ECFDF5] px-6 py-6 sm:px-8 ${fadeIn("delay-200")}`}>
          <p className="mb-5 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#047857]">
            Non-Compliance Fines under SWM Rules 2026
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {FINES.map(({ icon: Icon, amount, label, sub }, i) => (
              <div
                key={label}
                className={[
                  "flex flex-col items-center gap-2 text-center",
                  i < FINES.length - 1
                    ? "sm:border-r sm:border-emerald-200"
                    : "",
                ].join(" ")}
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Icon className="size-5 text-[#047857]" />
                </div>
                <p className="text-2xl font-black text-[#047857] sm:text-3xl">{amount}</p>
                <div>
                  <p className="text-sm font-extrabold text-slate-800">{label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
