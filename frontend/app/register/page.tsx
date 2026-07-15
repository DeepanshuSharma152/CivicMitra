"use client";

import { useState, FormEvent } from "react";
import { register, ApiError } from "../../lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CITIZEN");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const router = useRouter();

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      await register(apiBaseUrl, fullName, email, password, role);
      setNotice(`Registration successful. Please sign in.`);
      setTimeout(() => router.push("/login"), 2000);
    } catch (error) {
      setNotice(error instanceof ApiError ? error.message : "Could not register. Check the API and credentials.");
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
            <h2>Create Account</h2>
          </div>
        </div>
        <form onSubmit={handleRegister} className="login-form">
          <label>Full Name <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" /></label>
          <label>Email <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" /></label>
          <label>Password <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          <label>Role
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd9e7', borderRadius: '10px', background: '#fff', color: '#102a43', outlineColor: '#0f766e', fontSize: 'inherit' }}>
              <option value="CITIZEN">Citizen</option>
              <option value="WORKER">Sanitation Worker</option>
              <option value="MUNICIPAL_ADMIN">Municipal Admin</option>
            </select>
          </label>
          <button className="primary-button" type="submit" disabled={busy}>Register</button>
        </form>
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
          Already have an account? <Link href="/login" style={{ color: '#2563eb' }}>Sign in here</Link>
        </div>
      </div>
      {notice && <div className="notice">{notice}</div>}
    </section>
  );
}
