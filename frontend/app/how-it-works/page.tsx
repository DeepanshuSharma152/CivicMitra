"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Upload, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-4 border border-emerald-200">
            <Sparkles className="size-4 text-emerald-600" />
            Verification Architecture
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            How CivicMitra Works
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 font-medium">
            Building verified ground-level trust through our simple 3-step audit sequence connecting citizens, AI verification models, and municipal sanitation authorities.
          </p>
        </div>

        {/* 3-Step Flow Diagram Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16 relative">
          {/* Step 1 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md flex flex-col justify-between relative group hover:border-emerald-400 transition-all">
            <div className="space-y-4">
              <div className="size-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                01
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Citizen Submits</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Citizens capture photos of segregated wet, dry, and domestic hazardous waste bins at their doorstep, or log geotagged civic grievances.
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-emerald-700">
              <Upload className="size-4" /> Doorstep Photo Capture
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md flex flex-col justify-between relative group hover:border-teal-400 transition-all">
            <div className="space-y-4">
              <div className="size-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black text-xl border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                02
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">AI Verifies</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Vision AI models analyze bin contents for purity, calculate segregation compliance scores, and generate time-stamped Green QR tokens.
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-teal-700">
              <Sparkles className="size-4" /> Groq AI Vision Analysis
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md flex flex-col justify-between relative group hover:border-green-400 transition-all">
            <div className="space-y-4">
              <div className="size-14 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center font-black text-xl border border-green-100 group-hover:bg-green-600 group-hover:text-white transition-colors">
                03
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Authority Resolves</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Sanitation workers scan household Green QR passes during collection, and ward officers receive instant telemetry for NGT compliance reporting.
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-green-700">
              <ShieldCheck className="size-4" /> Tamper-Proof Audit Pass
            </div>
          </div>
        </div>

        {/* Call to Action Banner */}
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="space-y-3 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-black">Ready to get started?</h2>
            <p className="text-slate-300 text-sm max-w-xl">
              Join thousands of households making their city cleaner and earning municipal property tax rebates.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/register"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
            >
              Sign Up as Citizen <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
