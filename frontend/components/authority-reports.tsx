"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, CircleAlert, ClipboardList, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { readSession } from "@/lib/session";
import type { Complaint } from "@/lib/types";

const statuses = ["PENDING", "UNDER_REVIEW", "RESOLVED", "REJECTED"];
export function AuthorityReports() {
  const [reports, setReports] = useState<Complaint[]>([]); const [message, setMessage] = useState("");
  const refresh = async () => { try { setReports(await api.allComplaints()); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load reports."); } };
  useEffect(() => { const session = readSession(); if (!session || !["AUTHORITY", "MUNICIPAL_ADMIN"].includes(session.role)) { window.location.assign("/"); return; } void refresh(); }, []);
  async function update(report: Complaint, status: string) { try { await api.updateComplaintStatus(report.id, status); setMessage("Report status updated."); await refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update status."); } }
  const pending = reports.filter(report => !["RESOLVED", "REJECTED"].includes(report.status)).length;
  return <main className="authority-page"><header><Link href="/"><ClipboardList />CivicMitra authority</Link><div><h1>Community reports</h1><p>Review issues and keep residents updated.</p></div><span><BarChart3 />{pending} open reports</span></header>{message && <p className="notice">{message}</p>}<section className="authority-grid"><article className="authority-summary"><CircleAlert /><strong>{pending}</strong><span>Reports awaiting action</span></article><article className="authority-summary"><MapPin /><strong>{new Set(reports.map(report => report.location).filter(Boolean)).size}</strong><span>Active locations</span></article></section><section className="authority-list">{reports.length ? reports.map(report => <article key={report.id}><div className="authority-icon"><CircleAlert /></div><div><b className={`report-status ${report.status.toLowerCase()}`}>{report.status.replaceAll("_", " ")}</b><h2>{report.title}</h2><p>{report.description}</p><small>{report.location || "Municipal area"} · {formatDate(report.createdAt)} · {report.upvotes} support</small></div>{report.imagePath && <img src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/uploads/${encodeURIComponent(report.imagePath)}`} alt="Reported issue" />}<label>Status<select value={report.status} onChange={event => update(report, event.target.value)}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label></article>) : <p className="empty-copy">No community reports yet.</p>}</section></main>;
}
function formatDate(value?: string) { return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)) : "Recently added"; }
