"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Leaf, LockKeyhole, Mail, UserRound } from "lucide-react";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/session";
import type { UserRole } from "@/lib/types";

const roles: { value: UserRole; label: string; detail: string }[] = [
  { value: "CITIZEN", label: "Citizen", detail: "Manage your household waste and pickup readiness." },
  { value: "WORKER", label: "Worker", detail: "Manage doorstep verification and assigned collections." },
  { value: "AUTHORITY", label: "Authority", detail: "Monitor community reports and service progress." },
  { value: "MUNICIPAL_ADMIN", label: "Municipal admin", detail: "Coordinate city-wide operations." }
];

export function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(form: FormData) {
    setLoading(true); setMessage("");
    try { const result = await api.login(String(form.get("email") || ""), String(form.get("password") || "")); saveSession(result, form.get("remember") === "on"); router.push(result.role === "WORKER" ? "/worker/scan" : result.role === "CITIZEN" ? "/dashboard" : "/authority/reports"); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to sign in."); }
    finally { setLoading(false); }
  }
  async function register(form: FormData) {
    const role = String(form.get("role") || "") as UserRole;
    const wardId = String(form.get("wardId") || "");
    if (!role) { setMessage("Select the account type that fits you."); return; }
    if (["CITIZEN", "WORKER"].includes(role) && !wardId) { setMessage("Enter your ward reference."); return; }
    setLoading(true); setMessage("");
    try { await api.register({ fullName: form.get("name"), email: form.get("email"), phoneNumber: form.get("phone"), password: form.get("password"), role, municipalityId: 1, wardId: wardId ? Number(wardId) : null }); setMode("login"); setMessage("Account created. Sign in to continue."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create your account."); }
    finally { setLoading(false); }
  }
  return <main className="auth-shell"><section className="auth-art"><div className="auth-brand"><span className="brand-icon"><Leaf /></span><span><b>CivicMitra</b><small>Clean City. Better Tomorrow.</small></span></div><div className="auth-message"><h1>Cleaner homes begin with a small daily check.</h1><p>Verify your waste, keep pickup on track, and help your neighbourhood stay cleaner.</p></div><div className="auth-scene"><div className="scene-bin">♻</div><div className="scene-leaf leaf-one" /><div className="scene-leaf leaf-two" /></div></section><section className="auth-form-side"><div className="auth-form-wrap"><div className="auth-switch"><button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>Sign in</button><button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setMessage(""); }}>Create account</button></div>{mode === "login" ? <form action={signIn} className="auth-form"><header><h2>Welcome back</h2><p>Sign in to continue your household services.</p></header><Field icon={<Mail />} label="Email" name="email" type="email" placeholder="you@example.com" /><Field icon={<LockKeyhole />} label="Password" name="password" type="password" placeholder="Your password" /><label className="check-row"><input name="remember" type="checkbox" defaultChecked />Remember me</label><p className="form-message">{message}</p><button className="button-primary" disabled={loading}>{loading ? "Signing in..." : <>Sign in <ArrowRight /></>}</button></form> : <form action={register} className="auth-form"><header><h2>Create your account</h2><p>Join CivicMitra and begin with your household.</p></header><Field icon={<UserRound />} label="Full name" name="name" placeholder="Your full name" /><Field icon={<Mail />} label="Email" name="email" type="email" placeholder="you@example.com" /><Field icon={<UserRound />} label="Phone number" name="phone" inputMode="numeric" placeholder="10 digit mobile number" /><Field icon={<LockKeyhole />} label="Password" name="password" type="password" placeholder="At least 8 characters" /><label>Account type<select name="role" defaultValue=""><option value="" disabled>Select a role</option>{roles.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label><label>Ward reference <input name="wardId" inputMode="numeric" placeholder="For example, 1" /></label><label className="check-row"><input required type="checkbox" />I agree to the terms and privacy policy.</label><p className="form-message">{message}</p><button className="button-primary" disabled={loading}>{loading ? "Creating account..." : <>Create account <ArrowRight /></>}</button></form>}</div></section></main>;
}

function Field({ icon, label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode; label: string }) { return <label>{label}<span className="input-with-icon">{icon}<input {...props} required /></span></label>; }
