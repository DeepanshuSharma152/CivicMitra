import type { SessionUser } from "./types";

const TOKEN_KEY = "civicmitra.token";
const USER_KEY = "civicmitra.user";

export function readSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  const stored = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!token || !stored) return null;
  try { return { ...JSON.parse(stored), token } as SessionUser; } catch { return null; }
}

export function saveSession(session: SessionUser, persist: boolean) {
  const store = persist ? localStorage : sessionStorage;
  store.setItem(TOKEN_KEY, session.token);
  store.setItem(USER_KEY, JSON.stringify({ email: session.email, name: session.name, role: session.role, userId: session.userId }));
}

export function clearSession() {
  [localStorage, sessionStorage].forEach(store => {
    store.removeItem(TOKEN_KEY);
    store.removeItem(USER_KEY);
    store.removeItem("civicmitra.session");
  });
}

