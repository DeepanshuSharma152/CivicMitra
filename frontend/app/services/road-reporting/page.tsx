"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { AlertCircle, MapPin, Camera, Send, ShieldAlert, ArrowRight } from "lucide-react";

export default function RoadReportingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold tracking-wide uppercase mb-4 border border-rose-200">
            <AlertCircle className="size-4 text-rose-600" />
            Civic Issue Reporting
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Road & Civic Waste Reporting
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 font-medium">
            Report roadside garbage dumping, overflowing community bins, blocked drains, or missed doorstep pickup directly to ward officers.
          </p>
        </div>

        {/* Workflow steps */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="size-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
              <Camera className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">1. Geotagged Photo</h3>
            <p className="text-xs text-slate-600">Capture the incident photo with automatic GPS location tagging.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="size-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4">
              <MapPin className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">2. Auto Ward Route</h3>
            <p className="text-xs text-slate-600">Complaint gets routed to assigned ward sanitation inspector immediately.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="size-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <Send className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">3. Live Status Tracking</h3>
            <p className="text-xs text-slate-600">Track resolution progress and receive photo confirmation when cleared.</p>
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl max-w-4xl mx-auto">
          <div className="space-y-3 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-3 justify-center md:justify-start">
              <ShieldAlert className="size-8 text-rose-400" />
              File a Waste / Road Complaint
            </h2>
            <p className="text-slate-300 text-sm max-w-xl">
              Use our dedicated reporting center to submit location details, photos, and descriptions for quick action.
            </p>
          </div>
          <Link
            href="/reports"
            className="shrink-0 bg-rose-500 hover:bg-rose-600 text-white font-extrabold px-6 py-3.5 rounded-xl transition-all duration-200 shadow-md flex items-center gap-2"
          >
            File Report Now <ArrowRight className="size-5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
