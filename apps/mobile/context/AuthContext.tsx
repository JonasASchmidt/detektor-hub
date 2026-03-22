"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { saveAuth, clearAuth, getToken, getStoredUser, StoredUser } from "@/lib/token";
import { apiPost } from "@/lib/api";
import { API_URL } from "@/lib/constants";

interface AuthContextValue {
  user: StoredUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from secure storage on app start
  useEffect(() => {
    (async () => {
      const [token, stored] = await Promise.all([getToken(), getStoredUser()]);
      if (token && stored) setUser(stored);
      setIsLoading(false);
    })();
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch(`${API_URL}/api/mobile/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Anmeldung fehlgeschlagen.");
    }

    const { token, user: userData } = await res.json();
    await saveAuth(token, userData);
    setUser(userData);
  }

  async function logout() {
    await clearAuth();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
