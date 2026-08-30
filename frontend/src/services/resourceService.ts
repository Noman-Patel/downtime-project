import { apiRequest } from "@/lib/api";
import type { Department, DowntimeReason, Machine, ProductionLine } from "@/types";

export const resourceService = {
  machines: () => apiRequest<Machine[]>("/api/machines", { cache: "no-store" }),
  productionLines: () => apiRequest<ProductionLine[]>("/api/production-lines", { cache: "no-store" }),
  departments: () => apiRequest<Department[]>("/api/departments", { cache: "no-store" }),
  downtimeReasons: () => apiRequest<DowntimeReason[]>("/api/downtime-reasons", { cache: "no-store" }),
  createMachine: (body: Omit<Machine, "id">) => apiRequest<Machine>("/api/machines", { method: "POST", body: JSON.stringify(body) }),
  updateMachine: (id: number, body: Omit<Machine, "id">) => apiRequest<Machine>(`/api/machines/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteMachine: (id: number) => apiRequest<void>(`/api/machines/${id}`, { method: "DELETE" }),
};
