/**
 * components/home/Footer.tsx
 * Full 4-column professional footer. Server Component.
 * bg #0F172A | 1 col mobile → 2 col tablet → 4 col desktop
 */

import Link from "next/link";
import Image from "next/image";

// ── Column link data ──────────────────────────────────────────────────────────
const PRODUCT_LINKS = [
  { label: "Submit Waste",   href: "/citizen/submit" },
  { label: "Track Request",  href: "/track-request"  },
  { label: "How it Works",   href: "#how-it-works"   },
  { label: "The Problem",    href: "#problem"         },
  { label: "4-Bin System",   href: "#four-bin-system" },
];

const COMPANY_LINKS = [
  { label: "About",                href: "#about",                external: false },
  { label: "The Tribune Article",  href: "#",                     external: true  },
  { label: "SWM Rules 2026",       href: "#",                     external: true  },
  { label: "Contact",              href: "mailto:hello@civicmitra.in", external: false },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy",        href: "#" },
  { label: "Terms of Service",      href: "#" },
  { label: "Municipal Partnership", href: "#" },
];

// ── Reusable column heading ───────────────────────────────────────────────────
function ColHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white">
      {children}
    </h4>
  );
}

// ── Reusable link list ────────────────────────────────────────────────────────
function LinkList({ links }: { links: { label: string; href: string; external?: boolean }[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {links.map(({ label, href, external }) => (
        <li key={label}>
          <Link
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className="text-sm text-slate-400 transition-colors hover:text-white"
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ── Main Footer ───────────────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer
      className="border-t border-white/10 py-16"
      style={{ background: "#0F172A" }}
    >
      <div className="mx-auto max-w-7xl px-6">

        {/* ── 4-column grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">

          {/* Col 1 — Brand + About */}
          <div>
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="relative size-10 shrink-0 overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="CivicMitra"
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-bold text-white group-hover:text-green-400 transition-colors">
                  CivicMitra
                </span>
                <span className="text-[11px] text-slate-500">
                  Clean City. Better Tomorrow.
                </span>
              </div>
            </Link>

            {/* About paragraph */}
            <p className="mt-5 text-sm leading-relaxed text-slate-400 max-w-xs">
              CivicMitra builds accountability infrastructure for waste segregation.
              Not with cameras or sensors, but by giving citizens a way to prove
              compliance before the truck arrives, and giving workers objective data
              instead of subjective judgment. Scalable to any Indian municipality.
            </p>
          </div>

          {/* Col 2 — Product */}
          <div>
            <ColHeading>Product</ColHeading>
            <LinkList links={PRODUCT_LINKS} />
          </div>

          {/* Col 3 — Company */}
          <div>
            <ColHeading>Company</ColHeading>
            <LinkList links={COMPANY_LINKS} />
          </div>

          {/* Col 4 — Legal */}
          <div>
            <ColHeading>Legal</ColHeading>
            <LinkList links={LEGAL_LINKS} />
            <p className="mt-6 text-xs leading-relaxed text-slate-500">
              Built for Chandigarh<br />Municipal Corporation
            </p>
          </div>

        </div>

        {/* ── Bottom bar ────────────────────────────────────────────────── */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} CivicMitra. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">
            For a cleaner Chandigarh.
          </p>
        </div>

      </div>
    </footer>
  );
}
