"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { userService } from "@/services/userService";
import type { AppUser, UserRole } from "@/types";

type UserForm = {
  username: string;
  displayName: string;
  password: string;
  role: UserRole;
  enabled: boolean;
};

const blankForm: UserForm = {
  username: "",
  displayName: "",
  password: "",
  role: "TECHNICIAN",
  enabled: true,
};

const formatCreatedAt = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Creation date unavailable"
    : `Added ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date)}`;
};

export function UserManager() {
  const { user: currentUser, refreshUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [form, setForm] = useState<UserForm>(blankForm);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await userService.all());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const begin = (selected?: AppUser) => {
    setError("");
    setEditing(selected ?? null);
    setForm(
      selected
        ? {
            username: selected.username,
            displayName: selected.displayName,
            password: "",
            role: selected.role,
            enabled: selected.enabled,
          }
        : blankForm,
    );
    setOpen(true);
  };

  const save = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editing) {
        await userService.update(editing.id, {
          displayName: form.displayName.trim(),
          role: form.role,
          enabled: form.enabled,
          ...(form.password ? { password: form.password } : {}),
        });
      } else {
        await userService.create({
          username: form.username.trim(),
          displayName: form.displayName.trim(),
          password: form.password,
          role: form.role,
        });
      }

      if (editing?.id === currentUser?.id) {
        await refreshUser();
      }
      setNotice(`${editing ? "Updated" : "Created"} ${form.displayName.trim()}`);
      setOpen(false);
      await load();
      window.setTimeout(() => setNotice(""), 3000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save user");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (selected: AppUser) => {
    if (selected.id === currentUser?.id) return;
    if (!window.confirm(`Delete ${selected.displayName}'s account? This cannot be undone.`)) return;

    setError("");
    try {
      await userService.delete(selected.id);
      setNotice(`${selected.displayName} deleted`);
      await load();
      window.setTimeout(() => setNotice(""), 3000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete user");
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-700">Access control</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Users</h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage who can access plant data and which actions they can perform.
          </p>
        </div>
        <button
          type="button"
          onClick={() => begin()}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          + Add user
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">
          <p className="font-semibold">Administrators</p>
          <p className="mt-1 text-xs leading-5 text-cyan-800">Manage users, plant structure, machines, and all downtime records.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <p className="font-semibold">Technicians</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">View plant data and create, update, resolve, or search downtime events.</p>
        </div>
      </div>

      {notice && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          ✓ {notice}
        </div>
      )}
      {error && (
        <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">Application accounts</h2>
            <p className="mt-1 text-xs text-slate-500">{loading ? "Loading…" : `${users.length} ${users.length === 1 ? "user" : "users"}`}</p>
          </div>
        </div>

        {loading ? (
          <div className="p-14 text-center text-sm text-slate-500">Loading users…</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((listedUser) => {
              const isCurrent = listedUser.id === currentUser?.id;
              return (
                <article key={listedUser.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">
                      {(listedUser.displayName || listedUser.username).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-slate-900">{listedUser.displayName}</h3>
                        {isCurrent && <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-800">YOU</span>}
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">@{listedUser.username}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{formatCreatedAt(listedUser.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${listedUser.role === "ADMIN" ? "bg-cyan-100 text-cyan-800" : "bg-slate-100 text-slate-700"}`}>
                      {listedUser.role}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${listedUser.enabled ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"}`}>
                      {listedUser.enabled ? "ACTIVE" : "DISABLED"}
                    </span>
                    <button type="button" onClick={() => begin(listedUser)} className="text-sm font-semibold text-cyan-700">
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(listedUser)}
                      disabled={isCurrent}
                      title={isCurrent ? "You cannot delete your current account" : undefined}
                      className="text-sm font-semibold text-rose-600 disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
            {!users.length && (
              <div className="p-14 text-center text-sm text-slate-500">No user accounts found.</div>
            )}
          </div>
        )}
      </section>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{editing ? "Edit user" : "Add user"}</h2>
                <p className="mt-1 text-sm text-slate-500">Assign the minimum access needed for this account.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close user form" className="text-2xl text-slate-400">×</button>
            </div>

            {error && (
              <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
            )}

            <div className="mt-6 space-y-4">
              <label className="block text-sm font-medium">
                Username
                <input
                  required
                  disabled={Boolean(editing)}
                  autoComplete="off"
                  maxLength={80}
                  pattern="[A-Za-z0-9._-]+"
                  value={form.username}
                  onChange={(event) => setForm({ ...form, username: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3 disabled:bg-slate-100 disabled:text-slate-500"
                />
                {editing && <span className="mt-1 block text-xs font-normal text-slate-400">Usernames cannot be changed.</span>}
              </label>
              <label className="block text-sm font-medium">
                Display name
                <input
                  required
                  maxLength={120}
                  value={form.displayName}
                  onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3"
                />
              </label>
              <label className="block text-sm font-medium">
                {editing ? "New password" : "Password"}
                <input
                  required={!editing}
                  type="password"
                  autoComplete="new-password"
                  minLength={form.password ? 8 : undefined}
                  maxLength={72}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3"
                  placeholder={editing ? "Leave blank to keep current password" : "Enter a temporary password"}
                />
              </label>
              <label className="block text-sm font-medium">
                Role
                <select
                  value={form.role}
                  disabled={editing?.id === currentUser?.id}
                  onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 disabled:bg-slate-100"
                >
                  <option value="TECHNICIAN">Technician</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </label>
              {editing && (
                <label className={`flex items-start gap-3 rounded-xl border p-4 ${editing.id === currentUser?.id ? "border-slate-100 bg-slate-50" : "border-slate-200"}`}>
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    disabled={editing.id === currentUser?.id}
                    onChange={(event) => setForm({ ...form, enabled: event.target.checked })}
                    className="mt-0.5 size-4 accent-cyan-600"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">Account enabled</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      Disabled users cannot sign in. Your current account stays enabled.
                    </span>
                  </span>
                </label>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button>
              <button disabled={saving} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? "Saving…" : editing ? "Save user" : "Create user"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
