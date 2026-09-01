import { apiRequest } from "@/lib/api";
import type { Department, DepartmentPayload, DowntimeReason, DowntimeReasonPayload, Machine, ProductionLine, ProductionLinePayload } from "@/types";

export const resourceService = {
  machines: () => apiRequest<Machine[]>("/api/machines", { cache: "no-store" }),
  productionLines: () => apiRequest<ProductionLine[]>("/api/production-lines", { cache: "no-store" }),
  departments: () => apiRequest<Department[]>("/api/departments", { cache: "no-store" }),
  downtimeReasons: () => apiRequest<DowntimeReason[]>("/api/downtime-reasons", { cache: "no-store" }),
  createMachine: (body: Omit<Machine, "id">) => apiRequest<Machine>("/api/machines", { method: "POST", body: JSON.stringify(body) }),
  updateMachine: (id: number, body: Omit<Machine, "id">) => apiRequest<Machine>(`/api/machines/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteMachine: (id: number) => apiRequest<void>(`/api/machines/${id}`, { method: "DELETE" }),
  createDepartment: (body: DepartmentPayload) => apiRequest<Department>("/api/departments", { method: "POST", body: JSON.stringify(body) }),
  updateDepartment: (id: number, body: DepartmentPayload) => apiRequest<Department>(`/api/departments/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteDepartment: (id: number) => apiRequest<void>(`/api/departments/${id}`, { method: "DELETE" }),
  createProductionLine: (body: ProductionLinePayload) => apiRequest<ProductionLine>("/api/production-lines", { method: "POST", body: JSON.stringify(body) }),
  updateProductionLine: (id: number, body: ProductionLinePayload) => apiRequest<ProductionLine>(`/api/production-lines/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteProductionLine: (id: number) => apiRequest<void>(`/api/production-lines/${id}`, { method: "DELETE" }),
  createDowntimeReason: (body: DowntimeReasonPayload) => apiRequest<DowntimeReason>("/api/downtime-reasons", { method: "POST", body: JSON.stringify(body) }),
  updateDowntimeReason: (id: number, body: DowntimeReasonPayload) => apiRequest<DowntimeReason>(`/api/downtime-reasons/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteDowntimeReason: (id: number) => apiRequest<void>(`/api/downtime-reasons/${id}`, { method: "DELETE" }),
};
