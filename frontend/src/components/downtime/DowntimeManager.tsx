"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createDowntimeEvent,
  deleteDowntimeEvent,
  getDowntimeEvents,
  updateDowntimeEvent,
  type DowntimeFilters,
} from "@/services/downtimeService";
import { resourceService } from "@/services/resourceService";
import { useAuth } from "@/components/auth/AuthProvider";
import type {
  DowntimeEvent,
  DowntimeEventPayload,
  Machine,
  ProductionLine,
} from "@/types";

type EventForm = {
  machineId: string;
  faultReason: string;
  description: string;
  status: "OPEN" | "RESOLVED";
  occurredAt: string;
  resolvedAt: string;
};

const emptyForm = (): EventForm => ({
  machineId: "",
  faultReason: "",
  description: "",
  status: "OPEN",
  occurredAt: new Date().toISOString().slice(0, 16),
  resolvedAt: "",
});

const formatDate = (date?: string | null) =>
  date
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(date))
    : "—";

const formatDuration = (event: DowntimeEvent) => {
  const start = new Date(event.occurredAt).getTime();
  const end = event.resolvedAt ? new Date(event.resolvedAt).getTime() : Date.now();

  if (!Number.isFinite(start) || !Number.isFinite(end)) return "Duration unavailable";

  const minutes = Math.max(0, Math.round((end - start) / 60_000));
  const days = Math.floor(minutes / 1_440);
  const hours = Math.floor((minutes % 1_440) / 60);
  const remainingMinutes = minutes % 60;
  const parts = [
    days ? `${days}d` : "",
    hours ? `${hours}h` : "",
    remainingMinutes || (!days && !hours) ? `${remainingMinutes}m` : "",
  ].filter(Boolean);

  return `${parts.join(" ")}${event.status === "OPEN" ? " ongoing" : ""}`;
};

