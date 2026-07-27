"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import type { HouseholdMatch, HouseholdRegistrationResult, WardOption } from "@/lib/types";
import {
  MapPin, Home, Phone, Loader2, CheckCircle2,
  AlertCircle, Navigation, Building2, ChevronRight, ShieldCheck, Info
} from "lucide-react";

interface Props {
  municipalityId?: number;
  initialMobile?: string;
  onComplete: (householdCode: string) => void;
}

type Step = "form" | "gps-loading" | "duplicate-check" | "success";

function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Your browser does not support location services."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      (err) => reject(new Error(
        err.code === 1
          ? "Location access denied. Please enable GPS in your browser settings and try again."
          : "Could not get your location. Please check your GPS and try again."
      )),
      { enableHighAccuracy: true, timeout: 15_000 }
    );
  });
}

/**
 * Multi-step household registration wizard with integrated DPDP consent.
 */
export function HouseholdSetupFlow({ municipalityId = 1, initialMobile, onComplete }: Props) {
  const [step, setStep] = useState<Step>("form");
  const [wards, setWards] = useState<WardOption[]>([]);
  const [error, setError] = useState("");

  // DPDP Consent state
  const [dpdpGiven, setDpdpGiven] = useState(false);
  const [dpdpChecked, setDpdpChecked] = useState(false);
  const [showDpdpDetails, setShowDpdpDetails] = useState(false);

  // Form state
  const [houseNumber, setHouseNumber] = useState("");
  const [wardId, setWardId] = useState<number | "">("");
  const [blockCode, setBlockCode] = useState("");
  const [mobile, setMobile] = useState(initialMobile || "");
  const [numResidents, setNumResidents] = useState(1);

  // Results
  const [duplicates, setDuplicates] = useState<HouseholdMatch[]>([]);
  const [result, setResult] = useState<HouseholdRegistrationResult | null>(null);

  // Load wards, DPDP status, and existing household on mount
  useEffect(() => {
    api.getWards(municipalityId)
      .then(setWards)
      .catch(() => setError("Could not load wards. Please refresh."));

    api.getDpdpStatus()
      .then((status) => {
        if (status?.consentGiven) {
          setDpdpGiven(true);
          setDpdpChecked(true);
        }
      })
      .catch(() => {});

    api.getMyHousehold()
      .then((household) => {
        if (household?.hasHousehold) {
          if (household.houseNumber) setHouseNumber(household.houseNumber);
          if (household.wardId) setWardId(household.wardId);
          if (household.blockCode) setBlockCode(household.blockCode || "");
          if (household.mobile) setMobile(household.mobile);
        }
      })
      .catch(() => {});
  }, [municipalityId]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!wardId) { setError("Please select your ward."); return; }
    if (!/^[6-9][0-9]{9}$/.test(mobile)) { setError("Enter a valid 10-digit Indian mobile number."); return; }

    // Validate DPDP consent checkbox
    if (!dpdpGiven && !dpdpChecked) {
      setError("Please tick the DPDP Consent checkbox to agree to data processing before registering.");
      return;
    }

    // Record DPDP consent if not yet given
    if (!dpdpGiven) {
      try {
        await api.recordDpdpConsent();
        setDpdpGiven(true);
      } catch (consentErr) {
        setError(consentErr instanceof Error ? consentErr.message : "Failed to record DPDP consent.");
        return;
      }
    }

    // GPS capture — blocking
    setStep("gps-loading");
    let gps: { lat: number; lng: number };
    try {
      gps = await getCurrentPosition();
    } catch (gpsErr) {
      setError(gpsErr instanceof Error ? gpsErr.message : "GPS failed.");
      setStep("form");
      return;
    }

    // Submit to backend
    try {
      const res = await api.registerHousehold({
        houseNumber,
        wardId: wardId as number,
        blockCode: blockCode || undefined,
        mobile,
        lat: gps.lat,
        lng: gps.lng,
        numResidents,
      });

      if (res.status === "DUPLICATE_CHECK" && res.potentialMatches) {
        setDuplicates(res.potentialMatches);
        setStep("duplicate-check");
      } else {
        setResult(res);
        setStep("success");
        if (res.householdCode) onComplete(res.householdCode);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
      setStep("form");
    }
  }, [houseNumber, wardId, blockCode, mobile, numResidents, dpdpGiven, dpdpChecked, onComplete]);

  // ── GPS Loading screen ────────────────────────────────────────────────────
  if (step === "gps-loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-emerald-50">
          <Navigation className="size-8 animate-pulse text-emerald-600" />
        </div>
        <p className="text-[17px] font-semibold text-slate-800">Locating you…</p>
        <p className="max-w-xs text-[14px] text-slate-500">
          Your GPS location is being captured automatically. Please don't close this page.
        </p>
        <Loader2 className="mt-2 size-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  // ── Duplicate check screen ────────────────────────────────────────────────
  if (step === "duplicate-check") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-[14px] font-semibold text-amber-800">Similar household found</p>
              <p className="mt-1 text-[13px] text-amber-700">
                We found a similar address in your area. Is one of these your home?
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {duplicates.map((match) => (
            <div
              key={match.householdId}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-50">
                  <Home className="size-4 text-emerald-700" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-slate-800">{match.houseNumber}</p>
                  <p className="text-[12px] text-slate-500">{match.householdCode}</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                match.verificationStatus === "VERIFIED"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}>
                {match.verificationStatus}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => { setDuplicates([]); setStep("form"); }}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-[14px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            None of these — Register new
          </button>
        </div>
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (step === "success" && result) {
    return (
      <div className="flex flex-col items-center gap-5 py-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="size-9 text-emerald-600" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600">
            Household Registered
          </p>
          <h3 className="mt-1 text-[22px] font-bold text-slate-900">You're in!</h3>
        </div>

        <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-2">
            Your Household Code
          </p>
          <p className="font-mono text-[20px] font-bold text-emerald-900 tracking-wider">
            {result.householdCode}
          </p>
        </div>

        <div className="w-full rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800">
              PROVISIONAL
            </span>
          </div>
          <p className="text-[13px] text-amber-800">
            A ward officer will visit within <strong>14 days</strong> to verify your household and
            unlock your full trust score.
          </p>
        </div>

        <p className="text-[13px] text-slate-500">
          You can start submitting waste for verification right away. Your score is capped at{" "}
          <strong>60/100</strong> until verified.
        </p>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h3 className="text-[18px] font-semibold text-slate-900">Register your household</h3>
        <p className="mt-1 text-[14px] text-slate-500">
          Your GPS will be captured automatically — no manual coordinates needed.
        </p>
      </div>

      {/* House Number */}
      <div>
        <label htmlFor="hs-house-number" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
          House / Flat Number *
        </label>
        <div className="relative">
          <Home className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id="hs-house-number"
            type="text"
            required
            value={houseNumber}
            onChange={(e) => setHouseNumber(e.target.value)}
            placeholder="e.g. 1234-B or Flat 7"
            className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-[14px] text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      {/* Ward */}
      <div>
        <label htmlFor="hs-ward" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
          Ward *
        </label>
        <div className="relative">
          <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <select
            id="hs-ward"
            required
            value={wardId}
            onChange={(e) => setWardId(Number(e.target.value))}
            className="h-11 w-full appearance-none rounded-lg border border-slate-200 pl-10 pr-4 text-[14px] text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">Select your ward</option>
            {wards.map((w) => (
              <option key={w.wardId} value={w.wardId}>
                Ward {w.wardNumber} — {w.sectorName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Block / Sector */}
      <div>
        <label htmlFor="hs-block" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
          Block / Sector <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id="hs-block"
            type="text"
            value={blockCode}
            onChange={(e) => setBlockCode(e.target.value)}
            placeholder="e.g. Sector 17-B"
            className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-[14px] text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      {/* Mobile */}
      <div>
        <label htmlFor="hs-mobile" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
          Contact Mobile Number *
        </label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id="hs-mobile"
            type="tel"
            required
            inputMode="numeric"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="10-digit number"
            maxLength={10}
            className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-[14px] text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <p className="mt-1.5 text-[12px] text-slate-500">
          Pre-filled with your account number. If your municipal water/property tax uses a different number, you can change it here.
        </p>
      </div>

      {/* GPS notice — no manual field */}
      <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
        <Navigation className="mt-0.5 size-4 shrink-0 text-emerald-600" />
        <p className="text-[13px] text-slate-600">
          <strong>GPS is captured automatically</strong> when you click Register — no manual entry.
          Your browser will ask for location permission.
        </p>
      </div>

      {/* ── DPDP Consent Section ── */}
      <div className={`rounded-xl border p-4 space-y-3 transition-all ${
        dpdpGiven
          ? "border-emerald-200 bg-emerald-50/60"
          : dpdpChecked
          ? "border-emerald-400 bg-emerald-50/40 shadow-sm"
          : "border-amber-200 bg-amber-50/50"
      }`}>
        <div className="flex items-start gap-3">
          <ShieldCheck className={`mt-0.5 size-5 shrink-0 ${dpdpGiven ? "text-emerald-600" : "text-emerald-700"}`} />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-slate-900">
                DPDP Data Protection Consent
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                dpdpGiven ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}>
                {dpdpGiven ? "✓ Consented" : "Action Required"}
              </span>
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
              Under the Digital Personal Data Protection Act 2023, CivicMitra processes your bin photos and GPS coordinates solely for automated waste audit and QR generation.
            </p>
          </div>
        </div>

        {!dpdpGiven && (
          <label className="flex items-center gap-3 cursor-pointer rounded-lg bg-white border border-slate-200 p-3 hover:border-emerald-400 transition-colors">
            <input
              type="checkbox"
              checked={dpdpChecked}
              onChange={(e) => { setDpdpChecked(e.target.checked); setError(""); }}
              className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[13px] font-semibold text-slate-800">
              I consent to photo capture, GPS verification & AI waste auditing *
            </span>
          </label>
        )}

        <button
          type="button"
          onClick={() => setShowDpdpDetails(!showDpdpDetails)}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-700 hover:text-emerald-800"
        >
          <Info className="size-3.5" />
          {showDpdpDetails ? "Hide Privacy Notice Details" : "View Data Privacy Notice Details"}
        </button>

        {showDpdpDetails && (
          <div className="mt-2 space-y-2 rounded-lg bg-white p-3 text-[12px] text-slate-600 border border-slate-200">
            <p><strong>What data:</strong> Waste bin photos, household GPS coordinates, and contact mobile.</p>
            <p><strong>Why:</strong> AI waste compliance auditing, green QR token generation, and ward score calculation.</p>
            <p><strong>Retention:</strong> Photos retained for 90 days for dispute audit, then permanently deleted.</p>
            <p><strong>Statutory Right:</strong> Refusing optional consent does not affect basic municipal waste collection.</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        id="hs-register-btn"
        type="submit"
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 text-[15px] font-semibold text-white hover:bg-emerald-800 active:scale-[0.98] transition-all"
      >
        Register Household
        <ChevronRight className="size-4" />
      </button>
    </form>
  );
}
