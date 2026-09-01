export type Department = {
  id: number;
  name: string;
  description?: string | null;
  location?: string | null;
  createdAt?: string;
};

export type ProductionLine = {
  id: number;
  name: string;
  location?: string | null;
  department: Department;
};

export type Machine = {
  id: number;
  name: string;
  type?: string | null;
  location?: string | null;
  productionLine: ProductionLine;
};

export type DowntimeReason = {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  planned: boolean;
  createdAt?: string;
};

export type DowntimeStatus = "OPEN" | "RESOLVED";

export type DowntimeEvent = {
  id: number;
  faultReason: string;
  description?: string | null;
  status: DowntimeStatus;
  occurredAt: string;
  resolvedAt?: string | null;
  machine: Machine;
  downtimeReason?: DowntimeReason | null;
};

export type DowntimeEventPayload = {
  machineId: number;
  downtimeReasonId?: number | null;
  faultReason: string;
  description?: string;
  occurredAt: string;
  resolvedAt?: string | null;
};

export type DashboardSummary = {
  totalDowntimeEvents: number;
  openDowntimeEvents: number;
  resolvedDowntimeEvents: number;
  totalMachines: number;
  totalDowntimeMinutes: number;
};

export type DowntimeByReason = { reason: string; count: number };
export type DowntimeByMachine = {
  machineId: number;
  machineName: string;
  downtimeEvents: number;
};

export type DepartmentPayload = Pick<Department, "name" | "description" | "location">;
export type ProductionLinePayload = Pick<ProductionLine, "name" | "location" | "department">;
export type DowntimeReasonPayload = Pick<DowntimeReason, "name" | "description" | "category" | "planned">;
