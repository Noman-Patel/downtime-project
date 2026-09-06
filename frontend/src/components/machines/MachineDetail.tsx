"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getDowntimeEvents } from "@/services/downtimeService";
import { resourceService } from "@/services/resourceService";
import type { DowntimeEvent, DowntimeStatus, Machine } from "@/types";

const formatDate = (value?: string | null) => value
  ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "—";

const minutesBetween = (start: string, end: string) =>
  Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000));

const formatMinutes = (minutes: number) => {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  return [days ? `${days}d` : "", hours ? `${hours}h` : "", rest || (!days && !hours) ? `${rest}m` : ""].filter(Boolean).join(" ");
};

export function MachineDetail({ machineId }: { machineId: number }) {
  const [machine, setMachine] = useState<Machine | null>(null);
  const [allEvents, setAllEvents] = useState<DowntimeEvent[]>([]);
  const [events, setEvents] = useState<DowntimeEvent[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<DowntimeStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async (q = "", nextStatus: DowntimeStatus | "" = "") => {
    setSearching(true);
    setError("");
    try {
      setEvents(await getDowntimeEvents({ machineId: String(machineId), q, status: nextStatus }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load machine history");
    } finally {
      setSearching(false);
    }
  }, [machineId]);

  useEffect(() => {
    if (!Number.isInteger(machineId) || machineId <= 0) {
      setError("Invalid machine ID");
      setLoading(false);
      return;
    }
    void Promise.all([
      resourceService.machine(machineId),
      getDowntimeEvents({ machineId: String(machineId) }),
    ]).then(([nextMachine, history]) => {
      setMachine(nextMachine);
      setAllEvents(history);
      setEvents(history);
    }).catch((cause) => {
      setError(cause instanceof Error ? cause.message : "Unable to load machine");
    }).finally(() => setLoading(false));
  }, [machineId]);

  const metrics = useMemo(() => {
    const open = allEvents.filter((event) => event.status === "OPEN").length;
    const resolved = allEvents.filter((event) => event.status === "RESOLVED").length;
    const totalMinutes = allEvents.reduce((total, event) =>
      total + minutesBetween(event.occurredAt, event.resolvedAt ?? new Date().toISOString()), 0);
    return { total: allEvents.length, open, resolved, totalMinutes };
  }, [allEvents]);

  const submitSearch = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadHistory(query, status);
  };

  const clearSearch = () => {
    setQuery("");
    setStatus("");
    setEvents(allEvents);
  };

  if (loading) return <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200 bg-white p-16 text-center text-sm text-slate-500">Loading machine history…</div>;
  if (!machine) return <div className="mx-auto max-w-3xl rounded-2xl border border-rose-200 bg-rose-50 p-8"><h1 className="text-xl font-bold text-rose-900">Machine unavailable</h1><p className="mt-2 text-sm text-rose-700">{error || "This machine could not be found."}</p><Link href="/machines" className="mt-5 inline-block text-sm font-semibold text-rose-900">← Return to machines</Link></div>;

  return <div className="mx-auto max-w-7xl">
    <Link href="/machines" className="text-sm font-semibold text-cyan-700">← All machines</Link>
    <div className="mt-5 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div className="flex items-start gap-4"><div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-slate-950 text-xl font-black text-cyan-400">{machine.name.slice(0, 2).toUpperCase()}</div><div><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-700">Machine profile</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{machine.name}</h1><p className="mt-2 text-sm text-slate-500">{machine.type || "Unspecified type"} · {machine.location || "No location recorded"}</p></div></div>
      <Link href={`/downtime?machineId=${machine.id}&new=1`} className="rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-slate-800">+ Report fault</Link>
    </div>

    <section className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      <div><p className="text-xs uppercase tracking-wide text-slate-400">Department</p><p className="mt-2 font-semibold">{machine.productionLine.department.name}</p></div>
      <div><p className="text-xs uppercase tracking-wide text-slate-400">Production line</p><p className="mt-2 font-semibold">{machine.productionLine.name}</p></div>
      <div><p className="text-xs uppercase tracking-wide text-slate-400">Line location</p><p className="mt-2 font-semibold">{machine.productionLine.location || "—"}</p></div>
      <div><p className="text-xs uppercase tracking-wide text-slate-400">Machine ID</p><p className="mt-2 font-semibold">#{machine.id}</p></div>
    </section>

    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[["Total faults", metrics.total, "All recorded events"], ["Open", metrics.open, "Currently unresolved"], ["Resolved", metrics.resolved, "Completed events"], ["Total downtime", formatMinutes(metrics.totalMinutes), "Includes ongoing faults"]].map(([label, value, helper], index) => <div key={label} className={`rounded-2xl border p-5 shadow-sm ${index === 1 && Number(value) > 0 ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p><p className="mt-2 text-xs text-slate-400">{helper}</p></div>)}
    </div>

    <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-lg font-bold">Fault history</h2><p className="mt-1 text-sm text-slate-500">Search maintenance records for this machine.</p></div><p className="text-xs font-semibold text-slate-500">{searching ? "Searching…" : `${events.length} ${events.length === 1 ? "event" : "events"}`}</p></div>
        <form onSubmit={submitSearch} className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px_auto_auto]"><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search fault reason or description" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"/><select value={status} onChange={(event) => setStatus(event.target.value as DowntimeStatus | "")} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Any status</option><option value="OPEN">Open</option><option value="RESOLVED">Resolved</option></select><button className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950">Search</button><button type="button" onClick={clearSearch} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Clear</button></form>
      </div>
      {error && <p className="m-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="divide-y divide-slate-100">{events.map((event) => {
        const duration = event.resolvedAt ? minutesBetween(event.occurredAt, event.resolvedAt) : minutesBetween(event.occurredAt, new Date().toISOString());
        return <article key={event.id} className="grid gap-4 p-5 hover:bg-slate-50 md:grid-cols-[1fr_auto] md:items-start"><div><div className="flex flex-wrap items-center gap-3"><h3 className="font-semibold text-slate-900">{event.faultReason}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${event.status === "OPEN" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{event.status}</span></div><p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-500">{event.description || "No description recorded."}</p><p className="mt-3 text-xs text-slate-400">Occurred {formatDate(event.occurredAt)}{event.resolvedAt ? ` · Resolved ${formatDate(event.resolvedAt)}` : " · Still open"}</p></div><div className="rounded-xl bg-slate-100 px-4 py-3 text-right"><p className="text-xs text-slate-400">Duration</p><p className="mt-1 font-bold text-slate-700">{formatMinutes(duration)}{event.status === "OPEN" ? " ongoing" : ""}</p></div></article>;
      })}</div>
      {!searching && !events.length && <div className="p-14 text-center"><p className="font-semibold text-slate-700">No matching fault history</p><p className="mt-2 text-sm text-slate-500">Try clearing the search, or report the first fault for this machine.</p></div>}
    </section>
  </div>;
}
