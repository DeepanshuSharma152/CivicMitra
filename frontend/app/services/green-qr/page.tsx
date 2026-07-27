"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { QrCode, CheckCircle, ShieldCheck, Award, ArrowRight, RefreshCw } from "lucide-react";

export default function GreenQrPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-4 border border-emerald-200">
            <QrCode className="size-4 text-emerald-600" />
            Verified Green QR Tokens
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Green QR Token Generation
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 font-medium">
            Generate and present tamper-proof cryptographic QR tokens to municipal sanitation workers during doorstep collection events.
          </p>
        </div>

        {/* Dynamic QR Demo Card */}
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 shadow-lg p-8 text-center mb-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-400" />
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold uppercase tracking-wider mb-4 border border-emerald-100">
            Active Household Token
          </span>

          <div className="size-48 mx-auto bg-slate-100 rounded-2xl border-2 border-dashed border-emerald-300 flex flex-col items-center justify-center p-4 mb-4 relative group">
            <QrCode className="size-32 text-emerald-700" />
            <div className="absolute inset-0 bg-emerald-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-xs font-bold bg-white text-slate-900 px-3 py-1.5 rounded-full shadow-sm">
                Scan via Worker App
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Token Digest Code</p>
            <p className="font-mono text-sm font-bold text-slate-800">CM-2026-SEGR-88912</p>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-around text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <CheckCircle className="size-4" /> Segregation Verified
            </span>
            <span className="flex items-center gap-1 text-teal-700 font-bold">
              <Award className="size-4" /> +50 Points
            </span>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <ShieldCheck className="size-8 text-emerald-600 mb-3" />
            <h3 className="font-bold text-slate-900 text-lg mb-1">Cryptographic Proof</h3>
            <p className="text-xs text-slate-600">Time-stamped token linked to your verified household waste report.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <RefreshCw className="size-8 text-teal-600 mb-3" />
            <h3 className="font-bold text-slate-900 text-lg mb-1">Auto-Renewal</h3>
            <p className="text-xs text-slate-600">Refreshes every 24 hours based on daily doorstep segregation score.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <Award className="size-8 text-green-600 mb-3" />
            <h3 className="font-bold text-slate-900 text-lg mb-1">Rebate & Tax Credits</h3>
            <p className="text-xs text-slate-600">Redeem tokens for municipal property tax rebates and green badges.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/dashboard#pass"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-md transition-all duration-200"
          >
            View My Active QR Tokens <ArrowRight className="size-5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
