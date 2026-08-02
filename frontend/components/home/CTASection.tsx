/**
 * components/home/CTASection.tsx
 * Section 8 — Final CTA Banner. Server Component (no interactivity needed).
 * Compact dark-green banner, centered content, pill CTA button.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section
      className="py-16 md:py-20"
      style={{
        background: "#085041",
        /* Subtle dot-grid texture at 3% opacity for depth */
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="mx-auto max-w-3xl px-6 text-center">

        {/* Headline */}
        <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          Ready to make your ward cleaner?
        </h2>

        {/* Sub-headline */}
        <p className="mt-4 text-lg text-green-100/90 md:text-xl">
          Join citizens across Chandigarh building a verified waste compliance record.
        </p>

        {/* CTA button */}
        <div className="mt-10">
          <Link
            href="/register"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-[#047857] transition-all hover:bg-green-50 hover:scale-105 sm:w-auto"
          >
            Get Started Free
            <ArrowRight className="size-5" />
          </Link>
        </div>

        {/* Trust microcopy */}
        <p className="mt-6 text-sm text-green-200/60">
          Free for all Chandigarh households · No credit card required
        </p>

      </div>
    </section>
  );
}
