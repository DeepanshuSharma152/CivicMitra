"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Flame, Trophy, Calendar, CheckCircle2, TrendingUp, ArrowRight } from "lucide-react";

export default function StreakPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold tracking-wide uppercase mb-4 border border-amber-200">
            <Flame className="size-4 text-amber-600 fill-amber-500 animate-bounce" />
            Compliance Gamification
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Household Waste Streak Maintenance
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 font-medium">
            Maintain daily waste segregation streaks to unlock municipal incentives, green household badges, and tax credits.
          </p>
        </div>

        {/* Streak Counter Hero Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-8 text-white shadow-xl max-w-2xl mx-auto mb-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-5">
            <div className="size-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0">
              <Flame className="size-12 text-yellow-200 fill-yellow-300" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-amber-100">Current Household Streak</span>
              <h2 className="text-4xl font-black text-white">14 Consecutive Days</h2>
              <p className="text-xs text-amber-100 mt-1">Top 5% Eco-Champions in Ward 12</p>
            </div>
          </div>
          <div className="bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-3 rounded-xl text-center">
            <span className="block text-2xl font-black">+350</span>
            <span className="text-[11px] font-bold text-amber-100 uppercase">Green Credits</span>
          </div>
        </div>

        {/* Weekly Streak Tracker Grid */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm max-w-3xl mx-auto mb-12">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Calendar className="size-5 text-emerald-600" /> Daily Segregation Record (This Week)
          </h3>
          <div className="grid grid-cols-7 gap-3 text-center">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => (
              <div key={day} className="flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-slate-500">{day}</span>
                <div className={`size-10 rounded-full flex items-center justify-center text-xs font-bold ${
                  idx < 5 ? "bg-emerald-500 text-white shadow-xs" : idx === 5 ? "bg-emerald-100 text-emerald-800 border-2 border-emerald-500" : "bg-slate-100 text-slate-400"
                }`}>
                  {idx < 5 ? <CheckCircle2 className="size-5" /> : idx === 5 ? "Today" : ""}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <Trophy className="size-8 text-amber-500 mb-3" />
            <h4 className="font-bold text-slate-900 text-base mb-1">Badge Levels</h4>
            <p className="text-xs text-slate-600">Unlock Bronze, Silver, Gold, and Platinum Ward Badges for long streaks.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <TrendingUp className="size-8 text-emerald-600 mb-3" />
            <h4 className="font-bold text-slate-900 text-base mb-1">Multiplier Rewards</h4>
            <p className="text-xs text-slate-600">Streaks over 10 days double your green credit generation rate.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <Flame className="size-8 text-orange-500 mb-3" />
            <h4 className="font-bold text-slate-900 text-base mb-1">Streak Saver</h4>
            <p className="text-xs text-slate-600">Submit retroactive proof within 24 hours to protect your active streak.</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-md transition-all duration-200"
          >
            Check Household Dashboard <ArrowRight className="size-5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
