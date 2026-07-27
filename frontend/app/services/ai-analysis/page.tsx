"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Sparkles, Upload, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react";

export default function AiAnalysisPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar />
      
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12">
        {/* Header Badge & Title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-4 border border-emerald-200">
            <Sparkles className="size-4 text-emerald-600" />
            AI Segregation Engine 2026
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            AI Waste Analysis & Segregation Verification
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 font-medium">
            Upload images of wet, dry, and hazardous waste bins. Our vision AI model instantly classifies waste compliance, calculates doorstep segregation accuracy, and generates audit tokens.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="size-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <Upload className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">1. Image Upload</h3>
            <p className="text-sm text-slate-600">
              Snap photos of wet waste, dry recyclables, and domestic hazardous waste at your doorstep.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="size-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-4">
              <Sparkles className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">2. Groq AI Scoring</h3>
            <p className="text-sm text-slate-600">
              Powered by deep vision inference model analyzing purity score, bin types, and contamination risks.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="size-12 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 mb-4">
              <ShieldCheck className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">3. Green Token Issue</h3>
            <p className="text-sm text-slate-600">
              Instant verification QR token issued upon achieving &ge;80% segregation threshold score.
            </p>
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-gradient-to-br from-emerald-900 to-teal-900 rounded-3xl p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-3 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to Verify Your Segregation?</h2>
            <p className="text-emerald-100/90 text-sm sm:text-base max-w-xl">
              Proceed to our citizen submission terminal to scan your bins or upload real-time images for AI analysis.
            </p>
          </div>
          <Link
            href="/citizen/submit"
            className="shrink-0 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-extrabold px-6 py-3.5 rounded-xl transition-all duration-200 shadow-md hover:scale-105 flex items-center gap-2"
          >
            Start Waste Analysis <ArrowRight className="size-5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
