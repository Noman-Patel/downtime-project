import { apiRequest } from "@/lib/api";
import type { DowntimeEvent, DowntimeEventPayload, DowntimeStatus } from "@/types";

export type DowntimeFilters = { machineId?: string; status?: DowntimeStatus | ""; start?: string; end?: string };
export function getDowntimeEvents(filters: DowntimeFilters = {}) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => value && query.set(key, value));
  return apiRequest<DowntimeEvent[]>(`/api/downtime-events${query.size ? `?${query}` : ""}`, { cache: "no-store" });
}
export const createDowntimeEvent = (payload: DowntimeEventPayload) => apiRequest<DowntimeEvent>("/api/downtime-events", { method: "POST", body: JSON.stringify(payload) });
export const updateDowntimeEvent = (id: number, payload: DowntimeEventPayload) => apiRequest<DowntimeEvent>(`/api/downtime-events/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const deleteDowntimeEvent = (id: number) => apiRequest<void>(`/api/downtime-events/${id}`, { method: "DELETE" });
