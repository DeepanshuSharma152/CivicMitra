"use client";

import { useState, useMemo, ChangeEvent, FormEvent, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { BinType, SegregationResponse, submitSegregation, getSegregationHistory, ApiError } from "../../lib/api";
import { useRouter } from "next/navigation";

type BinUpload = { type: BinType; label: string; required: boolean; file?: File };

const initialBins: BinUpload[] = [
  { type: "GREEN", label: "Wet waste", required: true },
  { type: "BLUE", label: "Dry waste", required: true },
  { type: "RED", label: "Sanitary waste", required: false },
  { type: "BLACK", label: "Hazardous waste", required: false }
];

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

export default function CitizenDashboard() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  const [householdId, setHouseholdId] = useState("");
  const [bins, setBins] = useState(initialBins);
  const [submission, setSubmission] = useState<SegregationResponse | null>(null);
  const [history, setHistory] = useState<SegregationResponse[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const uploadedCount = useMemo(() => bins.filter((bin) => bin.file).length, [bins]);

  useEffect(() => {
    if (!isLoading && !session) {
      router.push("/login");
    } else if (session && session.role !== "CITIZEN") {
      router.push("/worker");
    }
  }, [session, isLoading, router]);

  const loadHistory = async () => {
    if (!session || !householdId) {
      setNotice("Enter a household ID before loading its verification history.");
      return;
    }
    setBusy(true);
    try {
      const records = await getSegregationHistory(apiBaseUrl, session.token, Number(householdId));
      setHistory(records);
      setNotice(records.length ? "Verification history loaded." : "No prior submissions for this household.");
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : "Could not load verification history.");
    } finally {
      setBusy(false);
    }
  };

  const updateBin = (type: BinType, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setBins((current) => current.map((bin) => (bin.type === type ? { ...bin, file } : bin)));
  };

  const handleSubmission = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    if (!householdId) {
      setNotice("Enter the backend household ID for this citizen.");
      return;
    }
    if (bins.some((bin) => bin.required && !bin.file)) {
      setNotice("Green and Blue bin photos are required.");
      return;
    }

    setBusy(true);
    setNotice("Getting location and submitting photos for provisional analysis…");
    try {
      const position = await getCurrentPosition();
      const response = await submitSegregation(apiBaseUrl, session.token, {
        householdId: Number(householdId),
        lat: position.lat,
        lng: position.lng,
        bins: bins.filter((bin): bin is BinUpload & { file: File } => Boolean(bin.file))
      });
      setSubmission(response);
      setHistory((current) => [response, ...current.filter((item) => item.submissionId !== response.submissionId)]);
      setNotice(response.status === "APPROVED" ? "Provisional approval issued. Show the QR to the collection worker." : "The submission needs attention before pickup.");
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Submission failed.");
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
            <p className="eyebrow">CITIZEN PORTAL</p>
            <h2>Submit bins for pickup</h2>
          </div>
          <span className="counter">{uploadedCount}/4 uploaded</span>
        </div>
        
        <form onSubmit={handleSubmission} className="submission-form">
          <div className="id-row">
            <label className="id-field">Household ID <input type="number" required value={householdId} onChange={(e) => setHouseholdId(e.target.value)} placeholder="e.g. 101" /></label>
            <button type="button" className="text-button" onClick={loadHistory} disabled={busy || !householdId}>Load history</button>
          </div>
          <div className="bin-grid">
            {bins.map((bin) => (
              <label key={bin.type} className={`bin-upload ${bin.type.toLowerCase()}`}>
                <input type="file" accept="image/*" onChange={(e) => updateBin(bin.type, e)} />
                <div className="bin-icon">{bin.file ? "✓" : "📷"}</div>
                <div>
                  {bin.label} {bin.required ? "*" : ""}
                  <small>{bin.file ? bin.file.name : "Tap to capture"}</small>
                </div>
                {bin.file && <strong>Ready</strong>}
              </label>
            ))}
          </div>
          <button type="submit" className="primary-button wide" disabled={busy || !householdId}>Analyze & Request Pickup</button>
        </form>

        {history.length > 0 && (
          <div className="history-list">
            <p className="eyebrow">RECENT HISTORY</p>
            {history.map((record) => (
              <span key={record.submissionId}>
                <i className={record.status === "APPROVED" ? "approved-dot" : "review-dot"} />
                ID #{record.submissionId} — {record.overallScore}% score
                <small>{record.status}</small>
              </span>
            ))}
          </div>
        )}
      </div>
      
      {submission ? (
        <div className={`result-card glass-card ${submission.status === "APPROVED" ? "approved" : "needs-work"}`}>
          <p className="eyebrow">PROVISIONAL RESULT</p>
          <h2>{submission.status === "APPROVED" ? "Approved for pickup" : "Needs attention"}</h2>
          <div className="score-ring"><strong>{submission.overallScore}</strong><span>SCORE</span></div>
          <p>{submission.status === "APPROVED" ? "Show this QR to the worker." : submission.failureReason || "Check your bin sorting."}</p>
          {submission.status === "APPROVED" && submission.qrCodeBase64 && (
            <div style={{ marginTop: "20px" }}>
              <img src={`data:image/png;base64,${submission.qrCodeBase64}`} alt="Pickup QR Token" className="qr-image" />
              <div style={{ marginTop: "12px", fontFamily: "monospace", fontSize: "14px", opacity: 0.9 }}>
                Token: {submission.qrToken}<br />
                <small>Expires: {new Date(submission.qrExpiresAt!).toLocaleTimeString()}</small>
              </div>
            </div>
          )}
          {submission.binResults && (
            <div className="result-list" style={{ marginTop: "24px" }}>
              {submission.binResults.map((b) => (
                <span key={b.binType}>{b.binType}: {b.passed ? "Pass" : "Fail"}</span>
              ))}
            </div>
          )}
          <button className="light-button" onClick={() => setSubmission(null)}>Start new submission</button>
        </div>
      ) : (
        <div className="result-placeholder glass-card">
          <div className="spark">✨</div>
          <h2>AI verification</h2>
          <p>Submit your bins to get an instant AI confidence score and your provisional pickup QR.</p>
        </div>
      )}

      {notice && <div className="notice">{notice}</div>}
    </section>
  );
}
