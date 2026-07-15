"use client";

import { useState, FormEvent, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { QRScanResponse, verifyQr, ApiError } from "../../lib/api";
import { useRouter } from "next/navigation";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("This browser does not support location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      () => reject(new Error("Location is required to submit for verification.")),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  });
}

export default function WorkerDashboard() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  const [workerId, setWorkerId] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [scanResult, setScanResult] = useState<QRScanResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!isLoading && !session) {
      router.push("/login");
    } else if (session && session.role !== "WORKER" && session.role !== "MUNICIPAL_ADMIN") {
      router.push("/citizen");
    }
  }, [session, isLoading, router]);

  const handleQrVerification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    
    if (!workerId || !tokenId) {
      setNotice("Enter both the worker ID and QR token.");
      return;
    }

    setBusy(true);
    setNotice("Checking the QR token and worker location…");
    try {
      const position = await getCurrentPosition();
      const response = await verifyQr(apiBaseUrl, session.token, {
        tokenId,
        workerId: Number(workerId),
        workerLat: position.lat,
        workerLng: position.lng
      });
      setScanResult(response);
      setNotice(response.message);
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : error instanceof Error ? error.message : "QR verification failed.");
    } finally {
      setBusy(false);
    }
  };

  if (isLoading || !session) return null;

  return (
    <section className="workspace-grid">
      <div className="workspace-card glass-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">WORKER PORTAL</p>
            <h2>Verify doorstep pickup</h2>
          </div>
          <span className="status-dot">GPS Active</span>
        </div>
        
        <form onSubmit={handleQrVerification} className="submission-form">
          <div className="flow-band" style={{ marginBottom: "16px" }}>
            <div className="flow-step"><span>1</span> Scan QR Token</div>
            <div className="flow-step"><span>2</span> Validate Location</div>
            <div className="flow-step"><span>3</span> Confirm Pickup</div>
          </div>
          <label>Assigned Worker ID <input type="number" required value={workerId} onChange={(e) => setWorkerId(e.target.value)} placeholder="e.g. 50" /></label>
          <label>QR Token ID <input type="text" required value={tokenId} onChange={(e) => setTokenId(e.target.value)} placeholder="Paste the UUID token here" /></label>
          <button type="submit" className="primary-button wide" disabled={busy || !workerId || !tokenId}>Verify & Consume QR</button>
        </form>
      </div>

      {scanResult ? (
        <div className={`result-card glass-card ${scanResult.collected ? "approved" : "needs-work"}`}>
          <p className="eyebrow">SCAN RESULT</p>
          <h2>{scanResult.collected ? "Verification passed" : "Verification failed"}</h2>
          <div className="success-seal">{scanResult.collected ? "✓" : "✗"}</div>
          <p>{scanResult.message}</p>
          <button className="light-button" onClick={() => { setScanResult(null); setTokenId(""); }}>Scan next token</button>
        </div>
      ) : (
        <div className="scan-frame glass-card">
          <span className="material-icons" style={{ fontSize: '52px', color: '#0f766e', display: 'block', marginBottom: '16px' }}>⛶</span>
          <h3>Ready to scan</h3>
          <p>Ask the citizen for their provisional QR token. Your GPS location will be cross-checked during verification.</p>
        </div>
      )}

      {notice && <div className="notice">{notice}</div>}
    </section>
  );
}
