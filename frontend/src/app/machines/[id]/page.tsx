import { MachineDetail } from "@/components/machines/MachineDetail";

export default async function MachineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MachineDetail machineId={Number(id)} />;
}
