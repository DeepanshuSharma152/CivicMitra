"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ChevronDown, Search, PlusCircle, ArrowRight, ShieldCheck,
  Smile, Shield, Trash2, Truck, Wrench, Lightbulb, Waves,
  Droplets, Users, MessageSquare, ChevronRight, Phone, Mail,
  Clock, Globe, Facebook, Twitter, Instagram, Youtube, CheckCircle2,
  Recycle, HardHat, FileText, CheckCircle
} from "lucide-react";

import { useAuth } from "./context/AuthContext";
import { Logo } from "@/components/Logo";

// ── Navbar (Fixed White Background) ─────────────────────────────
function Navbar() {
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { session, logout, isLoading } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-20 border-b border-slate-200/80 bg-white shadow-xs">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Name */}
        <Logo href="/" />

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-6 lg:flex">
          <Link href="/" className="border-b-2 border-[#047857] py-1 text-[14px] font-semibold text-[#047857]">
            Home
          </Link>
          <div className="group relative flex items-center gap-1 cursor-pointer py-1 text-[14px] font-medium text-slate-700 hover:text-[#047857]">
            <span>Services</span>
            <ChevronDown className="size-4 text-slate-400 group-hover:text-[#047857]" />
          </div>
          <Link href="/citizen/submit" className="py-1 text-[14px] font-medium text-slate-700 hover:text-[#047857]">
            Track Request
          </Link>
          <Link href="/dashboard" className="py-1 text-[14px] font-medium text-slate-700 hover:text-[#047857]">
            Dashboard
          </Link>
          <Link href="/dashboard#reports" className="py-1 text-[14px] font-medium text-slate-700 hover:text-[#047857]">
            Reports
          </Link>
          <div className="group relative flex items-center gap-1 cursor-pointer py-1 text-[14px] font-medium text-slate-700 hover:text-[#047857]">
            <span>Resources</span>
            <ChevronDown className="size-4 text-slate-400 group-hover:text-[#047857]" />
          </div>
          <Link href="#about" className="py-1 text-[14px] font-medium text-slate-700 hover:text-[#047857]">
            About Us
          </Link>
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden items-center gap-4 lg:flex">
          {/* Language Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Globe className="size-3.5 text-slate-500" />
              <span>English</span>
              <ChevronDown className="size-3.5 text-slate-400" />
            </button>
          </div>

          {!isLoading && session ? (
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-[#047857]">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{session.name} ({session.role})</span>
              </div>
              <Link
                href={session.role === "WORKER" ? "/worker" : session.role === "CITIZEN" ? "/citizen" : "/dashboard"}
                style={{ color: '#ffffff' }}
                className="rounded-lg bg-[#047857] px-4 py-2 text-xs font-bold !text-white shadow-xs hover:bg-[#065f46] transition-all"
              >
                Go to Portal
              </Link>
              <button
                onClick={logout}
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              style={{ color: '#ffffff' }}
              className="rounded-lg bg-[#047857] px-5 py-2 text-sm font-semibold !text-white shadow-xs transition-all hover:bg-[#065f46]"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Menu Hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
        >
          <span className="sr-only">Open menu</span>
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 py-4 shadow-lg lg:hidden">
          <nav className="flex flex-col gap-3">
            <Link href="/" className="font-semibold text-[#047857]">Home</Link>
            <Link href="#services" className="font-medium text-slate-700">Services</Link>
            <Link href="/citizen/submit" className="font-medium text-slate-700">Track Request</Link>
            <Link href="/dashboard" className="font-medium text-slate-700">Dashboard</Link>
            {!isLoading && session ? (
              <div className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-3">
                <div className="text-xs font-bold text-[#047857]">Logged in as {session.name} ({session.role})</div>
                <Link
                  href={session.role === "WORKER" ? "/worker" : session.role === "CITIZEN" ? "/citizen" : "/dashboard"}
                  style={{ color: '#ffffff' }}
                  className="rounded-lg bg-[#047857] py-2 text-center font-semibold !text-white"
                >
                  Go to Portal
                </Link>
                <button
                  onClick={logout}
                  type="button"
                  className="rounded-lg border border-slate-300 py-2 text-center font-semibold text-slate-700"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/login" style={{ color: '#ffffff' }} className="mt-2 inline-block rounded-lg bg-[#047857] py-2 text-center font-semibold !text-white">Sign In</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

// ── Hero Section (Matching Shared Reference Image) ───────────────
function HeroSection() {
  return (
    <section className="relative pt-28 pb-16 bg-gradient-to-b from-emerald-50/40 via-sky-50/20 to-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          
          {/* Left Column: Headline & Action Buttons */}
          <div className="max-w-xl">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-[#047857] shadow-2xs mb-6">
              <ShieldCheck className="size-4 text-[#047857]" />
              <span>Trusted. Transparent. Together.</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[52px] leading-[1.15]">
              Building cleaner cities{" "}
              <span className="block text-[#047857]">for a better tomorrow</span>
            </h1>

            {/* Description */}
            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              CivicMitra is your one-stop platform to manage waste services, road infrastructure issues and civic grievances.
            </p>

            {/* Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/grievances"
                style={{ color: '#ffffff' }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#047857] px-6 py-3.5 text-sm font-semibold !text-white shadow-md transition-all hover:bg-[#065f46] hover:shadow-lg"
              >
                <PlusCircle className="size-4 !text-white" style={{ color: '#ffffff' }} />
                <span style={{ color: '#ffffff' }} className="!text-white">Report an Issue</span>
              </Link>

              <Link
                href="/citizen/submit"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-2xs transition-all hover:bg-slate-50"
              >
                <Search className="size-4 text-slate-500" />
                <span>Track Request</span>
              </Link>
            </div>

            {/* Feature Highlights Row */}
            <div className="mt-10 flex items-center gap-6 border-t border-slate-200/60 pt-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Smile className="size-4 text-[#047857]" />
                <span>Easy to Use</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Shield className="size-4 text-[#047857]" />
                <span>Secure & Reliable</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Users className="size-4 text-[#047857]" />
                <span>Citizen First</span>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Truck Graphic Illustration */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-100 bg-white p-2 shadow-xl">
              <img
                src="/truck-hero.png"
                alt="CivicMitra Municipal Eco Truck"
                className="w-full h-auto object-cover rounded-2xl"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ── How Can We Help You Today? Section ───────────────────────────
function ServicesCategorySection() {
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            How can we help you today?
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500 sm:text-base">
            Choose a service category to get started
          </p>
        </div>

        {/* 3 Main Service Category Cards */}
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          
          {/* Card 1: Waste Management */}
          <div className="flex flex-col justify-between rounded-2xl border border-emerald-100 bg-white p-7 shadow-xs transition-all hover:shadow-md">
            <div>
              <div className="flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#047857] text-white shadow-md">
                  <Trash2 className="size-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Waste Management</h3>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Report garbage, missed collection, overflowing bins and other waste related issues.
              </p>

              {/* Light Green Banner Inside */}
              <div className="mt-6 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-[#047857] border border-emerald-100/80">
                🌱 Keep our city clean and green
              </div>
            </div>

            <div className="mt-6 pt-2">
              <Link
                href="/citizen/submit"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#047857] hover:underline"
              >
                Report Now <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Roads & Infrastructure */}
          <div className="flex flex-col justify-between rounded-2xl border border-blue-100 bg-white p-7 shadow-xs transition-all hover:shadow-md">
            <div>
              <div className="flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
                  <Truck className="size-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Roads & Infrastructure</h3>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Report potholes, damaged roads, street light issues and other infrastructure problems.
              </p>

              {/* Light Blue Banner Inside */}
              <div className="mt-6 rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-700 border border-blue-100/80">
                🛣️ Better roads, smoother commutes
              </div>
            </div>

            <div className="mt-6 pt-2">
              <Link
                href="/grievances"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
              >
                Report Now <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Grievances */}
          <div className="flex flex-col justify-between rounded-2xl border border-orange-100 bg-white p-7 shadow-xs transition-all hover:shadow-md">
            <div>
              <div className="flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-md">
                  <MessageSquare className="size-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Grievances</h3>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Raise your concerns related to civic services and get them resolved efficiently.
              </p>

              {/* Light Orange Banner Inside */}
              <div className="mt-6 rounded-xl bg-orange-50 px-4 py-2.5 text-xs font-semibold text-orange-700 border border-orange-100/80">
                📣 Your voice, our priority
              </div>
            </div>

            <div className="mt-6 pt-2">
              <Link
                href="/grievances"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:underline"
              >
                Report Now <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ── Impact in Numbers Banner ──────────────────────────────────────
function ImpactStatsBanner() {
  return (
    <section className="py-6 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-5 lg:items-center">
            
            {/* Header Title */}
            <div className="col-span-2 lg:col-span-1 border-b lg:border-b-0 lg:border-r border-slate-200 pb-4 lg:pb-0 lg:pr-6">
              <div className="flex items-center gap-2">
                <span className="text-lg">📊</span>
                <h3 className="text-base font-bold text-slate-900">Our Impact in Numbers</h3>
              </div>
            </div>

            {/* Stat 1 */}
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-[#047857]">
                <Trash2 className="size-5" />
              </div>
              <div>
                <strong className="block text-lg font-bold text-slate-900">1.25M+</strong>
                <span className="text-xs text-slate-500">Waste Collected (kg)</span>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Truck className="size-5" />
              </div>
              <div>
                <strong className="block text-lg font-bold text-slate-900">8,450+</strong>
                <span className="text-xs text-slate-500">Roads Repaired</span>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Wrench className="size-5" />
              </div>
              <div>
                <strong className="block text-lg font-bold text-slate-900">12,320+</strong>
                <span className="text-xs text-slate-500">Grievances Resolved</span>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-[#047857]">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <strong className="block text-lg font-bold text-slate-900">95%</strong>
                <span className="text-xs text-slate-500">Citizen Satisfaction</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

// ── Explore Civic Services & Recent Updates Section ──────────────
function ServicesAndUpdatesGrid() {
  const civicServices = [
    { icon: Trash2, title: "Garbage Collection", color: "text-[#047857] bg-emerald-50" },
    { icon: Truck, title: "Bulk Waste Pickup", color: "text-[#047857] bg-emerald-50" },
    { icon: Wrench, title: "Pothole Reporting", color: "text-blue-600 bg-blue-50" },
    { icon: Lightbulb, title: "Street Light Issues", color: "text-blue-600 bg-blue-50" },
    { icon: Waves, title: "Water Logging", color: "text-cyan-600 bg-cyan-50" },
    { icon: Droplets, title: "Drainage Issues", color: "text-cyan-600 bg-cyan-50" },
    { icon: Users, title: "Public Grievances", color: "text-orange-600 bg-orange-50" },
    { icon: MessageSquare, title: "Suggestion / Feedback", color: "text-orange-600 bg-orange-50" },
  ];

  const recentUpdates = [
    {
      title: "Garbage collection drive in Sector 15",
      date: "May 20, 2025 • Sector 15, City Center",
      status: "Completed",
      statusStyle: "bg-emerald-100 text-[#047857]",
      icon: Trash2,
      iconBg: "bg-emerald-100 text-[#047857]"
    },
    {
      title: "Pothole repair on MG Road",
      date: "May 19, 2025 • MG Road, Downtown",
      status: "In Progress",
      statusStyle: "bg-blue-100 text-blue-700",
      icon: Wrench,
      iconBg: "bg-blue-100 text-blue-700"
    },
    {
      title: "Street light restoration in Block A",
      date: "May 18, 2025 • Block A, Green Park",
      status: "In Progress",
      statusStyle: "bg-blue-100 text-blue-700",
      icon: Lightbulb,
      iconBg: "bg-blue-100 text-blue-700"
    },
    {
      title: "Drain cleaning in Sector 8",
      date: "May 17, 2025 • Sector 8",
      status: "Completed",
      statusStyle: "bg-emerald-100 text-[#047857]",
      icon: Droplets,
      iconBg: "bg-emerald-100 text-[#047857]"
    },
    {
      title: "Water logging reported in Sector 22",
      date: "May 16, 2025 • Sector 22, Near Market",
      status: "Pending",
      statusStyle: "bg-amber-100 text-amber-700",
      icon: Waves,
      iconBg: "bg-amber-100 text-amber-700"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          
          {/* Left Column: Explore Civic Services (7 Cols) */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Explore Civic Services
              </h2>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {civicServices.map((service, index) => {
                  const IconComp = service.icon;
                  return (
                    <Link
                      key={index}
                      href="/citizen/submit"
                      className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-4 text-center shadow-2xs transition-all hover:border-[#047857] hover:shadow-xs"
                    >
                      <div className={`flex size-12 items-center justify-center rounded-xl ${service.color} mb-3`}>
                        <IconComp className="size-6" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 leading-tight">
                        {service.title}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/citizen/submit"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#047857] hover:underline"
              >
                View All Services <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Recent Updates (6 Cols) */}
          <div className="lg:col-span-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Recent Updates
              </h2>
              <Link href="/dashboard" className="text-xs font-bold text-[#047857] hover:underline">
                View All
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {recentUpdates.map((update, idx) => {
                const IconComp = update.icon;
                return (
                  <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${update.iconBg}`}>
                        <IconComp className="size-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{update.title}</h4>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">{update.date}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${update.statusStyle}`}>
                      {update.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ── Call To Action Banner ─────────────────────────────────────────
function CallToActionBanner() {
  return (
    <section className="py-12 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-100/90 via-teal-100/70 to-emerald-50 p-8 sm:p-10 border border-emerald-200/60 shadow-xs">
          
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                Together, let&apos;s build a cleaner and better tomorrow.
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-600">
                Your small action today can create a big impact.
              </p>
            </div>

            <div className="shrink-0">
              <Link
                href="/citizen/submit"
                style={{ color: '#ffffff' }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#044e3a] px-6 py-3.5 text-sm font-semibold !text-white shadow-md transition-all hover:bg-[#033b2c]"
              >
                <span style={{ color: '#ffffff' }} className="!text-white">Get Started Now</span>
                <ArrowRight className="size-4 !text-white" style={{ color: '#ffffff' }} />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ── Footer (Dark Green #044e3a) ──────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#044e3a] text-white pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5 pb-12 border-b border-emerald-800/60">
          
          {/* Col 1: Logo & About */}
          <div className="lg:col-span-2 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="relative size-10 shrink-0 overflow-hidden">
                <Image src="/logo.png" alt="CivicMitra Logo" fill className="object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white">CivicMitra</span>
                <span className="text-[10px] text-emerald-200">Clean City. Better Tomorrow.</span>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-emerald-100/80">
              CivicMitra is a government initiative to make our cities cleaner, smarter and more citizen friendly.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <a href="#" className="flex size-8 items-center justify-center rounded-full bg-emerald-800/60 text-white hover:bg-emerald-700">
                <Facebook className="size-4" />
              </a>
              <a href="#" className="flex size-8 items-center justify-center rounded-full bg-emerald-800/60 text-white hover:bg-emerald-700">
                <Twitter className="size-4" />
              </a>
              <a href="#" className="flex size-8 items-center justify-center rounded-full bg-emerald-800/60 text-white hover:bg-emerald-700">
                <Instagram className="size-4" />
              </a>
              <a href="#" className="flex size-8 items-center justify-center rounded-full bg-emerald-800/60 text-white hover:bg-emerald-700">
                <Youtube className="size-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Quick Links</h4>
            <ul className="mt-4 space-y-2 text-xs font-medium text-emerald-100/80">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li><Link href="#services" className="hover:text-white">Services</Link></li>
              <li><Link href="/citizen/submit" className="hover:text-white">Track Request</Link></li>
              <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
              <li><Link href="/dashboard#reports" className="hover:text-white">Reports</Link></li>
            </ul>
          </div>

          {/* Col 3: Resources */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Resources</h4>
            <ul className="mt-4 space-y-2 text-xs font-medium text-emerald-100/80">
              <li><a href="#" className="hover:text-white">Help Center</a></li>
              <li><a href="#" className="hover:text-white">Guidelines</a></li>
              <li><a href="#" className="hover:text-white">Downloads</a></li>
              <li><a href="#" className="hover:text-white">FAQs</a></li>
              <li><a href="#" className="hover:text-white">Contact Us</a></li>
            </ul>
          </div>

          {/* Col 4: Legal & Need Help */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Need Help?</h4>
            <div className="mt-4 space-y-2 text-xs font-medium text-emerald-100/80">
              <p className="text-xs text-emerald-200">Call Us</p>
              <strong className="block text-base font-bold text-white">1800-123-4567</strong>
              <p className="text-[11px] text-emerald-100/80">support@civicmitra.gov.in</p>
              <p className="text-[11px] text-emerald-100/70">Mon - Sat: 9:00 AM - 7:00 PM</p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-emerald-200/80 gap-4">
          <p>© 2025 CivicMitra. All rights reserved.</p>
          <p>Made with ❤️ by CivicMitra Team</p>
        </div>
      </div>
    </footer>
  );
}

// ── Main Page Export ─────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-100">
      <Navbar />
      <main className="mt-20">
        <HeroSection />
        <ServicesCategorySection />
        <ImpactStatsBanner />
        <ServicesAndUpdatesGrid />
        <CallToActionBanner />
      </main>
      <Footer />
    </div>
  );
}
