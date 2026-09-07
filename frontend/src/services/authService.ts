import { apiRequest, clearCsrfToken } from "@/lib/api";
import type { CurrentUser } from "@/types";

export type LoginPayload = {
  username: string;
  password: string;
};

export const authService = {
  login: async (body: LoginPayload) => {
    const user = await apiRequest<CurrentUser>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
    // Refresh the cached CSRF contract after the authentication boundary.
    clearCsrfToken();
    return user;
  },
  me: () =>
    apiRequest<CurrentUser>("/api/auth/me", {
      cache: "no-store",
    }),
  logout: async () => {
    try {
      await apiRequest<void>("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      clearCsrfToken();
    }
  },
};
