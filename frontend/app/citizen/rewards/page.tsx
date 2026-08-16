"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Gift,
  Leaf,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { CitizenHeader } from "@/components/CitizenHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { readSession } from "@/lib/session";
import type { Profile } from "@/lib/types";

export default function RewardsBadgesPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [points, setPoints] = useState(250);
  const [streakDays, setStreakDays] = useState(14);

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

        if (nextProfile.householdId) {
          const streak = await api.getStreak(nextProfile.householdId).catch(() => null);
          if (streak) {
            setPoints(streak.greenPoints || 250);
            setStreakDays(streak.currentStreakDays || 14);
          }
        }
      } catch {/* ignore */}
    }
    void loadData();
  }, []);

  const rewards = [
    { title: "10% Off Property Tax Bill", points: 500, category: "Municipal Discount", status: "In Progress" },
    { title: "Free Organic Compost Bag (5kg)", points: 200, category: "Eco Perk", status: "Claimed" },
    { title: "Civic Champion E-Certificate", points: 100, category: "Recognition", status: "Claimed" },
    { title: "Priority Utility Request Pass", points: 800, category: "Civic Priority", status: "Locked" },
  ];

  const badges = [
    { title: "7-Day Segregation Master", icon: "🌱", desc: "Maintained 7 consecutive days of 85%+ score" },
    { title: "Eco Pioneer", icon: "⭐", desc: "Early adopter in Ward 2" },
    { title: "Zero Contamination Hero", icon: "🏆", desc: "3 consecutive clean bin uploads" },
    { title: "Green QR Frequent Flyer", icon: "🎖️", desc: "Issued 10+ Green QR Tokens" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased">
      <CitizenHeader activeTab="rewards" profile={profile} />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
              <Link href="/dashboard" className="hover:underline flex items-center gap-1">
                <ArrowLeft className="size-3.5" /> Citizen Portal
              </Link>
              <span>/</span>
              <span className="text-slate-500">Rewards & Badges</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Green Points & Badges
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
              Earn Green Points for proper waste segregation and unlock municipal rewards.
            </p>
          </div>
        </div>

        {/* Top Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border border-emerald-200 bg-gradient-to-br from-emerald-900 to-[#044E3A] text-white p-6 rounded-3xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-emerald-200 uppercase tracking-wider">
                  CURRENT GREEN POINTS
                </p>
                <h2 className="text-4xl font-black text-white mt-1">{points} pts</h2>
                <p className="text-xs text-emerald-100 mt-2 font-medium">
                  +25 points earned per verified doorstep pickup pass.
                </p>
              </div>
              <div className="size-16 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300 border border-white/20">
                <Gift className="size-8" />
              </div>
            </div>
          </Card>

          <Card className="border border-amber-200 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white p-6 rounded-3xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-amber-100 uppercase tracking-wider">
                  COMPLIANCE STREAK
                </p>
                <h2 className="text-4xl font-black text-white mt-1">{streakDays} Days</h2>
                <p className="text-xs text-amber-100 mt-2 font-medium">
                  Keep uploading daily to unlock the 30-Day Master Badge!
                </p>
              </div>
              <div className="size-16 rounded-2xl bg-white/10 flex items-center justify-center text-amber-100 border border-white/20">
                <Trophy className="size-8" />
              </div>
            </div>
          </Card>
        </div>

        {/* Redeemable Rewards Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Award className="size-5 text-emerald-700" /> Municipal Rewards Catalog
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((r, idx) => (
              <Card key={idx} className="border border-slate-200 bg-white shadow-xs rounded-2xl p-5 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-emerald-700 tracking-wider">
                    {r.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">{r.title}</h3>
                  <p className="text-xs font-bold text-slate-500 mt-1">{r.points} Green Points</p>
                </div>

                <button
                  disabled={r.status === "Claimed" || r.status === "Locked"}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                    r.status === "Claimed"
                      ? "bg-slate-100 text-slate-400 border border-slate-200"
                      : r.status === "In Progress"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {r.status === "Claimed" ? "Claimed ✓" : r.status === "In Progress" ? "Redeem Now" : "Locked"}
                </button>
              </Card>
            ))}
          </div>
        </div>

        {/* Badges Grid */}
        <div className="space-y-4 pt-2">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Star className="size-5 text-amber-500" /> Earned Badges
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {badges.map((b, idx) => (
              <Card key={idx} className="border border-slate-200 bg-white shadow-xs rounded-2xl p-4 text-center space-y-2">
                <div className="text-3xl">{b.icon}</div>
                <h3 className="text-xs font-bold text-slate-900">{b.title}</h3>
                <p className="text-[11px] text-slate-500 font-medium leading-tight">{b.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
