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

const fieldClass =
  "mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500";

const formatCreatedAt = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unavailable"
    : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
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
    if (!window.confirm(`Delete ${selected.displayName}'s account? This cannot be undone.`)) {
      return;
    }

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
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Users</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Administrators manage plant settings. Technicians manage downtime records.
          </p>
        </div>
        <button
          type="button"
          onClick={() => begin()}
          className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add user
        </button>
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

      <section className="mt-7 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Application accounts</h2>
          <p className="text-xs text-slate-500">
            {loading ? "Loading…" : `${users.length} ${users.length === 1 ? "user" : "users"}`}
          </p>
        </div>

        <div className="hidden grid-cols-[minmax(180px,1.5fr)_1fr_1fr_1fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-medium text-slate-500 md:grid">
          <span>User</span>
          <span>Username</span>
          <span>Role</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>

        {loading ? (
          <div className="px-5 py-14 text-center text-sm text-slate-500">Loading users…</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((listedUser) => {
              const isCurrent = listedUser.id === currentUser?.id;
              return (
                <article
                  key={listedUser.id}
                  className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(180px,1.5fr)_1fr_1fr_1fr_auto] md:items-center md:gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-950">{listedUser.displayName}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Added {formatCreatedAt(listedUser.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm text-slate-600">@{listedUser.username}</p>
                  <p className="text-sm text-slate-600">
                    {listedUser.role === "ADMIN" ? "Administrator" : "Technician"}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span
                      aria-hidden="true"
                      className={`size-1.5 rounded-full ${listedUser.enabled ? "bg-emerald-500" : "bg-slate-300"}`}
                    />
                    {listedUser.enabled ? "Active" : "Disabled"}
                    {isCurrent && <span className="text-xs text-slate-400">(you)</span>}
                  </div>
                  <div className="flex items-center gap-3 text-sm md:justify-end">
                    <button
                      type="button"
                      onClick={() => begin(listedUser)}
                      className="font-medium text-blue-700 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(listedUser)}
                      disabled={isCurrent}
                      title={isCurrent ? "You cannot delete your current account" : undefined}
                      className="font-medium text-red-600 hover:text-red-800 disabled:text-slate-300"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !users.length && (
          <div className="px-5 py-14 text-center text-sm text-slate-500">
            No user accounts found.
          </div>
        )}
      </section>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <form
            onSubmit={save}
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {editing ? "Edit user" : "Add user"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Set the account details and level of access.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close user form"
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
                Username
                <input
                  required
                  disabled={Boolean(editing)}
                  autoComplete="off"
                  maxLength={80}
                  pattern="[A-Za-z0-9._-]+"
                  value={form.username}
                  onChange={(event) => setForm({ ...form, username: event.target.value })}
                  className={fieldClass}
                />
                {editing && (
                  <span className="mt-1 block text-xs font-normal text-slate-400">
                    Usernames cannot be changed.
                  </span>
                )}
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Display name
                <input
                  required
                  maxLength={120}
                  value={form.displayName}
                  onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                  className={fieldClass}
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                {editing ? "New password" : "Password"}
                <input
                  required={!editing}
                  type="password"
                  autoComplete="new-password"
                  minLength={form.password ? 8 : undefined}
                  maxLength={72}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  className={fieldClass}
                  placeholder={editing ? "Leave blank to keep current password" : "At least 8 characters"}
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Role
                <select
                  value={form.role}
                  disabled={editing?.id === currentUser?.id}
                  onChange={(event) =>
                    setForm({ ...form, role: event.target.value as UserRole })
                  }
                  className={fieldClass}
                >
                  <option value="TECHNICIAN">Technician</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </label>

              {editing && (
                <label
                  className={`flex items-start gap-3 rounded-md border p-4 ${
                    editing.id === currentUser?.id
                      ? "border-slate-200 bg-slate-50"
                      : "border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    disabled={editing.id === currentUser?.id}
                    onChange={(event) =>
                      setForm({ ...form, enabled: event.target.checked })
                    }
                    className="mt-0.5 size-4 accent-blue-600"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-800">Account enabled</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      Disabled users cannot sign in. Your current account stays enabled.
                    </span>
                  </span>
                </label>
              )}
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
                {saving ? "Saving…" : editing ? "Save user" : "Create user"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
