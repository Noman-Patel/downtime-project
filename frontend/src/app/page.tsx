import Link from "next/link";
import { AnalyticsCard } from "@/components/dashboard/AnalyticsCard";
import { getDashboardSummary, getDowntimeByMachine, getDowntimeByReason } from "@/services/dashboardService";
import type { DashboardSummary } from "@/types";

export const dynamic = "force-dynamic";
const empty: DashboardSummary = { totalDowntimeEvents: 0, openDowntimeEvents: 0, resolvedDowntimeEvents: 0, totalMachines: 0, totalDowntimeMinutes: 0 };

export default async function Home() {
  const results = await Promise.allSettled([getDashboardSummary(), getDowntimeByReason(), getDowntimeByMachine()]);
  const summary = results[0].status === "fulfilled" ? results[0].value : empty;
  const reasons = results[1].status === "fulfilled" ? results[1].value : [];
  const machines = results[2].status === "fulfilled" ? results[2].value : [];
  const offline = results.some((result) => result.status === "rejected");
  const cards = [
    ["Total events", summary.totalDowntimeEvents, "All recorded incidents", "bg-slate-900 text-white"],
    ["Open events", summary.openDowntimeEvents, "Needs attention", "bg-amber-50 text-amber-900"],
    ["Resolved", summary.resolvedDowntimeEvents, "Closed incidents", "bg-emerald-50 text-emerald-900"],
    ["Downtime", summary.totalDowntimeMinutes, "Total minutes", "bg-cyan-50 text-cyan-900"],
  ];
  return <div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-700">Plant overview</p><h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Operations dashboard</h1><p className="mt-2 text-sm text-slate-500">A live view of equipment health and downtime performance.</p></div><Link href="/downtime" className="rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">Log downtime event</Link></div>
    {offline && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">The backend is currently unavailable. Start the API on port 8080 to populate live metrics.</div>}
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, helper, tone]) => <div key={label as string} className={`rounded-2xl border border-black/5 p-6 shadow-sm ${tone}`}><p className="text-sm opacity-70">{label}</p><p className="mt-3 text-4xl font-bold tracking-tight">{value}</p><p className="mt-3 text-xs opacity-60">{helper}</p></div>)}</div>
    <div className="mt-8 grid gap-6 xl:grid-cols-2"><AnalyticsCard title="Downtime by reason" rows={reasons.map((r) => ({ label: r.reason, value: r.count }))} valueKey="events" /><AnalyticsCard title="Downtime by machine" rows={machines.map((m) => ({ label: m.machineName, value: m.downtimeEvents }))} valueKey="events" /></div>
    <section className="mt-8 rounded-2xl bg-slate-950 p-6 text-white md:flex md:items-center md:justify-between"><div><p className="text-sm text-slate-400">Asset coverage</p><p className="mt-2 text-2xl font-bold">{summary.totalMachines} machines connected</p></div><Link href="/machines" className="mt-5 inline-block text-sm font-semibold text-cyan-400 md:mt-0">Manage machine registry →</Link></section></div>;
}
