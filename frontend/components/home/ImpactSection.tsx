"use client";

/**
 * components/home/ImpactSection.tsx
 *
 * Section 5 — Impact by the Numbers
 * Dark strip: bg #022C22 (distinct from Section 2's #085041)
 * 4-column layout, massive numbers, vertical dividers on desktop
 * Compact: py-16 max. No cards, no borders around columns.
 * Intersection Observer fade-in, Lucide icons only.
 */

import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  TrendingDown,
  Leaf,
  Handshake,
  Calendar,
  ShieldCheck,
} from "lucide-react";

// ── Stat data ─────────────────────────────────────────────────────────────────
const STATS = [
  {
    icon:     TrendingDown,
    number:   "14%",
    label:    "Chandigarh's current segregation rate",
    sublabel: "Problem baseline",
  },
  {
    icon:     Leaf,
    number:   "200 TPD",
    label:    "Organic waste target for Dadumajra CBG Plant",
    sublabel: "Required to run at optimal capacity",
  },
  {
    icon:     Handshake,
    number:   "₹125 Cr",
    label:    "Investment in CBG plant",
    sublabel: "MC + IOCL partnership for a cleaner Chandigarh",
  },
  {
    icon:     Calendar,
    number:   "2028",
    label:    "Year CBG plant commissions",
    sublabel: "Software & verification system needed NOW",
  },
] as const;

// ── Main section ───────────────────────────────────────────────────────────────
export function ImpactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      id="impact"
      ref={sectionRef}
      /* Full-bleed on desktop, slight inset on mobile */
      className="py-6 px-4 sm:px-6 lg:px-8 bg-white"
    >
      {/* Dark card wrapper — distinct from Section 2's #085041 */}
      <div
        className={[
          "relative mx-auto max-w-7xl overflow-hidden rounded-2xl py-14 px-6 sm:px-10 lg:px-16",
          "transition-all duration-700 ease-out",
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        ].join(" ")}
        style={{ background: "#022C22" }}
      >
        {/* Subtle green glow at top-center */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 size-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #22C55E 0%, transparent 65%)" }}
        />

        {/* ── Eyebrow header ───────────────────────────────────────────── */}
        <div
          className={[
            "mb-12 flex items-center justify-center gap-3",
            "transition-all duration-700 delay-100 ease-out",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          ].join(" ")}
        >
          <div className="h-px flex-1 max-w-[80px] bg-green-700/50" />
          <BarChart3 className="size-4 text-green-400" />
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-green-400">
            Impact by the Numbers
          </span>
          <div className="h-px flex-1 max-w-[80px] bg-green-700/50" />
        </div>

        {/* ── 4-column stat grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-y-12 gap-x-4 lg:grid-cols-4 lg:gap-0">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            const isLast = i === STATS.length - 1;
            return (
              <div
                key={stat.label}
                className={[
                  "flex flex-col items-center text-center px-4",
                  /* Vertical divider between columns on desktop only */
                  !isLast ? "lg:border-r lg:border-green-900/70" : "",
                  "transition-all duration-700 ease-out",
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
                ].join(" ")}
                style={{ transitionDelay: visible ? `${150 + i * 80}ms` : "0ms" }}
              >
                {/* Icon circle */}
                <div
                  className="mb-5 flex size-14 items-center justify-center rounded-full border border-green-800"
                  style={{ background: "rgba(34,197,94,0.08)" }}
                >
                  <Icon className="size-6 text-green-400" strokeWidth={1.75} />
                </div>

                {/* Big number */}
                <p className="text-4xl font-black leading-none tracking-tight text-green-400 sm:text-5xl lg:text-6xl">
                  {stat.number}
                </p>

                {/* Green underline accent */}
                <div className="mt-3 mb-3 h-0.5 w-10 rounded-full bg-green-700/60" />

                {/* Label */}
                <p className="text-sm font-bold leading-snug text-white sm:text-[15px]">
                  {stat.label}
                </p>

                {/* Sublabel */}
                <p className="mt-1.5 text-xs leading-relaxed text-green-300/60">
                  {stat.sublabel}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Bottom tagline ───────────────────────────────────────────── */}
        <div
          className={[
            "mt-14 flex items-center justify-center gap-2 border-t border-green-900/50 pt-7",
            "transition-all duration-700 delay-500 ease-out",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
          ].join(" ")}
        >
          <ShieldCheck className="size-4 shrink-0 text-green-400" />
          <p className="text-center text-sm text-green-200/60">
            Real data. Real problem. Real solution.{" "}
            <span className="font-bold text-green-400">CivicMitra</span>{" "}
            brings accountability to every doorstep.
          </p>
        </div>
      </div>
    </section>
  );
}
