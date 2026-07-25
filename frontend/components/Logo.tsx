"use client";

import Link from "next/link";
import Image from "next/image";

export function Logo({ href = "/dashboard", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`flex items-center gap-3 shrink-0 no-underline group ${className}`}>
      <div className="relative size-10 sm:size-11 shrink-0 overflow-hidden transition-transform group-hover:scale-105">
        <Image
          src="/logo.png"
          alt="CivicMitra Logo"
          fill
          sizes="(max-width: 640px) 40px, 44px"
          className="object-contain"
          priority
        />
      </div>
      <div className="flex flex-col justify-center leading-tight">
        <span className="text-[20px] sm:text-[22px] font-extrabold tracking-tight text-[#047857]">CivicMitra</span>
        <span className="text-[11px] sm:text-xs font-semibold text-[#5A6B82]">Clean City. Better Tomorrow.</span>
      </div>
    </Link>
  );
}
