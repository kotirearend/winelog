"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api-client";

export interface User {
  id: string;
  email: string;
  name: string;
  defaultCurrency: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
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

  // On mount, check if we have stored user info
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem("winelog_user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to restore auth:", error);
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
      const response = await api.post("/auth/login", { email, password });
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

  const signup = async (
    email: string,
    password: string,
    name: string,
    defaultCurrency: string
  ) => {
    setIsLoading(true);
    try {
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
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
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
