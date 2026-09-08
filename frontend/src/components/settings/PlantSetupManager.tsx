"use client";

import { useEffect, useState, type ReactNode } from "react";
import { resourceService } from "@/services/resourceService";
import type { Department, ProductionLine } from "@/types";

type Editor =
  | { kind: "department"; item?: Department }
  | { kind: "line"; item?: ProductionLine }
  | null;

const emptyDepartment = { name: "", description: "", location: "" };
const emptyLine = { name: "", location: "", departmentId: "" };
const fieldClass =
  "mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function SetupSection({
  title,
  count,
  onAdd,
  addLabel,
  children,
}: {
  title: string;
  count: number;
  onAdd: () => void;
  addLabel: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{count} {count === 1 ? "record" : "records"}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Add {addLabel}
        </button>
      </div>
      <div className="divide-y divide-slate-100 px-5">{children}</div>
    </section>
  );
}

function Actions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-3 text-sm">
      <button type="button" onClick={onEdit} className="font-medium text-blue-700 hover:text-blue-900">
        Edit
      </button>
      <button type="button" onClick={onDelete} className="font-medium text-red-600 hover:text-red-800">
        Delete
      </button>
    </div>
  );
}

export function PlantSetupManager() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [editor, setEditor] = useState<Editor>(null);
  const [departmentForm, setDepartmentForm] = useState(emptyDepartment);
  const [lineForm, setLineForm] = useState(emptyLine);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [nextDepartments, nextLines] = await Promise.all([
        resourceService.departments(),
        resourceService.productionLines(),
      ]);
      setDepartments(nextDepartments);
      setLines(nextLines);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load plant setup");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openDepartment = (item?: Department) => {
    setError("");
    setDepartmentForm(
      item
        ? {
            name: item.name,
            description: item.description ?? "",
            location: item.location ?? "",
          }
        : emptyDepartment,
    );
    setEditor({ kind: "department", item });
  };

  const openLine = (item?: ProductionLine) => {
    setError("");
    setLineForm(
      item
        ? {
            name: item.name,
            location: item.location ?? "",
            departmentId: String(item.department.id),
          }
        : emptyLine,
    );
    setEditor({ kind: "line", item });
  };

  const save = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;
    setSaving(true);
    setError("");

    try {
      if (editor.kind === "department") {
        if (editor.item) {
          await resourceService.updateDepartment(editor.item.id, departmentForm);
        } else {
          await resourceService.createDepartment(departmentForm);
        }
      }

      if (editor.kind === "line") {
        const department = departments.find(
          (item) => item.id === Number(lineForm.departmentId),
        );
        if (!department) throw new Error("Select a department for this production line");
        const payload = {
          name: lineForm.name,
          location: lineForm.location,
          department,
        };
        if (editor.item) {
          await resourceService.updateProductionLine(editor.item.id, payload);
        } else {
          await resourceService.createProductionLine(payload);
        }
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

  const remove = async (
    kind: "department" | "line",
    id: number,
    name: string,
  ) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    setError("");
    try {
      if (kind === "department") await resourceService.deleteDepartment(id);
      if (kind === "line") await resourceService.deleteProductionLine(id);
      setNotice(`${name} deleted`);
      await load();
      window.setTimeout(() => setNotice(""), 3000);
    } catch (cause) {
      const fallback =
        "This item may still be assigned elsewhere. Remove those assignments before deleting it.";
      setError(
        cause instanceof Error && !cause.message.startsWith("Request failed")
          ? cause.message
          : fallback,
      );
    }
  };

  const editorLabel = editor?.kind === "department" ? "department" : "production line";

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Plant setup</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Manage departments and the production lines assigned to them.
        </p>
      </div>

      {notice && (
        <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </div>
      )}
      {error && (
        <div role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-7 rounded-lg border border-slate-200 bg-white p-14 text-center text-sm text-slate-500">
          Loading plant setup…
        </div>
      ) : (
        <div className="mt-7 grid items-start gap-6 lg:grid-cols-2">
          <SetupSection
            title="Departments"
            count={departments.length}
            onAdd={() => openDepartment()}
            addLabel="department"
          >
            {departments.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.location || item.description || "No details"}
                  </p>
                </div>
                <Actions
                  onEdit={() => openDepartment(item)}
                  onDelete={() => void remove("department", item.id, item.name)}
                />
              </div>
            ))}
            {!departments.length && (
              <p className="py-10 text-center text-sm text-slate-500">No departments yet</p>
            )}
          </SetupSection>

          <SetupSection
            title="Production lines"
            count={lines.length}
            onAdd={() => openLine()}
            addLabel="line"
          >
            {lines.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.department.name} · {item.location || "No location"}
                  </p>
                </div>
                <Actions
                  onEdit={() => openLine(item)}
                  onDelete={() => void remove("line", item.id, item.name)}
                />
              </div>
            ))}
            {!lines.length && (
              <p className="py-10 text-center text-sm text-slate-500">No production lines yet</p>
            )}
          </SetupSection>
        </div>
      )}

      {editor && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <form onSubmit={save} className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {editor.item ? "Edit" : "Add"} {editorLabel}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  These details are used throughout the application.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditor(null)}
                aria-label="Close setup form"
                className="rounded p-1 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            {editor.kind === "department" && (
              <div className="mt-6 space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  Name
                  <input
                    required
                    value={departmentForm.name}
                    onChange={(event) =>
                      setDepartmentForm({ ...departmentForm, name: event.target.value })
                    }
                    className={fieldClass}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Location
                  <input
                    value={departmentForm.location}
                    onChange={(event) =>
                      setDepartmentForm({ ...departmentForm, location: event.target.value })
                    }
                    className={fieldClass}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Description
                  <textarea
                    rows={3}
                    value={departmentForm.description}
                    onChange={(event) =>
                      setDepartmentForm({ ...departmentForm, description: event.target.value })
                    }
                    className={fieldClass}
                  />
                </label>
              </div>
            )}

            {editor.kind === "line" && (
              <div className="mt-6 space-y-4">
                <label className="block text-sm font-medium text-slate-700">
                  Name
                  <input
                    required
                    value={lineForm.name}
                    onChange={(event) =>
                      setLineForm({ ...lineForm, name: event.target.value })
                    }
                    className={fieldClass}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Department
                  <select
                    required
                    value={lineForm.departmentId}
                    onChange={(event) =>
                      setLineForm({ ...lineForm, departmentId: event.target.value })
                    }
                    className={fieldClass}
                  >
                    <option value="">Select department</option>
                    {departments.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Location
                  <input
                    value={lineForm.location}
                    onChange={(event) =>
                      setLineForm({ ...lineForm, location: event.target.value })
                    }
                    className={fieldClass}
                  />
                </label>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
