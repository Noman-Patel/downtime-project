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

export type DowntimeStatus = "OPEN" | "RESOLVED";

export type DowntimeEvent = {
  id: number;
  faultReason: string;
  description?: string | null;
  status: DowntimeStatus;
  occurredAt: string;
  resolvedAt?: string | null;
  machine: Machine;
};

export type DowntimeEventPayload = {
  machineId: number;
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

export type DowntimeByMachine = {
  machineId: number;
  machineName: string;
  downtimeEvents: number;
};

export type DepartmentPayload = Pick<Department, "name" | "description" | "location">;
export type ProductionLinePayload = Pick<ProductionLine, "name" | "location" | "department">;
