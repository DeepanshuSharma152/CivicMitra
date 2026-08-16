"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Truck,
  UserCheck,
} from "lucide-react";
import { CitizenHeader } from "@/components/CitizenHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { readSession } from "@/lib/session";
import type { Profile } from "@/lib/types";

export default function CollectionSchedulePage() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function loadData() {
      const session = readSession();
      if (!session) {
        window.location.assign("/login");
        return;
      }
      try {
        const nextProfile = await api.profile();
        setProfile(nextProfile);
      } catch {/* ignore */}
    }
    void loadData();
  }, []);

  const scheduleDays = [
    { day: "Monday", wet: "7:30 AM - 9:30 AM", dry: "N/A", status: "Completed" },
    { day: "Tuesday", wet: "7:30 AM - 9:30 AM", dry: "10:00 AM - 12:00 PM", status: "Upcoming" },
    { day: "Wednesday", wet: "7:30 AM - 9:30 AM", dry: "N/A", status: "Upcoming" },
    { day: "Thursday", wet: "7:30 AM - 9:30 AM", dry: "10:00 AM - 12:00 PM", status: "Upcoming" },
    { day: "Friday", wet: "7:30 AM - 9:30 AM", dry: "N/A", status: "Upcoming" },
    { day: "Saturday", wet: "7:30 AM - 9:30 AM", dry: "10:00 AM - 12:00 PM", status: "Upcoming" },
    { day: "Sunday", wet: "Off-day (Maintenance)", dry: "Off-day", status: "Holiday" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <CitizenHeader activeTab="schedule" profile={profile} />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
              <Link href="/dashboard" className="hover:underline flex items-center gap-1">
                <ArrowLeft className="size-3.5" /> Citizen Portal
              </Link>
              <span>/</span>
              <span className="text-slate-500">Collection Schedule</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Doorstep Waste Collection Timetable
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
              Ward route timing for wet organic waste and dry recyclables collection.
            </p>
          </div>
        </div>

        {/* Live Truck Status Banner */}
        <Card className="border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 shadow-xs rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#047857] text-white shrink-0 shadow-sm">
                <Truck className="size-6" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase tracking-wider mb-0.5">
                  LIVE ROUTE STATUS
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Municipal Truck #CVM-EV-408 Active in Sector 17
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Estimated arrival at your doorstep: <strong className="text-emerald-900">Today around 8:45 AM</strong>
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-emerald-800 shadow-2xs shrink-0">
              <MapPin className="size-4 text-emerald-600" /> GPS Track Active
            </span>
          </div>
        </Card>

        {/* Timetable Grid */}
        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-3xl overflow-hidden">
          <CardHeader className="p-5 px-6 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="size-4 text-emerald-700" /> Weekly Collection Timetable
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {scheduleDays.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <span className="text-sm font-bold text-slate-900">{item.day}</span>
                  </div>

                  <div className="flex items-center gap-6 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        🟢 Wet Waste (Daily)
                      </span>
                      <span className="font-semibold text-slate-800">{item.wet}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        🔵 Dry Recyclables
                      </span>
                      <span className="font-semibold text-slate-800">{item.dry}</span>
                    </div>
                  </div>

                  <span
                    className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold text-right ${
                      item.status === "Completed"
                        ? "bg-slate-100 text-slate-600"
                        : item.status === "Upcoming"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
