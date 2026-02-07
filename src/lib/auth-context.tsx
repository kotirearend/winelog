"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api-client";

export type BeverageType = "wine" | "beer";
export type ScoringMode = "casual" | "wanker";

export interface User {
  id: string;
  email: string;
  name: string;
  defaultCurrency: string;
  beverageType?: BeverageType;
  scoringMode?: ScoringMode;
  preferredLanguage?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  beverageType: BeverageType;
  scoringMode: ScoringMode;
  setBeverageType: (type: BeverageType) => void;
  setScoringMode: (mode: ScoringMode) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    name: string,
    defaultCurrency: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [beverageType, setBeverageTypeState] = useState<BeverageType>("wine");
  const [scoringMode, setScoringModeState] = useState<ScoringMode>("casual");

  const setBeverageType = async (type: BeverageType) => {
    setBeverageTypeState(type);
    if (user) {
      const updated = { ...user, beverageType: type };
      setUser(updated);
      localStorage.setItem("winelog_user", JSON.stringify(updated));
      try {
        await api.patch("/auth/me", { beverageType: type });
      } catch (err) {
        console.error("Failed to save beverage type:", err);
      }
    }
  };

  const setScoringMode = async (mode: ScoringMode) => {
    setScoringModeState(mode);
    if (user) {
      const updated = { ...user, scoringMode: mode };
      setUser(updated);
      localStorage.setItem("winelog_user", JSON.stringify(updated));
      try {
        await api.patch("/auth/me", { scoringMode: mode });
      } catch (err) {
        console.error("Failed to save scoring mode:", err);
      }
    }
  };

  // On mount, validate stored token against the server
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem("winelog_user");
        const storedToken = api.getToken();

        if (storedUser && storedToken) {
          // Validate token with the server to get the REAL user
          // Use raw fetch to avoid api-client's auto-redirect on 401
          try {
            const res = await fetch("/api/auth/me", {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
            if (res.ok) {
              const serverUser = await res.json();
              // Use server-returned user data (authoritative)
              setUser(serverUser);
              localStorage.setItem("winelog_user", JSON.stringify(serverUser));
              if (serverUser.beverageType) {
                setBeverageTypeState(serverUser.beverageType);
              }
              if (serverUser.scoringMode) {
                setScoringModeState(serverUser.scoringMode);
              }
            } else {
              // Token is invalid/expired — clear everything
              api.clearToken();
              localStorage.removeItem("winelog_user");
              setUser(null);
            }
          } catch {
            // Network error — use cached data as fallback
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            if (parsed.beverageType) setBeverageTypeState(parsed.beverageType);
            if (parsed.scoringMode) setScoringModeState(parsed.scoringMode);
          }
        } else {
          // No stored session — clear any stale data
          api.clearToken();
          localStorage.removeItem("winelog_user");
        }
      } catch (error) {
        console.error("Failed to restore auth:", error);
        api.clearToken();
        localStorage.removeItem("winelog_user");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Clear any existing session first
      api.clearToken();
      localStorage.removeItem("winelog_user");

      const response = await api.post("/auth/login", { email, password });
      const { token, user: userData } = response;

      api.setToken(token);
      localStorage.setItem("winelog_user", JSON.stringify(userData));
      setUser(userData);
      if (userData.beverageType) {
        setBeverageTypeState(userData.beverageType);
      }
      if (userData.scoringMode) {
        setScoringModeState(userData.scoringMode);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    defaultCurrency: string
  ) => {
    setIsLoading(true);
    try {
      // Clear any existing session first
      api.clearToken();
      localStorage.removeItem("winelog_user");

      const response = await api.post("/auth/signup", {
        email,
        password,
        name,
        defaultCurrency,
      });
      const { token, user: userData } = response;

      api.setToken(token);
      localStorage.setItem("winelog_user", JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.clearToken();
    localStorage.removeItem("winelog_user");
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, beverageType, scoringMode, setBeverageType, setScoringMode, login, signup, logout }}>
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
