"use client";

/**
 * components/home/WhoIsItForSection.tsx
 *
 * Section 6 — Who Is It For?
 * 3-sided platform showcase: Citizens · Workers · Authorities
 * 3-col desktop, 1-col mobile, equal-height cards via CSS grid.
 * No screenshots found in /public/screenshots/ → icon-in-gradient approach.
 * No animation library — hover:scale via Tailwind transition only.
 */

import Link from "next/link";
import {
  Users,
  ShieldCheck,
  // Citizen card
  Phone, Camera, Award,
  // Worker card
  ScanLine, Image as ImageIcon, MapPin,
  // Authority card
  BarChart3, FileText, Shield,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface RoleBullet { icon: React.ElementType; text: string }

interface RoleCard {
  /* Visual theme */
  gradientFrom: string;     // Tailwind from- class for mockup area
  gradientTo: string;       // Tailwind to- class
  borderColor: string;      // border class for card
  iconBg: string;           // icon circle bg
  iconColor: string;        // text color for hero icon
  underlineBg: string;      // colored underline
  titleColor: string;       // title text color
  ctaBg: string;            // CTA button background
  ctaHover: string;         // CTA hover class
  /* Content */
  heroIcon: React.ElementType;
  heroLabel: string;
  title: string;
  description: string;
  bullets: RoleBullet[];
  ctaLabel: string;
  ctaHref: string;
}

// ── Card data ─────────────────────────────────────────────────────────────────
const ROLES: RoleCard[] = [
  // ── CITIZENS ──
  {
    gradientFrom:  "from-green-50",
    gradientTo:    "to-white",
    borderColor:   "border-green-100",
    iconBg:        "bg-green-100",
    iconColor:     "text-green-600",
    underlineBg:   "bg-green-500",
    titleColor:    "text-[#047857]",
    ctaBg:         "bg-[#047857]",
    ctaHover:      "hover:bg-[#065f46]",
    heroIcon:      Phone,
    heroLabel:     "Green QR Token",
    title:         "For Citizens",
    description:
      "Photograph your bins before collection. Get a Green QR token. Build your compliance streak. Earn fine immunity after 30 days.",
    bullets: [
      { icon: Camera,     text: "Easy photo capture" },
      { icon: ShieldCheck,text: "Build compliance streak" },
      { icon: Award,      text: "Get fine immunity after 30 days" },
    ],
    ctaLabel: "Register as Citizen",
    ctaHref:  "/register",
  },
  // ── SANITATION WORKERS ──
  {
    gradientFrom:  "from-blue-50",
    gradientTo:    "to-white",
    borderColor:   "border-blue-100",
    iconBg:        "bg-blue-100",
    iconColor:     "text-blue-600",
    underlineBg:   "bg-blue-500",
    titleColor:    "text-[#2563EB]",
    ctaBg:         "bg-[#2563EB]",
    ctaHover:      "hover:bg-blue-700",
    heroIcon:      ScanLine,
    heroLabel:     "Scan QR Token",
    title:         "For Sanitation Workers",
    description:
      "Scan QR at household door. See bin photos. Accept or reject with one tap. No more disputes at the gate. GPS-verified collection record.",
    bullets: [
      { icon: ScanLine,   text: "Scan & verify in 1 second" },
      { icon: ImageIcon,  text: "View bin photos instantly" },
      { icon: MapPin,     text: "GPS verified collection record" },
    ],
    ctaLabel: "Worker Login",
    ctaHref:  "/login",
  },
  // ── MUNICIPAL AUTHORITIES ──
  {
    gradientFrom:  "from-indigo-50",
    gradientTo:    "to-white",
    borderColor:   "border-indigo-100",
    iconBg:        "bg-indigo-100",
    iconColor:     "text-indigo-600",
    underlineBg:   "bg-indigo-500",
    titleColor:    "text-[#4F46E5]",
    ctaBg:         "bg-[#4F46E5]",
    ctaHover:      "hover:bg-indigo-700",
    heroIcon:      BarChart3,
    heroLabel:     "Authority Dashboard",
    title:         "For Municipal Authorities",
    description:
      "Real-time ward-level compliance data. AI-verified complaint trail. NGT-ready reports from live data, not manual entry.",
    bullets: [
      { icon: BarChart3, text: "Real-time compliance dashboard" },
      { icon: FileText,  text: "NGT-ready reports & audit logs" },
      { icon: Shield,    text: "Data-driven decision making" },
    ],
    ctaLabel: "Authority Access",
    ctaHref:  "/login",
  },
];

// ── Single role card ───────────────────────────────────────────────────────────
function RoleCard({ role }: { role: RoleCard }) {
  const HeroIcon = role.heroIcon;

  return (
    <div
      className={[
        "group flex flex-col h-full rounded-2xl border bg-white shadow-sm",
        "transition-transform duration-300 hover:-translate-y-1 hover:shadow-md",
        role.borderColor,
      ].join(" ")}
    >
      {/* ── Mockup / illustration area ── */}
      <div
        className={[
          "flex flex-col items-center justify-center gap-3 h-56 rounded-t-2xl",
          `bg-gradient-to-b ${role.gradientFrom} ${role.gradientTo}`,
          "border-b",
          role.borderColor,
        ].join(" ")}
      >
        <div
          className={[
            "flex size-16 items-center justify-center rounded-2xl shadow-sm",
            role.iconBg,
          ].join(" ")}
        >
          <HeroIcon className={`size-8 ${role.iconColor}`} strokeWidth={1.5} />
        </div>
        <span
          className={[
            "rounded-full px-3 py-1 text-[11px] font-bold",
            role.iconBg,
            role.iconColor,
          ].join(" ")}
        >
          {role.heroLabel}
        </span>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-6 gap-0">
        {/* Title + underline */}
        <h3 className={`text-lg font-extrabold ${role.titleColor}`}>{role.title}</h3>
        <div className={`mt-2 mb-4 h-1 w-12 rounded-full ${role.underlineBg}`} />

        {/* Description */}
        <p className="text-sm leading-relaxed text-slate-500">{role.description}</p>

        {/* Bullets */}
        <ul className="mt-5 flex flex-col gap-2.5">
          {role.bullets.map(({ icon: BIcon, text }) => (
            <li key={text} className="flex items-center gap-2.5 text-xs text-slate-600">
              <BIcon className={`size-4 shrink-0 ${role.iconColor}`} />
              {text}
            </li>
          ))}
        </ul>

        {/* CTA — pushed to bottom */}
        <div className="mt-auto pt-6">
          <Link
            href={role.ctaHref}
            className={[
              "flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3",
              "text-sm font-bold text-white transition-all",
              role.ctaBg,
              role.ctaHover,
              "hover:-translate-y-0.5 hover:shadow-md",
            ].join(" ")}
          >
            {role.ctaLabel}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main section ───────────────────────────────────────────────────────────────
export function WhoIsItForSection() {
  return (
    <section id="who-is-it-for" className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="mb-12 text-center">
          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-10 bg-[#047857]/30" />
            <Users className="size-4 text-[#047857]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#047857]">
              Who Is It For?
            </span>
            <div className="h-px w-10 bg-[#047857]/30" />
          </div>

          {/* Title */}
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl">
            Built for{" "}
            <span className="text-[#047857]">every role</span>
            {" "}in the waste management ecosystem
          </h2>

          {/* Subtitle */}
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
            CivicMitra connects citizens, workers, and authorities on one transparent,
            AI-verified platform.
          </p>
        </div>

        {/* ── 3-column grid ── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {ROLES.map(role => (
            <RoleCard key={role.title} role={role} />
          ))}
        </div>

        {/* ── Bottom tagline bar ── */}
        <div className="mt-10 rounded-2xl bg-[#F9FAFB] border border-slate-200 px-6 py-5 text-center">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="size-5 shrink-0 text-[#047857]" />
            <p className="text-sm font-extrabold text-[#0F172A]">
              One Platform. Three Roles. Zero Disputes.
            </p>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            CivicMitra brings transparency, accountability, and trust to every doorstep.
          </p>
        </div>

      </div>
    </section>
  );
}
