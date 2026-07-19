"use client";

import Link from "next/link";
import { ClipboardList, History, QrCode, UserRound } from "lucide-react";

export function WorkerNav({
  active,
}: {
  active: "scan" | "stops" | "history" | "profile";
}) {
  const items = [
    { key: "scan", href: "/worker/scan", label: "Scan", icon: <QrCode /> },
    {
      key: "stops",
      href: "/worker/stops",
      label: "My stops",
      icon: <ClipboardList />,
    },
    {
      key: "history",
      href: "/worker/history",
      label: "History",
      icon: <History />,
    },
    {
      key: "profile",
      href: "/worker/profile",
      label: "Profile",
      icon: <UserRound />,
    },
  ] as const;
  return (
    <nav
      aria-label="Worker navigation"
      className="mb-6 grid grid-cols-4 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 text-sm"
    >
      <>
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-2 text-center font-medium sm:flex-row ${active === item.key ? "bg-emerald-50 text-emerald-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"}`}
          >
            <span className="[&_svg]:size-4">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </>
    </nav>
  );
}
