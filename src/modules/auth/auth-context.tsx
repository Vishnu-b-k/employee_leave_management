"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth as clientAuth } from "@/lib/firebase/client";
import { signInWithEmailAndPassword, signOut as clientSignOut } from "firebase/auth";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  department: { id: string; name: string } | null;
  manager: { id: string; displayName: string } | null;
  isEmployee: boolean;
  isManager: boolean;
  isHOD: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch current session from server
  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/auth/me", {
        headers: { "Cache-Control": "no-cache" },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          setError(null);
          return;
        }
      }
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      let idToken: string | undefined;

      // 1. Attempt Client Firebase SDK login first
      try {
        const userCred = await signInWithEmailAndPassword(clientAuth, email, password);
        idToken = await userCred.user.getIdToken();
      } catch {
        // If client SDK authentication encounters an issue, fall back to server-side password exchange
      }

      // 2. Exchange token or direct credentials with our backend
      const payload = idToken ? { idToken } : { email, password };
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.error?.message || "Invalid email or password.";
        setError(errorMsg);
        return false;
      }

      setUser(data.user);
      setError(null);
      return true;
    } catch {
      setError("An unexpected error occurred during login. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await fetch("/api/v1/auth/logout", { method: "POST" });
      try {
        await clientSignOut(clientAuth);
      } catch {
        // Ignore client signOut error
      }
      setUser(null);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
