"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { LoginResponse } from "../../lib/api";
import { readSession } from "../../lib/session";
import { useRouter } from "next/navigation";

interface AuthContextType {
  session: LoginResponse | null;
  login: (session: LoginResponse) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<LoginResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const savedSession = window.localStorage.getItem("civicmitra.session");
      if (savedSession) {
        setSession(JSON.parse(savedSession) as LoginResponse);
      } else {
        const s = readSession();
        if (s) setSession(s);
      }
    } catch (e) {
      console.error("Failed to load auth session", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (newSession: LoginResponse) => {
    setSession(newSession);
    try {
      window.localStorage.setItem("civicmitra.session", JSON.stringify(newSession));
      window.localStorage.setItem("civicmitra.token", newSession.token);
      window.localStorage.setItem(
        "civicmitra.user",
        JSON.stringify({
          email: newSession.email,
          name: newSession.name,
          role: newSession.role,
          userId: newSession.userId
        })
      );
    } catch (e) {
      console.error("Failed to save auth session", e);
    }
  };

  const logout = () => {
    try {
      window.localStorage.removeItem("civicmitra.session");
      window.localStorage.removeItem("civicmitra.token");
      window.localStorage.removeItem("civicmitra.user");
      window.sessionStorage.removeItem("civicmitra.token");
      window.sessionStorage.removeItem("civicmitra.user");
    } catch (e) {
      console.error("Failed to clear auth session", e);
    }
    setSession(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ session, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return { session: null, login: () => {}, logout: () => {}, isLoading: true };
  }
  return context;
}
