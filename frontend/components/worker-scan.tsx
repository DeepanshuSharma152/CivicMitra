"use client";

import { useState } from "react";
import Link from "next/link";
import { Camera, CheckCircle2, LocateFixed, QrCode, TriangleAlert } from "lucide-react";
import { api } from "@/lib/api";
import { readSession } from "@/lib/session";

export function WorkerScan() {
  const [token, setToken] = useState(""); const [message, setMessage] = useState(""); const [result, setResult] = useState<{ scanResult: string; houseNumber: string; collected: boolean; message: string } | null>(null); const [loading, setLoading] = useState(false);
  async function scan(event: React.FormEvent) { event.preventDefault(); const session = readSession(); if (!session?.userId) { window.location.assign("/"); return; } setLoading(true); setMessage(""); try { const coords = await new Promise<GeolocationCoordinates>((resolve, reject) => navigator.geolocation.getCurrentPosition(position => resolve(position.coords), reject, { enableHighAccuracy: true, timeout: 10000 })); setResult(await api.verifyQr(token.trim(), session.userId, coords.latitude, coords.longitude)); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to verify this pickup."); } finally { setLoading(false); } }
  return <main className="worker-page"><header><Link href="/"><QrCode />CivicMitra worker</Link><span><LocateFixed />Collection validation</span></header><section className="worker-card"><div className="scan-visual"><Camera /><span>Scan household QR</span></div><div className="scan-form"><h1>Confirm a doorstep pickup</h1><p>Scan the citizen's QR token or enter it below. Your location is checked before recording collection.</p><form onSubmit={scan}><label>Pickup token<input value={token} onChange={event => setToken(event.target.value)} placeholder="Paste or scan QR token" required /></label><button className="button-primary" disabled={loading}>{loading ? "Confirming..." : "Confirm collection"}</button></form>{message && <p className="capture-error"><TriangleAlert />{message}</p>}{result && <div className={`scan-result ${result.collected ? "success" : "warning"}`}>{result.collected ? <CheckCircle2 /> : <TriangleAlert />}<div><strong>{result.collected ? "Pickup recorded" : "Pickup needs review"}</strong><p>{result.houseNumber} · {result.message}</p></div></div>}</div></section></main>;
}
