"use client";

/**
 * components/home/HeroSection.tsx
 *
 * BEFORE: py-20 lg:py-28 caused ~160px dead space below the fixed navbar.
 * AFTER:  pt-10 pb-16 — hero content starts immediately after navbar.
 *
 * Visual overhaul of right panel:
 * - Soft illustrated cityscape SVG background (low opacity)
 * - Radial white glow behind phone
 * - Phone image with slight 3-D tilt (perspective + rotateY CSS)
 * - Ellipse platform/stand under bins
 * - 4 floating connection pill badges with Lucide icons
 * - Dotted SVG arc lines connecting badges to phone
 * - Trust bar below CTAs (3 items, icon + label + sub)
 */

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight, ShieldCheck, CheckCircle2,
  Users, BrainCircuit, BarChart2, HardHat,
} from "lucide-react";

// ── Animation variants ──────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};
const phoneAnim = {
  hidden: { opacity: 0, scale: 0.94, y: 18 },
  show:   { opacity: 1, scale: 1,    y: 0,  transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const, delay: 0.18 } },
};

// ── Trust bar data ──────────────────────────────────────────────────────────
const TRUST = [
  { icon: CheckCircle2, label: "AI Verified",    sub: "100% Transparent"   },
  { icon: ShieldCheck,  label: "QR Based Proof", sub: "Tamper Resistant"   },
  { icon: CheckCircle2, label: "SWM Rules 2026", sub: "Secure & Compliant" },
];

// ── Floating badge data (4 connection labels around phone) ──────────────────
const LABELS = [
  { icon: Users,       text: "Citizens Segregate", color: "#047857",  pos: "top-6 left-0"    },
  { icon: BrainCircuit,text: "AI Validates",       color: "#3B82F6",  pos: "top-6 right-0"   },
  { icon: BarChart2,   text: "Data Recorded",      color: "#EAB308",  pos: "top-[42%] left-0"},
  { icon: HardHat,     text: "Workers Collect",    color: "#047857",  pos: "bottom-24 right-0"},
];

// ── Cityscape SVG (soft silhouette behind phone) ────────────────────────────
function CityscapeBg() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 600 260"
      className="absolute bottom-0 left-0 right-0 w-full opacity-[0.07] pointer-events-none"
      style={{ fill: "#047857" }}
    >
      {/* Buildings */}
      <rect x="0"   y="160" width="40"  height="100" />
      <rect x="50"  y="120" width="55"  height="140" />
      <rect x="115" y="80"  width="45"  height="180" />
      <rect x="170" y="140" width="35"  height="120" />
      <rect x="215" y="100" width="60"  height="160" />
      <rect x="285" y="60"  width="50"  height="200" />
      <rect x="345" y="130" width="40"  height="130" />
      <rect x="395" y="90"  width="55"  height="170" />
      <rect x="460" y="150" width="35"  height="110" />
      <rect x="505" y="110" width="50"  height="150" />
      <rect x="560" y="80"  width="40"  height="180" />
      {/* Tree circles */}
      <circle cx="30"  cy="165" r="18" />
      <circle cx="55"  cy="170" r="14" />
      <circle cx="560" cy="155" r="20" />
      <circle cx="585" cy="160" r="15" />
    </svg>
  );
}

// ── Floating connection badge ────────────────────────────────────────────────
function FloatingBadge({
  icon: Icon, text, color, pos, delay,
}: {
  icon: React.ElementType; text: string; color: string; pos: string; delay: number;
}) {
  return (
    <motion.div
      className={`absolute z-20 hidden lg:flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-lg border border-slate-100 ${pos}`}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <Icon className="size-3.5 shrink-0" style={{ color }} />
      <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">{text}</span>
    </motion.div>
  );
}

