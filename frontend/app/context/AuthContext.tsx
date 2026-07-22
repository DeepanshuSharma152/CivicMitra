"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { LoginResponse } from "../../lib/api";
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
    const savedSession = window.localStorage.getItem("civicmitra.session");
    if (savedSession) {
      setSession(JSON.parse(savedSession) as LoginResponse);
    }
    setIsLoading(false);
  }, []);

  const login = (newSession: LoginResponse) => {
    setSession(newSession);
    window.localStorage.setItem("civicmitra.session", JSON.stringify(newSession));
  };

  const logout = () => {
    window.localStorage.removeItem("civicmitra.session");
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
