"use client";

import Link from "next/link";
import { useAuth } from "./context/AuthContext";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Settings,
  ClipboardList,
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  Info,
  ArrowRight
} from "lucide-react";

export default function Home() {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Top Announcement Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-600 text-white text-center text-xs sm:text-sm font-semibold py-2.5 px-4 tracking-wide shadow-sm flex items-center justify-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        Phase 1 Verification System is Live.
        <Link href="/citizen" className="text-teal-100 hover:text-white underline font-bold ml-1 transition-colors">
          Access Citizen PWA
        </Link>
        <span className="opacity-50">|</span>
        <Link href="/worker" className="text-teal-100 hover:text-white underline font-bold transition-colors">
          Access Worker Portal
        </Link>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <p className="text-teal-700 text-xs sm:text-sm font-extrabold tracking-widest uppercase mb-3">
              CIVICMITRA PLATFORM &bull; TRUST OPERATING LAYER
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-[1.08] tracking-tight">
              Waste segregation that earns trust.
            </h1>
            <p className="text-slate-500 text-base sm:text-lg md:text-xl leading-relaxed mt-6 max-w-xl">
              A household submits clear bin photos, CivicMitra provides a provisional AI score, and a sanitation worker validates the green QR code at the doorstep during collection.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-8 w-full sm:w-auto">
              <Link href="/citizen" className="w-full sm:w-auto no-underline">
                <Button variant="gradient" size="lg" className="w-full sm:w-auto font-extrabold">
                  Citizen Portal <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/worker" className="w-full sm:w-auto no-underline">
                <Button variant="outline" size="lg" className="w-full sm:w-auto font-extrabold">
                  Worker QR Scan
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-6 mt-10 text-slate-500 text-xs sm:text-sm font-semibold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-teal-600" />
                Privacy-aware
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={16} className="text-teal-600" />
                GPS checked
              </span>
              <span className="flex items-center gap-1.5">
                <ClipboardList size={16} className="text-teal-600" />
                Audit ready
              </span>
            </div>
          </div>
          <div className="lg:col-span-5 w-full">
            <Card className="relative overflow-hidden bg-white/70 backdrop-blur-md border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-teal-900/5 hover:border-teal-600/30 transition-all duration-300">
              <CardContent className="p-0">
                <div className="absolute top-[-65px] right-[-65px] w-[190px] h-[190px] border-[24px] border-emerald-50 rounded-full opacity-80"></div>
                <p className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">TODAY&apos;S INTEGRATION</p>
                <div className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-teal-700 text-white text-center shadow-lg shadow-teal-700/20 my-6">
                  <span className="text-3xl font-extrabold">01</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider leading-none">Phase</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">Household to worker proof chain</h2>
                <p className="text-slate-500 text-sm leading-relaxed mt-2">
                  Provisional AI readiness becomes a verified doorstep collection event—not an unchecked claim.
                </p>
                <div className="flex gap-2 mt-8">
                  <i className="w-10 h-1 rounded-full bg-teal-600"></i>
                  <i className="w-10 h-1 rounded-full bg-slate-200"></i>
                  <i className="w-10 h-1 rounded-full bg-slate-200"></i>
                  <i className="w-10 h-1 rounded-full bg-slate-200"></i>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* About & Mission Section */}
      <section id="about" className="bg-white border-t border-slate-100 py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col items-start">
              <p className="text-teal-700 text-xs sm:text-sm font-extrabold tracking-widest uppercase mb-3">
                WHAT WE ARE
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
                A verifiable municipal platform for source segregation.
              </h2>
              <p className="text-slate-600 text-base leading-relaxed mt-6">
                CivicMitra is designed as a trust operating layer. Many cities fail in waste segregation not because citizens lack awareness, but because there is no ground-level evidence trail. Households and sanitation workers dispute each other, and municipal dashboards show aggregate claims without ground-level verification.
              </p>
              <p className="text-slate-600 text-base leading-relaxed mt-4">
                By combining citizen-level photo evidence, AI analysis, GPS-checked worker verification, and facility reconciliation, CivicMitra builds an accountable proof chain.
              </p>
              <div className="mt-8 p-6 border-l-4 border-teal-700 bg-teal-50/50 rounded-r-2xl italic font-semibold text-teal-900 text-base leading-relaxed">
                &ldquo;Citizens get credit when they segregate properly, workers have a fast and fair way to verify reality, and municipalities see where the system breaks.&rdquo;
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 w-full">
              <Card className="p-6 bg-slate-50 border border-slate-100 flex items-start gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xl flex-shrink-0">
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">AI-Assisted Checklist</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mt-1">Computer vision inspects bin type, contamination, and empty-bin tricks to grant provisional approval.</p>
                </div>
              </Card>
              <Card className="p-6 bg-slate-50 border border-slate-100 flex items-start gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xl flex-shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Worker Doorstep Validation</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mt-1">The collection worker validates the household QR code during doorstep collection, preventing route mixing.</p>
                </div>
              </Card>
              <Card className="p-6 bg-slate-50 border border-slate-100 flex items-start gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xl flex-shrink-0">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Audit-Ready Dashboard</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mt-1">Municipal reviewers resolve disputes and audit route patterns with structured, tamper-proof logs.</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Intended Verification Flow */}
      <section id="flow" className="py-24 border-t border-slate-100 bg-slate-50/30">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-teal-700 text-xs sm:text-sm font-extrabold tracking-widest uppercase mb-3">HOW IT WORKS</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">The Intended Verification Flow</h2>
            <p className="text-slate-500 text-base sm:text-lg leading-relaxed mt-4">An end-to-end evidence trail spanning households, workers, routes, and municipal reviews.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:border-teal-700/30 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-teal-700 to-blue-600 text-white font-extrabold text-sm mb-4 shadow-sm">1</div>
              <h3 className="text-base font-bold text-slate-900">Citizen Uploads</h3>
              <p className="text-slate-500 text-xs leading-relaxed mt-2">Household captures photos of wet, dry, sanitary, and hazardous bins via the web app.</p>
            </Card>
            <Card className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:border-teal-700/30 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-teal-700 to-blue-600 text-white font-extrabold text-sm mb-4 shadow-sm">2</div>
              <h3 className="text-base font-bold text-slate-900">Metadata Checked</h3>
              <p className="text-slate-500 text-xs leading-relaxed mt-2">System validates GPS coordinates, timestamp freshness, and user identity.</p>
            </Card>
            <Card className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:border-teal-700/30 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-teal-700 to-blue-600 text-white font-extrabold text-sm mb-4 shadow-sm">3</div>
              <h3 className="text-base font-bold text-slate-900">AI Photo Analysis</h3>
              <p className="text-slate-500 text-xs leading-relaxed mt-2">AI inspects bin type, contamination level, and flags potential mismatch or empty-bin tricks.</p>
            </Card>
            <Card className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:border-teal-700/30 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-teal-700 to-blue-600 text-white font-extrabold text-sm mb-4 shadow-sm">4</div>
              <h3 className="text-base font-bold text-slate-900">Scoring Engine</h3>
              <p className="text-slate-500 text-xs leading-relaxed mt-2">Engine evaluates AI confidence, GPS proximity, reputation, and route context.</p>
            </Card>
            <Card className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:border-teal-700/30 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-teal-700 to-blue-600 text-white font-extrabold text-sm mb-4 shadow-sm">5</div>
              <h3 className="text-base font-bold text-slate-900">Green QR Issued</h3>
              <p className="text-slate-500 text-xs leading-relaxed mt-2">On passing, a short-lived green QR code is issued to the household as provisional approval.</p>
            </Card>
            <Card className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:border-teal-700/30 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-teal-700 to-blue-600 text-white font-extrabold text-sm mb-4 shadow-sm">6</div>
              <h3 className="text-base font-bold text-slate-900">Doorstep Scan</h3>
              <p className="text-slate-500 text-xs leading-relaxed mt-2">Sanitation worker scans QR code during pickup, validating physical segregation and collection location.</p>
            </Card>
            <Card className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:border-teal-700/30 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-teal-700 to-blue-600 text-white font-extrabold text-sm mb-4 shadow-sm">7</div>
              <h3 className="text-base font-bold text-slate-900">Dispute & Review</h3>
              <p className="text-slate-500 text-xs leading-relaxed mt-2">Suspicious or low-confidence cases route to municipal review officers to prevent penalties.</p>
            </Card>
            <Card className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:border-teal-700/30 hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-teal-700 to-blue-600 text-white font-extrabold text-sm mb-4 shadow-sm">8</div>
              <h3 className="text-base font-bold text-slate-900">Metrics Updated</h3>
              <p className="text-slate-500 text-xs leading-relaxed mt-2">Final review updates household trust, worker reliability, and ward metrics.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Conditions */}
      <section id="conditions" className="py-24 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-teal-700 text-xs sm:text-sm font-extrabold tracking-widest uppercase mb-3">CORE CONDITIONS</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">Platform Operational Conditions</h2>
            <p className="text-slate-500 text-base sm:text-lg leading-relaxed mt-4">CivicMitra is offered only to municipalities that meet these operational requirements.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-xl hover:border-teal-700/20 hover:bg-white transition-all duration-300">
              <CardContent className="p-0">
                <Badge variant="teal" className="mb-4 text-xs font-bold uppercase tracking-wider">Location Hierarchy</Badge>
                <h3 className="text-lg font-bold text-slate-900">Mapped Wards & Houses</h3>
                <p className="text-slate-500 text-sm leading-relaxed mt-2">Every submission, route stop, and compliance decision needs a reliable municipal location hierarchy.</p>
                <div className="border-t border-slate-200/60 pt-4 mt-6">
                  <span className="block text-xs font-bold text-teal-900">Why it matters:</span>
                  <span className="block text-xs text-slate-600 mt-1">Ensures AI scores and doorstep pickups are tied to concrete households and route segments.</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-xl hover:border-teal-700/20 hover:bg-white transition-all duration-300">
              <CardContent className="p-0">
                <Badge variant="teal" className="mb-4 text-xs font-bold uppercase tracking-wider">Accountability</Badge>
                <h3 className="text-lg font-bold text-slate-900">Registered Workers</h3>
                <p className="text-slate-500 text-sm leading-relaxed mt-2">Worker validation is central to the proof chain and must be tied to an accountable worker and route.</p>
                <div className="border-t border-slate-200/60 pt-4 mt-6">
                  <span className="block text-xs font-bold text-teal-900">Why it matters:</span>
                  <span className="block text-xs text-slate-600 mt-1">Closes the verification loop at collection, making workers certified auditors of household waste.</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-xl hover:border-teal-700/20 hover:bg-white transition-all duration-300">
              <CardContent className="p-0">
                <Badge variant="teal" className="mb-4 text-xs font-bold uppercase tracking-wider">Stream Audits</Badge>
                <h3 className="text-lg font-bold text-slate-900">Truck & Facility Mapping</h3>
                <p className="text-slate-500 text-sm leading-relaxed mt-2">Household compliance is meaningless if segregated waste is later mixed or sent to the wrong facility.</p>
                <div className="border-t border-slate-200/60 pt-4 mt-6">
                  <span className="block text-xs font-bold text-teal-900">Why it matters:</span>
                  <span className="block text-xs text-slate-600 mt-1">Tracks waste streams beyond collection, guaranteeing segregation survives transport.</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-xl hover:border-teal-700/20 hover:bg-white transition-all duration-300">
              <CardContent className="p-0">
                <Badge variant="teal" className="mb-4 text-xs font-bold uppercase tracking-wider">Fairness</Badge>
                <h3 className="text-lg font-bold text-slate-900">Municipal Review Capacity</h3>
                <p className="text-slate-500 text-sm leading-relaxed mt-2">Disputed or low-confidence cases need an official decision path, not automatic punishment.</p>
                <div className="border-t border-slate-200/60 pt-4 mt-6">
                  <span className="block text-xs font-bold text-teal-900">Why it matters:</span>
                  <span className="block text-xs text-slate-600 mt-1">Preserves trust in the platform by giving citizens recourse when AI makes a classification error.</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-xl hover:border-teal-700/20 hover:bg-white transition-all duration-300 md:col-span-2 lg:col-span-1">
              <CardContent className="p-0">
                <Badge variant="teal" className="mb-4 text-xs font-bold uppercase tracking-wider">Policy</Badge>
                <h3 className="text-lg font-bold text-slate-900">Waste-Stream Policy</h3>
                <p className="text-slate-500 text-sm leading-relaxed mt-2">Each city must define its bin types, pickup schedules, evidence rules, incentives, and thresholds.</p>
                <div className="border-t border-slate-200/60 pt-4 mt-6">
                  <span className="block text-xs font-bold text-teal-900">Why it matters:</span>
                  <span className="block text-xs text-slate-600 mt-1">Aligns system algorithms with regional municipal bylaws and local sorting requirements.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Success Metrics */}
      <section id="metrics" className="py-24 border-t border-slate-100 bg-slate-50/20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-teal-700 text-xs sm:text-sm font-extrabold tracking-widest uppercase mb-3">TELEMETRY</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">Key Success Metrics</h2>
            <p className="text-slate-500 text-base sm:text-lg leading-relaxed mt-4">Real-time indicators showing platform compliance, accuracy, and operational health.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-0">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Source Segregation Rate</span>
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center"><CheckCircle2 size={16} /></div>
                </div>
                <div className="text-3xl font-black text-slate-950">84.2%</div>
                <p className="text-slate-500 text-xs leading-relaxed mt-1">Household compliance verified by doorstep validation.</p>
                <Progress value={84.2} className="mt-4" />
              </CardContent>
            </Card>
            <Card className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-0">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Worker Override Rate</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center"><AlertTriangle size={16} /></div>
                </div>
                <div className="text-3xl font-black text-slate-950">4.1%</div>
                <p className="text-slate-500 text-xs leading-relaxed mt-1">Sanitation workers overriding AI provisional scores.</p>
                <Progress value={4.1} className="mt-4" />
              </CardContent>
            </Card>
            <Card className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-0">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Review Turnaround Time</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center"><Clock size={16} /></div>
                </div>
                <div className="text-3xl font-black text-slate-950">18m</div>
                <p className="text-slate-500 text-xs leading-relaxed mt-1">Average municipal dispute resolution time.</p>
                <Progress value={90} className="mt-4" />
              </CardContent>
            </Card>
            <Card className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-0">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Facility Contamination</span>
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center"><Info size={16} /></div>
                </div>
                <div className="text-3xl font-black text-slate-950">8.3%</div>
                <p className="text-slate-500 text-xs leading-relaxed mt-1">Contaminated dry waste arriving at facilities.</p>
                <Progress value={8.3} className="mt-4" />
              </CardContent>
            </Card>
            <Card className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-0">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trust Score Recovery</span>
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center"><TrendingUp size={16} /></div>
                </div>
                <div className="text-3xl font-black text-slate-950">92.5%</div>
                <p className="text-slate-500 text-xs leading-relaxed mt-1">Citizens correcting errors to regain green status.</p>
                <Progress value={92.5} className="mt-4" />
              </CardContent>
            </Card>
            <Card className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-0">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Citizen Participation</span>
                  <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center"><Users size={16} /></div>
                </div>
                <div className="text-3xl font-black text-slate-950">76.8%</div>
                <p className="text-slate-500 text-xs leading-relaxed mt-1">Registered households actively segregating.</p>
                <Progress value={76.8} className="mt-4" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} CivicMitra Platform. Clean city. Better tomorrow.</p>
          <p className="text-xs opacity-75 mt-1">A Verifiable Municipal Waste Segregation Infrastructure.</p>
        </div>
      </footer>
    </div>
  );
}
