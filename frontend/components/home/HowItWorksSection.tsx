"use client";

/**
 * components/home/HowItWorksSection.tsx
 *
 * Section 3 — How It Works
 * Three equal-height cards with:
 *   - Number badge, illustration, title, 3 bullets, bottom highlight
 * Arrow connectors between cards (desktop only)
 * Bottom 4-item trust bar
 * Fade-in on scroll via Intersection Observer (no heavy animation library)
 *
 * Background: white | Padding: pt-16 pb-16
 * Icons: Lucide only | New packages: none
 */

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Camera, MapPin, Upload,
  BrainCircuit, AlertTriangle, Zap,
  QrCode, CheckCircle, Trophy,
  ArrowRight,
  ShieldCheck, Lock, Database, Users,
  CheckCircle2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Bullet { icon: React.ElementType; text: string }
interface Step {
  number: string;
  title: string;
  img: string;
  imgAlt: string;
  bullets: Bullet[];
  highlight: { icon: React.ElementType; text: string; strong?: string };
  highlightColor: string; // tailwind bg class
}

// ── Step data ─────────────────────────────────────────────────────────────────
const STEPS: Step[] = [
  {
    number: "1",
    title: "Citizen Photographs Bins",
    img: "/step1-citizen-bins.png",
    imgAlt: "Person photographing 4 coloured waste bins with GPS captured",
    bullets: [
      { icon: Camera,  text: "Citizen photographs all 4 bins (Wet, Dry, Hazardous, Sanitary)" },
      { icon: MapPin,  text: "GPS location captured silently in the background" },
      { icon: Upload,  text: "Submitted before collection truck arrives" },
    ],
    highlight: {
      icon: ShieldCheck,
      text: "Proof submitted with time & location stamp",
    },
    highlightColor: "bg-emerald-50 border-emerald-200 text-[#047857]",
  },
  {
    number: "2",
    title: "AI Analyzes Each Photo",
    img: "/step2-ai-analysis.png",
    imgAlt: "AI chip analyzing bins across 5 compliance parameters with score 92/100",
    bullets: [
      { icon: BrainCircuit, text: "AI checks each bin across 5 compliance parameters" },
      { icon: AlertTriangle, text: "Detects fraud, contamination, location mismatch" },
      { icon: Zap,           text: "Returns trust score in 3 seconds" },
    ],
    highlight: {
      icon: CheckCircle,
      text: "Trust Score: ",
      strong: "92/100 — High Compliance",
    },
    highlightColor: "bg-blue-50 border-blue-200 text-blue-700",
  },
  {
    number: "3",
    title: "Scan. Collect. Done.",
    img: "/step3-worker-qr.png",
    imgAlt: "Sanitation worker scanning Green QR Token at citizen's door",
    bullets: [
      { icon: QrCode,      text: "Worker scans QR token at the door" },
      { icon: CheckCircle, text: "Collection logged in real-time" },
      { icon: Trophy,      text: "Citizen streak updated, fine immunity after 30 days" },
    ],
    highlight: {
      icon: Trophy,
      text: "Rewards good behavior. ",
      strong: "Encourages every home.",
    },
    highlightColor: "bg-amber-50 border-amber-200 text-amber-700",
  },
];

// ── Bottom trust bar items ─────────────────────────────────────────────────────
const TRUST = [
  { icon: ShieldCheck, label: "100% Transparent", sub: "Every action recorded" },
  { icon: Lock,        label: "Secure & Compliant", sub: "Follows SWM Rules 2026" },
  { icon: Database,    label: "Real-time Data",   sub: "For better city decisions" },
  { icon: Users,       label: "Fair for Everyone", sub: "No bias. Only verified data." },
];

// ── Single step card ───────────────────────────────────────────────────────────
function StepCard({ step, visible }: { step: Step; visible: boolean }) {
  const HighlightIcon = step.highlight.icon;
  return (
    <div
      className={[
        "flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm",
        "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
      ].join(" ")}
      style={{ flex: "1 1 0" }}
    >
      {/* Number badge */}
      <div className="px-6 pt-6">
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-[#047857] text-sm font-black text-white shadow-sm">
          {step.number}
        </span>
      </div>

      {/* Illustration */}
      <div className="mx-6 mt-4 h-48 overflow-hidden rounded-xl bg-slate-50 border border-slate-100">
        <Image
          src={step.img}
          alt={step.imgAlt}
          width={480}
          height={300}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Title */}
      <h3 className="mx-6 mt-5 text-base font-extrabold text-[#0F172A]">{step.title}</h3>

      {/* Bullets */}
      <ul className="mx-6 mt-4 flex flex-col gap-3 flex-1">
        {step.bullets.map(({ icon: BulletIcon, text }) => (
          <li key={text} className="flex items-start gap-2.5">
            <BulletIcon className="mt-0.5 size-4 shrink-0 text-[#047857]" />
            <span className="text-xs leading-relaxed text-slate-600">{text}</span>
          </li>
        ))}
      </ul>

      {/* Bottom highlight strip */}
      <div className={`mx-6 mb-6 mt-5 flex items-center gap-2.5 rounded-xl border px-4 py-3 ${step.highlightColor}`}>
        <HighlightIcon className="size-4 shrink-0" />
        <p className="text-xs font-semibold leading-snug">
          {step.highlight.text}
          {step.highlight.strong && (
            <strong className="font-extrabold">{step.highlight.strong}</strong>
          )}
        </p>
      </div>
    </div>
  );
}

// ── Main section ───────────────────────────────────────────────────────────────
export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  // Fade-in on scroll into view (Intersection Observer, no framer-motion needed)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="bg-white pt-16 pb-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div
          className={[
            "text-center transition-all duration-700 ease-out",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          {/* Eyebrow with horizontal rule accents */}
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-10 bg-[#047857]/40" />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#047857]">
              How It Works
            </span>
            <div className="h-px w-10 bg-[#047857]/40" />
          </div>

          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl lg:text-[2.6rem]">
            Three simple steps. Complete{" "}
            <span className="text-[#047857]">transparency.</span>
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
            From photo to proof — CivicMitra makes segregation verifiable, fair, and data-driven.
          </p>
        </div>

        {/* ── Cards + Arrow connectors ───────────────────────────────────── */}
        <div className="mt-12 flex flex-col items-stretch gap-6 lg:flex-row lg:items-stretch">

          <StepCard step={STEPS[0]} visible={visible} />

          {/* Arrow 1→2 (desktop only) */}
          <div className="hidden lg:flex flex-col items-center justify-center shrink-0 px-1">
            <ArrowRight className="size-6 text-slate-300" strokeWidth={2.5} />
          </div>

          <StepCard step={STEPS[1]} visible={visible} />

          {/* Arrow 2→3 (desktop only) */}
          <div className="hidden lg:flex flex-col items-center justify-center shrink-0 px-1">
            <ArrowRight className="size-6 text-slate-300" strokeWidth={2.5} />
          </div>

          <StepCard step={STEPS[2]} visible={visible} />
        </div>

        {/* ── Bottom trust bar ───────────────────────────────────────────── */}
        <div
          className={[
            "mt-12 rounded-2xl border border-slate-100 bg-slate-50 px-6 py-6",
            "transition-all duration-700 delay-300 ease-out",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
          ].join(" ")}
        >
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {TRUST.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                  <Icon className="size-4 text-[#047857]" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-800">{label}</p>
                  <p className="text-[11px] text-slate-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
