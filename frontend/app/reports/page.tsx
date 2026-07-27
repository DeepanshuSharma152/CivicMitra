"use client";

import Navbar from "@/components/Navbar";
import { useState } from "react";
import {
  AlertTriangle,
  Upload,
  MapPin,
  Send,
  CheckCircle2,
  FileText,
  Building2,
  PhoneCall
} from "lucide-react";

export default function ReportsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [category, setCategory] = useState("Roadside Waste Dumping");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedId = `CMP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setTicketId(generatedId);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12">
        {/* Title Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider mb-3">
            <AlertTriangle className="size-4 text-rose-600" /> Citizen Reporting Center
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            File a Civic & Waste Complaint
          </h1>
          <p className="text-sm text-slate-600 mt-2 font-medium">
            Report waste accumulation, uncleared community bins, or doorstep service issues directly to municipal sanitation inspectors.
          </p>
        </div>

        {submitted ? (
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-emerald-200 shadow-lg text-center space-y-6 animate-in zoom-in-95">
            <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-10" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Complaint Submitted Successfully!</h2>
              <p className="text-sm text-slate-600 mt-1">Your report has been routed to the assigned Ward Sanitation Inspector.</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block text-left max-w-md w-full">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1">
                <span>COMPLAINT REFERENCE ID</span>
                <span className="text-emerald-700 font-mono text-sm">{ticketId}</span>
              </div>
              <p className="text-xs text-slate-700"><strong>Category:</strong> {category}</p>
              <p className="text-xs text-slate-700"><strong>Location:</strong> {location || "Ward 12 Central Market"}</p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setSubmitted(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-700 hover:bg-slate-50"
              >
                File Another Complaint
              </button>
              <a
                href="/track-request"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 font-bold text-xs text-white hover:bg-emerald-700 shadow-sm"
              >
                Track Complaint Status
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-md space-y-6">
            {/* Category Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Complaint Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="Roadside Waste Dumping">Roadside Waste Dumping / Open Burning</option>
                <option value="Overflowing Community Bin">Overflowing Community Compost Bin</option>
                <option value="Missed Doorstep Pickup">Missed Doorstep Waste Collection</option>
                <option value="Drainage / Sanitation Blockage">Drainage & Stormwater Blockage</option>
                <option value="Other Civic Issue">Other Municipal Sanitation Concern</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Location Details / Ward Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Near City Hospital Gate, Ward 14..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Issue Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Describe the waste issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            {/* Photo Upload Dropzone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Upload Incident Photo (Optional)
              </label>
              <div className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl p-6 text-center hover:border-emerald-400 transition-colors cursor-pointer">
                <Upload className="size-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Click to upload photo or drag & drop</p>
                <p className="text-[11px] text-slate-400 mt-1">Supports JPG, PNG up to 10MB (GPS tagging enabled)</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
            >
              <Send className="size-4" /> Submit Report to Ward Officer
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
