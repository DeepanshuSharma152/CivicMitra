"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useState } from "react";
import {
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Filter,
  ArrowRight,
  FileText,
  Building2
} from "lucide-react";

interface Complaint {
  id: string;
  category: string;
  location: string;
  date: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
  description: string;
  assignedOfficer?: string;
  resolvedDate?: string;
}

const mockComplaints: Complaint[] = [
  {
    id: "CMP-2026-8812",
    category: "Roadside Dump Clearance",
    location: "Main Market Road, Ward 12, Zone B",
    date: "2026-07-24",
    status: "IN_PROGRESS",
    description: "Unsegregated dry waste heap accumulated near public park entrance.",
    assignedOfficer: "Ramesh Kumar (Ward Inspector)"
  },
  {
    id: "CMP-2026-7491",
    category: "Missed Doorstep Pickup",
    location: "House #142, Block C, Green Park",
    date: "2026-07-22",
    status: "RESOLVED",
    description: "Morning collection vehicle did not stop for wet waste pickup.",
    assignedOfficer: "Suresh Patil (Route Lead)",
    resolvedDate: "2026-07-22 14:30"
  },
  {
    id: "CMP-2026-9023",
    category: "Overflowing Community Bin",
    location: "Sector 4 Bus Terminal Crossing",
    date: "2026-07-25",
    status: "PENDING",
    description: "Community compost bin overflowing; needs immediate clearance.",
    assignedOfficer: "Pending Inspector Assignment"
  }
];

export default function TrackRequestPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredComplaints = mockComplaints.filter((item) => {
    const matchesSearch =
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Complaint["status"]) => {
    switch (status) {
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="size-3.5 text-emerald-600" /> Resolved
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
            <Clock className="size-3.5 text-amber-600 animate-spin" /> In Progress
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
            <AlertCircle className="size-3.5 text-slate-500" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12">
        {/* Title Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-200">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold uppercase tracking-wider mb-2">
              <FileText className="size-3.5 text-teal-700" /> Live Tracker
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Track Request & Complaints
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              View real-time resolution updates and officer assignments for all your submitted civic requests.
            </p>
          </div>

          <Link
            href="/reports"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm text-sm transition-all duration-200 flex items-center gap-2 shrink-0"
          >
            File New Complaint <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs mb-8 flex flex-col sm:flex-row items-center gap-4 justify-between">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, Category or Location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Filter className="size-4 text-slate-400 hidden sm:block" />
            {["ALL", "PENDING", "IN_PROGRESS", "RESOLVED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === status
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {status === "ALL" ? "All Requests" : status.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Complaints List */}
        <div className="space-y-4">
          {filteredComplaints.length > 0 ? (
            filteredComplaints.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-teal-500/40 hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                      {item.id}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">{item.category}</h3>
                  </div>
                  <div>{getStatusBadge(item.status)}</div>
                </div>

                <p className="text-sm text-slate-600 font-medium">{item.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-500 pt-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-4 text-slate-400 shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="size-4 text-slate-400 shrink-0" />
                    <span>Filed: {item.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="size-4 text-slate-400 shrink-0" />
                    <span className="truncate">{item.assignedOfficer}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <FileText className="size-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-lg">No matching requests found</h4>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or filter settings.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
