"use client";

import { useState, FormEvent } from "react";
import { login, ApiError } from "../../lib/api";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const { login: setSession } = useAuth();
  const router = useRouter();

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const response = await login(apiBaseUrl, email, password);
      setSession(response);
      setNotice(`Signed in as ${response.name}. Redirecting...`);
      if (response.role === "WORKER") {
        router.push("/worker");
      } else {
        router.push("/citizen");
      }
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : "Could not sign in. Check the API and credentials.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="workspace-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '500px', margin: '40px auto' }}>
      <div className="workspace-card glass-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">AUTHENTICATION</p>
            <h2>Sign in</h2>
          </div>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          <label>Email <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" /></label>
          <label>Password <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <button className="primary-button" type="submit" disabled={busy}>Sign in</button>
        </form>
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
          Don't have an account? <Link href="/register" style={{ color: '#2563eb' }}>Register here</Link>
        </div>
      </div>
      {notice && <div className="notice">{notice}</div>}
    </section>
  );
}
