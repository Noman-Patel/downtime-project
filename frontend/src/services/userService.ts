import { apiRequest } from "@/lib/api";
import type { AppUser, CreateUserPayload, UpdateUserPayload } from "@/types";

export const userService = {
  all: () => apiRequest<AppUser[]>("/api/users", { cache: "no-store" }),
  create: (body: CreateUserPayload) =>
    apiRequest<AppUser>("/api/users", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: number, body: UpdateUserPayload) =>
    apiRequest<AppUser>(`/api/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: (id: number) =>
    apiRequest<void>(`/api/users/${id}`, {
      method: "DELETE",
    }),
};
