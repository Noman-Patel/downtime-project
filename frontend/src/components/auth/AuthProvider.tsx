"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AUTH_EXPIRED_EVENT, ApiError } from "@/lib/api";
import { authService, type LoginPayload } from "@/services/authService";
import type { CurrentUser } from "@/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: CurrentUser | null;
  status: AuthStatus;
  login: (credentials: LoginPayload) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.me();
      setUser(currentUser);
      setStatus("authenticated");
    } catch (cause) {
      setUser(null);
      setStatus("unauthenticated");

      if (!(cause instanceof ApiError) || cause.status !== 401) {
        throw cause;
      }
    }
  }, []);

  useEffect(() => {
    const expireSession = () => {
      setUser(null);
      setStatus("unauthenticated");
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, expireSession);
    void refreshUser().catch(() => undefined);

    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, expireSession);
  }, [refreshUser]);

  const login = useCallback(async (credentials: LoginPayload) => {
    const authenticatedUser = await authService.login(credentials);
    setUser(authenticatedUser);
    setStatus("authenticated");
    return authenticatedUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, login, logout, refreshUser }),
    [login, logout, refreshUser, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
