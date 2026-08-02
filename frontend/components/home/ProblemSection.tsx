"use client";

/**
 * components/home/ProblemSection.tsx
 *
 * Section 2 — The Problem
 * Background: #085041 (exact hex per spec)
 * Grid: 2-col mobile → 3-col tablet → 6-col desktop
 * Count-up animation on scroll into view via Intersection Observer
 * NO external packages — uses requestAnimationFrame for count-up
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Flame, Home, Users, Trash2, IndianRupee, Leaf } from "lucide-react";

// ── Stat data ─────────────────────────────────────────────────────────
const STATS = [
  {
    raw:    486,
    display: "486",
    label:  "Landfill fires at Dadumajra in 15 years",
    icon:   Flame,
    suffix: "",
    color:  "text-orange-400",
    bg:     "bg-orange-400/10",
  },
  {
    raw:    14,
    display: "14%",
    label:  "Households correctly segregating waste",
    icon:   Home,
    suffix: "%",
    color:  "text-sky-400",
    bg:     "bg-sky-400/10",
  },
  {
    raw:    50000,
    display: "50,000",
    label:  "Residents exposed to landfill health hazards",
    icon:   Users,
    suffix: "",
    color:  "text-rose-400",
    bg:     "bg-rose-400/10",
  },
  {
    raw:    550,
    display: "550",
    label:  "Tonnes of waste generated every single day",
    icon:   Trash2,
    suffix: "",
    color:  "text-amber-400",
    bg:     "bg-amber-400/10",
  },
  {
    raw:    14000,
    display: "₹14,000",
    label:  "Maximum fine under SWM Rules 2026",
    icon:   IndianRupee,
    suffix: "",
    prefix: "₹",
    color:  "text-violet-400",
    bg:     "bg-violet-400/10",
  },
  {
    raw:    200,
    display: "200 TPD",
    label:  "Organic waste the new CBG plant needs",
    icon:   Leaf,
    suffix: " TPD",
    color:  "text-emerald-400",
    bg:     "bg-emerald-400/10",
  },
] as const;

// ── Count-up hook ─────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1600, started: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    const startVal = 0;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(startVal + eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [target, duration, started]);

  return count;
}

// ── Single stat card ──────────────────────────────────────────────────
function StatCard({
  stat,
  started,
}: {
  stat: typeof STATS[number];
  started: boolean;
}) {
  const count = useCountUp(stat.raw, 1800, started);
  const Icon  = stat.icon;

  // Format large numbers with commas
  const formatted = count.toLocaleString("en-IN");
  const prefix    = "prefix" in stat ? stat.prefix ?? "" : "";
  const display   = started ? `${prefix}${formatted}${stat.suffix}` : "0";

  return (
    <div
      className={[
        "group flex flex-col gap-3 rounded-2xl border border-white/10 p-6",
        "transition-all duration-300 hover:border-white/20 hover:bg-white/5",
      ].join(" ")}
    >
      <div className={`inline-flex size-10 items-center justify-center rounded-xl ${stat.bg}`}>
        <Icon className={`size-5 ${stat.color}`} />
      </div>
      <p className={`text-3xl font-black tracking-tight ${stat.color} sm:text-4xl`}>
        {display}
      </p>
      <p className="text-xs leading-relaxed text-white/60">{stat.label}</p>
    </div>
  );
}

// ── Problem Section ───────────────────────────────────────────────────
export function ProblemSection() {
  const sectionRef  = useRef<HTMLElement>(null);
  const [started, setStarted] = useState(false);

  // Trigger count-up when section scrolls into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect(); // only trigger once
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="problem"
      ref={sectionRef}
      className="pt-14 pb-20"
      style={{ background: "#085041" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Section label */}
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-emerald-400/80">
          The Problem
        </p>

        {/* Heading */}
        <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Chandigarh&apos;s waste crisis — in numbers
        </h2>

        {/* Decorative divider */}
        <div className="mx-auto mt-6 h-px w-24 bg-emerald-400/40" />

        {/* Stats grid: 2 cols mobile → 3 cols tablet → 6 cols desktop */}
        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {STATS.map(stat => (
            <StatCard key={stat.label} stat={stat} started={started} />
          ))}
        </div>

        {/* Worker paragraph */}
        <div className="mx-auto mt-14 max-w-4xl">
          <div className="flex gap-5 rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
            {/* Left icon accent */}
            <div className="hidden shrink-0 sm:block">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-400/10">
                <Users className="size-7 text-emerald-400" />
              </div>
            </div>

            <div>
              <p className="text-sm leading-relaxed text-white/80 sm:text-base sm:leading-loose">
                Every morning, 926 sanitation workers arrive at household doors and make a
                judgment call — did this family segregate? One person&apos;s word against another.
                No record. No appeal. No data.{" "}
                <span className="font-bold text-[#22C55E]">CivicMitra changes this.</span>
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
