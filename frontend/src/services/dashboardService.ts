import { apiRequest } from "@/lib/api";
import type { DashboardSummary, DowntimeByMachine, DowntimeByReason } from "@/types";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>("/api/dashboard/summary", { cache: "no-store" });
}

export const getDowntimeByReason = () => apiRequest<DowntimeByReason[]>("/api/dashboard/downtime-by-reason", { cache: "no-store" });
export const getDowntimeByMachine = () => apiRequest<DowntimeByMachine[]>("/api/dashboard/downtime-by-machine", { cache: "no-store" });
