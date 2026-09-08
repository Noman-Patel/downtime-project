"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getDowntimeEvents } from "@/services/downtimeService";
import { resourceService } from "@/services/resourceService";
import type { DowntimeEvent, DowntimeStatus, Machine } from "@/types";

const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

const minutesBetween = (start: string, end: string) =>
  Math.max(
    0,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000),
  );

const formatMinutes = (minutes: number) => {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  return [
    days ? `${days}d` : "",
    hours ? `${hours}h` : "",
    rest || (!days && !hours) ? `${rest}m` : "",
  ]
    .filter(Boolean)
    .join(" ");
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

  const loadHistory = useCallback(
    async (q = "", nextStatus: DowntimeStatus | "" = "") => {
      setSearching(true);
      setError("");
      try {
        setEvents(
          await getDowntimeEvents({
            machineId: String(machineId),
            q,
            status: nextStatus,
          }),
        );
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load machine history");
      } finally {
        setSearching(false);
      }
    },
    [machineId],
  );

  useEffect(() => {
    if (!Number.isInteger(machineId) || machineId <= 0) {
      setError("Invalid machine ID");
      setLoading(false);
      return;
    }

    void Promise.all([
      resourceService.machine(machineId),
      getDowntimeEvents({ machineId: String(machineId) }),
    ])
      .then(([nextMachine, history]) => {
        setMachine(nextMachine);
        setAllEvents(history);
        setEvents(history);
      })
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : "Unable to load machine");
      })
      .finally(() => setLoading(false));
  }, [machineId]);

  const metrics = useMemo(() => {
    const open = allEvents.filter((event) => event.status === "OPEN").length;
    const resolved = allEvents.filter((event) => event.status === "RESOLVED").length;
    const totalMinutes = allEvents.reduce(
      (total, event) =>
        total +
        minutesBetween(event.occurredAt, event.resolvedAt ?? new Date().toISOString()),
      0,
    );
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

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-14 text-center text-sm text-slate-500">
        Loading machine history…
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="max-w-xl rounded-lg border border-red-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-slate-950">Machine unavailable</h1>
        <p className="mt-2 text-sm text-red-700">{error || "This machine could not be found."}</p>
        <Link href="/machines" className="mt-5 inline-block text-sm font-medium text-blue-700">
          ← Back to machines
        </Link>
      </div>
    );
  }

  const summaryItems = [
    ["Total events", metrics.total],
    ["Open", metrics.open],
    ["Resolved", metrics.resolved],
    ["Total downtime", formatMinutes(metrics.totalMinutes)],
  ];

  return (
    <div>
      <Link href="/machines" className="text-sm font-medium text-blue-700 hover:text-blue-900">
        ← Machines
      </Link>

      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{machine.name}</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {machine.type || "Type not specified"} · {machine.location || "No location recorded"}
          </p>
        </div>
        <Link
          href={`/downtime?machineId=${machine.id}&new=1`}
          className="rounded-md bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700"
        >
          Record fault
        </Link>
      </div>

      <section className="mt-7 grid overflow-hidden rounded-lg border border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Department", machine.productionLine.department.name],
          ["Production line", machine.productionLine.name],
          ["Line location", machine.productionLine.location || "—"],
          ["Machine ID", `#${machine.id}`],
        ].map(([label, value], index) => (
          <div
            key={label}
            className={`px-5 py-4 ${index ? "border-t border-slate-100 sm:border-l" : ""}`}
          >
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid overflow-hidden rounded-lg border border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-4">
        {summaryItems.map(([label, value], index) => (
          <div
            key={label}
            className={`px-5 py-4 ${index ? "border-t border-slate-100 sm:border-l" : ""}`}
          >
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${label === "Open" && Number(value) > 0 ? "text-amber-700" : "text-slate-950"}`}>
              {value}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-semibold text-slate-900">Fault history</h2>
              <p className="mt-1 text-sm text-slate-500">Maintenance records for this machine.</p>
            </div>
            <p className="text-xs text-slate-500">
              {searching ? "Searching…" : `${events.length} ${events.length === 1 ? "event" : "events"}`}
            </p>
          </div>

          <form onSubmit={submitSearch} className="mt-4 grid gap-3 sm:grid-cols-[1fr_170px_auto_auto]">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reason or description"
              className="rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as DowntimeStatus | "")}
              className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Any status</option>
              <option value="OPEN">Open</option>
              <option value="RESOLVED">Resolved</option>
            </select>
            <button className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
              Search
            </button>
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear
            </button>
          </form>
        </div>

        {error && (
          <p className="m-5 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="divide-y divide-slate-100">
          {events.map((event) => {
            const duration = event.resolvedAt
              ? minutesBetween(event.occurredAt, event.resolvedAt)
              : minutesBetween(event.occurredAt, new Date().toISOString());

            return (
              <article key={event.id} className="grid gap-4 px-5 py-5 md:grid-cols-[1fr_auto] md:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-medium text-slate-950">{event.faultReason}</h3>
                    <span
                      className={`rounded border px-2 py-0.5 text-[11px] font-medium ${
                        event.status === "OPEN"
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-emerald-200 bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      {event.status === "OPEN" ? "Open" : "Resolved"}
                    </span>
                  </div>
                  <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {event.description || "No description recorded."}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Occurred {formatDate(event.occurredAt)}
                    {event.resolvedAt ? ` · Resolved ${formatDate(event.resolvedAt)}` : " · Still open"}
                  </p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-xs text-slate-400">Duration</p>
                  <p className="mt-1 text-sm font-medium tabular-nums text-slate-700">
                    {formatMinutes(duration)}{event.status === "OPEN" ? " ongoing" : ""}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {!searching && !events.length && (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">No matching fault history</p>
            <p className="mt-1 text-sm text-slate-500">
              Clear the search or record the first fault for this machine.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
