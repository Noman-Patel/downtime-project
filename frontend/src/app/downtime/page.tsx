import { DowntimeManager } from "@/components/downtime/DowntimeManager";

export default async function DowntimePage({ searchParams }: { searchParams: Promise<{ machineId?: string; new?: string }> }) {
  const params = await searchParams;
  const machineId = params.machineId ? Number(params.machineId) : undefined;
  return <DowntimeManager initialMachineId={machineId} startNewEvent={params.new === "1"} />;
}
