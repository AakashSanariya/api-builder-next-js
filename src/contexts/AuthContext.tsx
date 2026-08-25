"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface AuthUser {
  firstName: string;
  lastName: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => void;
  logout: () => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
      fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Token invalid");
          return res.json();
        })
        .then((res) => {
          if (res.success && res.data) {
            setUser(res.data);
          } else {
            localStorage.removeItem("auth_token");
            setToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem("auth_token");
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("auth_token", data.token);
    setToken(data.token);
    setUser(data.data);
  };

  const signup = async (firstName: string, lastName: string, email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || "Signup failed");
    }

    return data;
  };

  const updateUser = (data: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : prev));
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const getToken = () => token;

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!token && !!user, isLoading, login, signup, updateUser, logout, getToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