const fieldClass =
  "mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export function DowntimeManager({ initialMachineId, startNewEvent = false }: { initialMachineId?: number; startNewEvent?: boolean }) {
  const { user } = useAuth();
  const canDelete = user?.role === "ADMIN";
  const [events, setEvents] = useState<DowntimeEvent[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
  const [filters, setFilters] = useState<DowntimeFilters>({});
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [editing, setEditing] = useState<DowntimeEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const appliedInitialAction = useRef(false);

  const load = useCallback(async (next: DowntimeFilters) => {
    setLoading(true);
    setError("");

    try {
      setEvents(await getDowntimeEvents(next));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([
      resourceService.machines(),
      resourceService.productionLines(),
    ])
      .then(([machineOptions, lineOptions]) => {
        setMachines(machineOptions);
        setProductionLines(lineOptions);
        if (startNewEvent && !appliedInitialAction.current) {
          const selectedMachineId =
            initialMachineId &&
            machineOptions.some((machine) => machine.id === initialMachineId)
              ? String(initialMachineId)
              : "";
          setEditing(null);
          setForm({ ...emptyForm(), machineId: selectedMachineId });
          setOpen(true);
          appliedInitialAction.current = true;
        }
      })
      .catch(() => setError("Could not load search and form options"));

    void load({});
  }, [initialMachineId, load, startNewEvent]);

  const begin = (event?: DowntimeEvent) => {
    setError("");
    setEditing(event ?? null);
    setForm(
      event
        ? {
            machineId: String(event.machine.id),
            faultReason: event.faultReason,
            description: event.description ?? "",
            status: event.status,
            occurredAt: event.occurredAt.slice(0, 16),
            resolvedAt: event.resolvedAt?.slice(0, 16) ?? "",
          }
        : emptyForm(),
    );
    setOpen(true);
  };

  const save = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      form.status === "RESOLVED" &&
      form.resolvedAt &&
      new Date(form.resolvedAt).getTime() < new Date(form.occurredAt).getTime()
    ) {
      setError("Resolved at cannot be earlier than occurred at");
      return;
    }
    setSaving(true);
    setError("");

    const payload: DowntimeEventPayload = {
      machineId: Number(form.machineId),
      faultReason: form.faultReason,
      description: form.description,
      occurredAt: form.occurredAt,
      resolvedAt:
        form.status === "RESOLVED"
          ? form.resolvedAt || new Date().toISOString().slice(0, 16)
          : null,
    };

    try {
      if (editing) {
        await updateDowntimeEvent(editing.id, payload);
      } else {
        await createDowntimeEvent(payload);
      }
      setOpen(false);
      await load(filters);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save event");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (event: DowntimeEvent) => {
    if (!canDelete) return;
    if (!confirm(`Delete “${event.faultReason}”?`)) return;

    setError("");
    try {
      await deleteDowntimeEvent(event.id);
      await load(filters);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Could not delete event",
      );
    }
  };

  const clearFilters = () => {
    setFilters({});
    void load({});
  };

  const hasFilters = Object.values(filters).some(Boolean);
  const resultLabel = `${events.length} ${hasFilters ? "matching " : ""}${
    events.length === 1 ? "event" : "events"
  }`;

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Downtime</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Record production interruptions and review previous faults.
          </p>
        </div>
        <button
          type="button"
          onClick={() => begin()}
          className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          New event
        </button>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (
            filters.start &&
            filters.end &&
            new Date(filters.start).getTime() > new Date(filters.end).getTime()
          ) {
            setError("Start date cannot be after end date");
            return;
          }
          void load(filters);
        }}
        className="mt-7 overflow-hidden rounded-lg border border-slate-200 bg-white"
      >
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <label htmlFor="fault-search" className="text-sm font-medium text-slate-900">
            Search records
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <input
                id="fault-search"
                type="search"
                value={filters.q ?? ""}
                onChange={(event) => setFilters({ ...filters, q: event.target.value })}
                className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-11 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Fault reason or description"
              />
            </div>
            <button className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
              Search
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 xl:grid-cols-5">
          <label className="text-sm font-medium text-slate-700">
            Machine
            <select
              value={filters.machineId ?? ""}
              onChange={(event) =>
                setFilters({ ...filters, machineId: event.target.value })
              }
              className={fieldClass}
            >
              <option value="">All machines</option>
              {machines.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Production line
            <select
              value={filters.productionLineId ?? ""}
              onChange={(event) =>
                setFilters({ ...filters, productionLineId: event.target.value })
              }
              className={fieldClass}
            >
              <option value="">All lines</option>
              {productionLines.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            Status
            <select
              value={filters.status ?? ""}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  status: event.target.value as DowntimeFilters["status"],
                })
              }
              className={fieldClass}
            >
              <option value="">Any status</option>
              <option value="OPEN">Open</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            From
            <input
              type="datetime-local"
              value={filters.start ?? ""}
              onChange={(event) => setFilters({ ...filters, start: event.target.value })}
              className={fieldClass}
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            To
            <input
              type="datetime-local"
              value={filters.end ?? ""}
              onChange={(event) => setFilters({ ...filters, end: event.target.value })}
              className={fieldClass}
            />
          </label>
        </div>

        <div className="flex justify-end border-t border-slate-100 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="text-sm font-medium text-blue-700 disabled:text-slate-300"
          >
            Clear all filters
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">Fault history</h2>
            <p className="mt-0.5 text-xs text-slate-500">{loading ? "Searching…" : resultLabel}</p>
          </div>
          {hasFilters && !loading && (
            <span className="text-xs text-slate-500">Filters applied</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-medium text-slate-500">
              <tr>
                <th className="px-5 py-4">Fault details</th>
                <th className="px-5 py-4">Machine context</th>
                <th className="px-5 py-4">Timeline</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((event) => (
                <tr key={event.id} className="align-top transition hover:bg-slate-50/80">
                  <td className="max-w-md px-5 py-5">
                    <p className="font-semibold text-slate-900">{event.faultReason}</p>
                    <p className="mt-1.5 whitespace-pre-wrap break-words text-xs leading-5 text-slate-500">
                      {event.description || "No repair notes or description recorded."}
                    </p>
                  </td>
                  <td className="px-5 py-5">
                    <p className="font-medium text-slate-900">{event.machine.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {event.machine.productionLine?.name ?? "No production line"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {event.machine.productionLine?.department?.name ?? "No department"}
                    </p>
                  </td>
                  <td className="px-5 py-5 text-slate-500">
                    <p>{formatDate(event.occurredAt)}</p>
                    <p className="mt-1 text-xs">
                      {event.resolvedAt ? `Resolved ${formatDate(event.resolvedAt)}` : "Not resolved"}
                    </p>
                    <p className="mt-1.5 text-xs font-semibold text-slate-700">
                      {formatDuration(event)}
                    </p>
                  </td>
                  <td className="px-5 py-5">
                    <span
                      className={`rounded border px-2 py-0.5 text-xs font-medium ${
                        event.status === "OPEN"
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-emerald-200 bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      {event.status === "OPEN" ? "Open" : "Resolved"}
                    </span>
                  </td>
                  <td className="px-5 py-5 text-right">
                    <button
                      onClick={() => begin(event)}
                      className="mr-3 font-medium text-blue-700 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => void remove(event)}
                        className="font-medium text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !events.length && (
          <div className="px-6 py-14 text-center">
            <p className="font-semibold text-slate-800">No downtime events found</p>
            <p className="mt-1 text-sm text-slate-500">
              {hasFilters
                ? "Try a broader search or remove one of the filters."
                : "Log the first event to begin building maintenance history."}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-4 text-sm font-medium text-blue-700">
                Reset search
              </button>
            )}
          </div>
        )}

        {loading && <div className="p-12 text-center text-sm text-slate-500">Loading events…</div>}
      </section>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <form
            onSubmit={save}
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{editing ? "Edit event" : "New downtime event"}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Keep the event open until the machine is back in service.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close event form"
                className="rounded p-1 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            {error && (
              <p role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Machine
                <select
                  required
                  value={form.machineId}
                  onChange={(event) => setForm({ ...form, machineId: event.target.value })}
                  className={fieldClass}
                >
                  <option value="">Select machine</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Fault reason
                <input
                  required
                  value={form.faultReason}
                  onChange={(event) => setForm({ ...form, faultReason: event.target.value })}
                  className={fieldClass}
                  placeholder="e.g. Conveyor motor overload"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Occurred at
                <input
                  required
                  type="datetime-local"
                  value={form.occurredAt}
                  onChange={(event) => setForm({ ...form, occurredAt: event.target.value })}
                  className={fieldClass}
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Event status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value as "OPEN" | "RESOLVED",
                      resolvedAt: event.target.value === "OPEN" ? "" : form.resolvedAt,
                    })
                  }
                  className={fieldClass}
                >
                  <option value="OPEN">Open — still down</option>
                  <option value="RESOLVED">Resolved — back in service</option>
                </select>
              </label>

              {form.status === "RESOLVED" && (
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                  Resolved at
                  <input
                    required
                    type="datetime-local"
                    value={form.resolvedAt}
                    onChange={(event) => setForm({ ...form, resolvedAt: event.target.value })}
                    className={fieldClass}
                  />
                </label>
              )}

              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Description
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className={fieldClass}
                  placeholder="Record symptoms, observations, and repair notes for future reference."
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save event"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
