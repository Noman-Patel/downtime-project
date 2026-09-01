"use client";

import { useEffect, useState, type ReactNode } from "react";
import { resourceService } from "@/services/resourceService";
import type { Department, DowntimeReason, ProductionLine } from "@/types";

type Editor =
  | { kind: "department"; item?: Department }
  | { kind: "line"; item?: ProductionLine }
  | { kind: "reason"; item?: DowntimeReason }
  | null;

const emptyDepartment = { name: "", description: "", location: "" };
const emptyLine = { name: "", location: "", departmentId: "" };
const emptyReason = { name: "", description: "", category: "", planned: false };

function SetupSection({ title, count, onAdd, addLabel, children }: { title: string; count: number; onAdd: () => void; addLabel: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-slate-100 p-5">
      <div className="flex items-center gap-2"><h2 className="font-bold">{title}</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{count}</span></div>
      <button onClick={onAdd} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white">+ {addLabel}</button>
    </div>
    <div className="divide-y divide-slate-100 p-5 pt-1">{children}</div>
  </section>;
}

function Actions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <div className="flex gap-3 text-xs"><button onClick={onEdit} className="font-semibold text-cyan-700">Edit</button><button onClick={onDelete} className="font-semibold text-rose-600">Delete</button></div>;
}

export function PlantSetupManager() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [reasons, setReasons] = useState<DowntimeReason[]>([]);
  const [editor, setEditor] = useState<Editor>(null);
  const [departmentForm, setDepartmentForm] = useState(emptyDepartment);
  const [lineForm, setLineForm] = useState(emptyLine);
  const [reasonForm, setReasonForm] = useState(emptyReason);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [nextDepartments, nextLines, nextReasons] = await Promise.all([
        resourceService.departments(),
        resourceService.productionLines(),
        resourceService.downtimeReasons(),
      ]);
      setDepartments(nextDepartments);
      setLines(nextLines);
      setReasons(nextReasons);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load plant setup");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const openDepartment = (item?: Department) => {
    setDepartmentForm(item ? { name: item.name, description: item.description ?? "", location: item.location ?? "" } : emptyDepartment);
    setEditor({ kind: "department", item });
  };
  const openLine = (item?: ProductionLine) => {
    setLineForm(item ? { name: item.name, location: item.location ?? "", departmentId: String(item.department.id) } : emptyLine);
    setEditor({ kind: "line", item });
  };
  const openReason = (item?: DowntimeReason) => {
    setReasonForm(item ? { name: item.name, description: item.description ?? "", category: item.category ?? "", planned: item.planned } : emptyReason);
    setEditor({ kind: "reason", item });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editor) return;
    setSaving(true);
    setError("");
    try {
      if (editor.kind === "department") {
        editor.item ? await resourceService.updateDepartment(editor.item.id, departmentForm) : await resourceService.createDepartment(departmentForm);
      }
      if (editor.kind === "line") {
        const department = departments.find((item) => item.id === Number(lineForm.departmentId));
        if (!department) throw new Error("Select a department for this production line");
        const payload = { name: lineForm.name, location: lineForm.location, department };
        editor.item ? await resourceService.updateProductionLine(editor.item.id, payload) : await resourceService.createProductionLine(payload);
      }
      if (editor.kind === "reason") {
        editor.item ? await resourceService.updateDowntimeReason(editor.item.id, reasonForm) : await resourceService.createDowntimeReason(reasonForm);
      }
      setNotice(`${editor.item ? "Updated" : "Created"} successfully`);
      setEditor(null);
      await load();
      window.setTimeout(() => setNotice(""), 3000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save changes");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (kind: "department" | "line" | "reason", id: number, name: string) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    setError("");
    try {
      if (kind === "department") await resourceService.deleteDepartment(id);
      if (kind === "line") await resourceService.deleteProductionLine(id);
      if (kind === "reason") await resourceService.deleteDowntimeReason(id);
      setNotice(`${name} deleted`);
      await load();
      window.setTimeout(() => setNotice(""), 3000);
    } catch (cause) {
      const fallback = "This item may still be assigned elsewhere. Remove those assignments before deleting it.";
      setError(cause instanceof Error && !cause.message.startsWith("Request failed") ? cause.message : fallback);
    }
  };

  return <div className="mx-auto max-w-7xl">
    <div><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-700">Reference data</p><h1 className="mt-2 text-3xl font-bold">Plant setup</h1><p className="mt-2 text-sm text-slate-500">Manage the structure and classifications used throughout downtime tracking.</p></div>
    {notice && <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">✓ {notice}</div>}
    {error && <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
    {loading ? <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-16 text-center text-sm text-slate-500">Loading plant setup…</div> : <div className="mt-8 grid gap-6 xl:grid-cols-3">
      <SetupSection title="Departments" count={departments.length} onAdd={() => openDepartment()} addLabel="Department">
        {departments.map((item) => <div key={item.id} className="py-4"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.location || item.description || "No details"}</p></div><Actions onEdit={() => openDepartment(item)} onDelete={() => void remove("department", item.id, item.name)} /></div></div>)}
        {!departments.length && <p className="py-10 text-center text-sm text-slate-400">No departments yet</p>}
      </SetupSection>
      <SetupSection title="Production lines" count={lines.length} onAdd={() => openLine()} addLabel="Line">
        {lines.map((item) => <div key={item.id} className="py-4"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.department.name} · {item.location || "No location"}</p></div><Actions onEdit={() => openLine(item)} onDelete={() => void remove("line", item.id, item.name)} /></div></div>)}
        {!lines.length && <p className="py-10 text-center text-sm text-slate-400">No production lines yet</p>}
      </SetupSection>
      <SetupSection title="Downtime reasons" count={reasons.length} onAdd={() => openReason()} addLabel="Reason">
        {reasons.map((item) => <div key={item.id} className="py-4"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.category || "Uncategorized"}</p><span className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-bold ${item.planned ? "bg-cyan-50 text-cyan-700" : "bg-amber-50 text-amber-700"}`}>{item.planned ? "PLANNED" : "UNPLANNED"}</span></div><Actions onEdit={() => openReason(item)} onDelete={() => void remove("reason", item.id, item.name)} /></div></div>)}
        {!reasons.length && <p className="py-10 text-center text-sm text-slate-400">No downtime reasons yet</p>}
      </SetupSection>
    </div>}
    {editor && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"><form onSubmit={save} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">{editor.item ? "Edit" : "Add"} {editor.kind === "department" ? "department" : editor.kind === "line" ? "production line" : "downtime reason"}</h2><p className="mt-1 text-sm text-slate-500">These values will be available across the application.</p></div><button type="button" onClick={() => setEditor(null)} className="text-2xl text-slate-400">×</button></div>
      {editor.kind === "department" && <div className="mt-6 space-y-4"><label className="block text-sm font-medium">Name<input required value={departmentForm.name} onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 p-3" /></label><label className="block text-sm font-medium">Location<input value={departmentForm.location} onChange={(e) => setDepartmentForm({ ...departmentForm, location: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 p-3" /></label><label className="block text-sm font-medium">Description<textarea rows={3} value={departmentForm.description} onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 p-3" /></label></div>}
      {editor.kind === "line" && <div className="mt-6 space-y-4"><label className="block text-sm font-medium">Name<input required value={lineForm.name} onChange={(e) => setLineForm({ ...lineForm, name: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 p-3" /></label><label className="block text-sm font-medium">Department<select required value={lineForm.departmentId} onChange={(e) => setLineForm({ ...lineForm, departmentId: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 p-3"><option value="">Select department</option>{departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="block text-sm font-medium">Location<input value={lineForm.location} onChange={(e) => setLineForm({ ...lineForm, location: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 p-3" /></label></div>}
      {editor.kind === "reason" && <div className="mt-6 space-y-4"><label className="block text-sm font-medium">Name<input required value={reasonForm.name} onChange={(e) => setReasonForm({ ...reasonForm, name: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 p-3" /></label><label className="block text-sm font-medium">Category<input value={reasonForm.category} onChange={(e) => setReasonForm({ ...reasonForm, category: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 p-3" placeholder="e.g. Mechanical" /></label><label className="block text-sm font-medium">Description<textarea rows={3} value={reasonForm.description} onChange={(e) => setReasonForm({ ...reasonForm, description: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 p-3" /></label><label className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-medium"><input type="checkbox" checked={reasonForm.planned} onChange={(e) => setReasonForm({ ...reasonForm, planned: e.target.checked })} className="size-4" />This is planned downtime</label></div>}
      <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setEditor(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button><button disabled={saving} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save changes"}</button></div>
    </form></div>}
  </div>;
}