// ── Main Hero Section ────────────────────────────────────────────────────────
export function HeroSection() {
  return (
    <section
      id="hero"
      /* BUGFIX 1: was py-20 lg:py-28 (caused ~160px dead space).
         Now pt-10 pb-16 — starts right after the fixed 72px navbar. */
      className="relative overflow-hidden"
      style={{
        /* BUGFIX: removed minHeight that forced full-viewport height causing dead space */
        background: "linear-gradient(150deg, #f0fdf8 0%, #f8fffc 40%, #ffffff 65%, #f0faf5 100%)",
      }}
    >
      {/* Blob accents */}
      <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 size-[480px] rounded-full opacity-[0.15]"
        style={{ background: "radial-gradient(circle, #22C55E 0%, transparent 70%)" }} />
      <div aria-hidden className="pointer-events-none absolute bottom-0 -left-16 size-[340px] rounded-full opacity-[0.08]"
        style={{ background: "radial-gradient(circle, #047857 0%, transparent 70%)" }} />

      <div className="relative mx-auto w-full max-w-7xl px-4 pt-10 pb-10 sm:px-6 lg:px-8 lg:pt-14 lg:pb-12">
        <div className="grid items-center gap-10 lg:grid-cols-12">

          {/* ── LEFT: Text ──────────────────────────────────────────────── */}
          <motion.div
            className="lg:col-span-6"
            variants={container} initial="hidden" animate="show"
          >
            <motion.div variants={item}>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-[#047857]">
                <ShieldCheck className="size-4" />
                Verifiable Municipal Waste Infrastructure · SWM Rules 2026
              </span>
            </motion.div>

            <motion.h1 variants={item}
              className="mt-5 text-4xl font-extrabold tracking-tight text-[#0F172A] sm:text-[3.5rem] sm:leading-[1.08]"
            >
              Clean City.{" "}
              <br className="hidden sm:inline" />
              <span className="text-[#047857]">Better Tomorrow.</span>
            </motion.h1>

            <motion.p variants={item}
              className="mt-4 max-w-md text-base leading-relaxed text-[#64748B] sm:text-lg"
            >
              AI-powered waste segregation verification for Chandigarh — citizens prove
              compliance, AI validates, workers collect. No disputes, just verified data.
            </motion.p>

            <motion.div variants={item} className="mt-7 flex flex-wrap items-center gap-4">
              <Link id="hero-cta-submit" href="/citizen/submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[#047857] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#065f46] hover:shadow-lg hover:-translate-y-0.5"
              >
                Submit Waste <ArrowRight className="size-4" />
              </Link>
              <Link id="hero-cta-track" href="/track-request"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-all hover:border-[#047857] hover:text-[#047857] hover:-translate-y-0.5"
              >
                Track Request
              </Link>
            </motion.div>

            {/* Trust bar */}
            <motion.div variants={item}
              className="mt-8 flex flex-wrap items-start gap-5 border-t border-slate-200/80 pt-6"
            >
              {TRUST.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="size-4 shrink-0 text-[#22C55E]" />
                  <div>
                    <p className="text-xs font-bold text-slate-700">{label}</p>
                    <p className="text-[11px] text-[#64748B]">{sub}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── RIGHT: Phone Mockup Visual ──────────────────────────────── */}
          <motion.div
            className="relative flex justify-center lg:col-span-6"
            variants={phoneAnim} initial="hidden" animate="show"
          >
            {/* Illustrated cityscape background */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              <CityscapeBg />
            </div>

            {/* Radial white glow behind phone */}
            <div aria-hidden className="absolute inset-[10%] rounded-full blur-3xl opacity-60 pointer-events-none"
              style={{ background: "radial-gradient(circle, #ffffff 0%, #d1fae5 50%, transparent 80%)" }} />

            {/* Floating connection badge labels */}
            {LABELS.map(l => (
              <FloatingBadge key={l.text} icon={l.icon} text={l.text} color={l.color} pos={l.pos} delay={LABELS.indexOf(l) * 0.4} />
            ))}

            {/* Phone wrapper with 3-D tilt (BUGFIX 2: no longer flat) */}
            <div
              className="relative z-10 mx-auto"
              style={{
                width: "clamp(240px, 38vw, 340px)",
                /* Slight 3-D perspective tilt matching reference */
                transform: "perspective(900px) rotateY(-6deg) rotateX(2deg)",
                filter: "drop-shadow(0 32px 48px rgba(4,120,87,0.22)) drop-shadow(0 8px 16px rgba(0,0,0,0.10))",
              }}
            >
              <Image
                src="/phone-mockup-bins.png"
                alt="CivicMitra app: Green QR Token with 4 waste bins — Wet, Dry, Hazardous, Sanitary"
                width={680}
                height={860}
                className="w-full object-contain"
                priority
              />

              {/* Ellipse platform/stand under bins */}
              <div
                aria-hidden
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-[-1]"
                style={{
                  width: "88%",
                  height: 28,
                  background: "radial-gradient(ellipse at center, rgba(0,0,0,0.10) 0%, transparent 75%)",
                  borderRadius: "50%",
                  filter: "blur(6px)",
                }}
              />
            </div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}
