"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { resourceService } from "@/services/resourceService";
import type { Machine, ProductionLine } from "@/types";

const blank = { name: "", type: "", location: "", productionLineId: "" };
const fieldClass =
  "mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export function MachineManager() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [machines, setMachines] = useState<Machine[]>([]);
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<Machine | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [nextMachines, nextLines] = await Promise.all([
        resourceService.machines(),
        isAdmin ? resourceService.productionLines() : Promise.resolve([]),
      ]);
      setMachines(nextMachines);
      setLines(nextLines);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load machines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [isAdmin]);

  const begin = (machine?: Machine) => {
    if (!isAdmin) return;
    setError("");
    setEditing(machine ?? null);
    setForm(
      machine
        ? {
            name: machine.name,
            type: machine.type ?? "",
            location: machine.location ?? "",
            productionLineId: String(machine.productionLine.id),
          }
        : blank,
    );
    setOpen(true);
  };

  const save = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdmin) return;

    const line = lines.find((item) => item.id === Number(form.productionLineId));
    if (!line) {
      setError("Select a production line for this machine");
      return;
    }

    setSaving(true);
    setError("");
    const body = {
      name: form.name,
      type: form.type,
      location: form.location,
      productionLine: line,
    };

    try {
      if (editing) {
        await resourceService.updateMachine(editing.id, body);
      } else {
        await resourceService.createMachine(body);
      }
      setOpen(false);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save machine");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (machine: Machine) => {
    if (!isAdmin) return;
    if (!window.confirm(`Delete ${machine.name}? This cannot be undone.`)) return;

    setError("");
    try {
      await resourceService.deleteMachine(machine.id);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete machine");
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Machines</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {isAdmin
              ? "Manage equipment and production-line assignments."
              : "View equipment details and fault history."}
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => begin()}
            className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add machine
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="mt-7 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="hidden grid-cols-[minmax(180px,1.5fr)_1fr_1fr_1fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-medium text-slate-500 md:grid">
          <span>Machine</span>
          <span>Type</span>
          <span>Production line</span>
          <span>Location</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="px-5 py-14 text-center text-sm text-slate-500">Loading machines…</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {machines.map((machine) => (
              <article
                key={machine.id}
                className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(180px,1.5fr)_1fr_1fr_1fr_auto] md:items-center md:gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-950">{machine.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400">Machine #{machine.id}</p>
                </div>
                <p className="text-sm text-slate-600">{machine.type || "Not specified"}</p>
                <p className="text-sm text-slate-600">{machine.productionLine.name}</p>
                <p className="text-sm text-slate-600">{machine.location || "—"}</p>
                <div className="flex items-center gap-3 text-sm md:justify-end">
                  <Link href={`/machines/${machine.id}`} className="font-medium text-blue-700 hover:text-blue-900">
                    History
                  </Link>
                  {isAdmin && (
                    <>
                      <button type="button" onClick={() => begin(machine)} className="font-medium text-slate-600 hover:text-slate-950">
                        Edit
                      </button>
                      <button type="button" onClick={() => void remove(machine)} className="font-medium text-red-600 hover:text-red-800">
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && !machines.length && !error && (
          <div className="px-5 py-14 text-center">
            <p className="text-sm font-medium text-slate-700">No machines registered</p>
            <p className="mt-1 text-sm text-slate-500">
              {isAdmin ? "Add a machine to start tracking its downtime." : "Ask an administrator to add equipment."}
            </p>
          </div>
        )}
      </section>

      {open && isAdmin && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <form onSubmit={save} className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{editing ? "Edit machine" : "Add machine"}</h2>
                <p className="mt-1 text-sm text-slate-500">Enter the equipment details and line assignment.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close machine form"
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

            <div className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Name
                <input
                  required
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className={fieldClass}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Type
                  <input
                    value={form.type}
                    onChange={(event) => setForm({ ...form, type: event.target.value })}
                    className={fieldClass}
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Location
                  <input
                    value={form.location}
                    onChange={(event) => setForm({ ...form, location: event.target.value })}
                    className={fieldClass}
                  />
                </label>
              </div>
              <label className="block text-sm font-medium text-slate-700">
                Production line
                <select
                  required
                  value={form.productionLineId}
                  onChange={(event) => setForm({ ...form, productionLineId: event.target.value })}
                  className={fieldClass}
                >
                  <option value="">Select line</option>
                  {lines.map((line) => (
                    <option key={line.id} value={line.id}>
                      {line.name} — {line.department.name}
                    </option>
                  ))}
                </select>
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
                {saving ? "Saving…" : "Save machine"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
