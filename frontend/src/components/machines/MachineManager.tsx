"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { resourceService } from "@/services/resourceService";
import type { Machine, ProductionLine } from "@/types";

const blank = { name: "", type: "", location: "", productionLineId: "" };

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
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-700">Asset registry</p>
          <h1 className="mt-2 text-3xl font-bold">Machines</h1>
          <p className="mt-2 text-sm text-slate-500">
            {isAdmin
              ? "Manage equipment and its production-line assignment."
              : "Review equipment details and open each machine’s fault history."}
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => begin()}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            + Add machine
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-16 text-center text-sm text-slate-500">
          Loading machines…
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {machines.map((machine) => (
            <article key={machine.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="grid size-12 place-items-center rounded-xl bg-slate-900 text-lg font-bold text-cyan-400">
                  {machine.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Registered</span>
              </div>
              <h2 className="mt-5 text-lg font-bold">{machine.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{machine.type || "Unspecified machine type"}</p>
              <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-xs">
                <div>
                  <dt className="text-slate-400">Production line</dt>
                  <dd className="mt-1 font-semibold text-slate-700">{machine.productionLine.name}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Location</dt>
                  <dd className="mt-1 font-semibold text-slate-700">{machine.location || "—"}</dd>
                </div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm">
                <Link href={`/machines/${machine.id}`} className="font-semibold text-slate-900">View fault history</Link>
                {isAdmin && (
                  <>
                    <button type="button" onClick={() => begin(machine)} className="font-semibold text-cyan-700">Edit</button>
                    <button type="button" onClick={() => void remove(machine)} className="font-semibold text-rose-600">Delete</button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !machines.length && !error && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-16 text-center text-sm text-slate-500">
          No machines registered yet.
        </div>
      )}

      {open && isAdmin && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex justify-between">
              <h2 className="text-xl font-bold">{editing ? "Edit machine" : "Add machine"}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close machine form" className="text-2xl text-slate-400">×</button>
            </div>
            {error && (
              <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
            )}
            <div className="mt-6 space-y-4">
              <label className="block text-sm font-medium">
                Name
                <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 p-3" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Type
                  <input value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 p-3" />
                </label>
                <label className="text-sm font-medium">
                  Location
                  <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 p-3" />
                </label>
              </div>
              <label className="block text-sm font-medium">
                Production line
                <select required value={form.productionLineId} onChange={(event) => setForm({ ...form, productionLineId: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3">
                  <option value="">Select line</option>
                  {lines.map((line) => (
                    <option key={line.id} value={line.id}>{line.name} — {line.department.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button>
              <button disabled={saving} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? "Saving…" : "Save machine"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
