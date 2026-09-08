"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

const safeDestination = (value?: string) =>
  value?.startsWith("/") && !value.startsWith("//") && !value.startsWith("/login")
    ? value
    : "/";

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const { login, status } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const destination = safeDestination(nextPath);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(destination);
    }
  }, [destination, router, status]);

  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login({ username: username.trim(), password });
      router.replace(destination);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6f8] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="rounded-md bg-slate-900 px-3 py-2.5 text-xs font-bold tracking-[0.12em] text-white">
            MECH
          </div>
          <div>
            <p className="text-sm font-medium leading-none text-slate-700">Downtime tracking</p>
            <p className="mt-1 text-xs text-slate-500">Operations workspace</p>
          </div>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Sign in</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Use your plant account to continue.
          </p>

          {error && (
            <div role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Username
              <input
                required
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 font-normal text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <button
              disabled={submitting || status === "loading"}
              className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Signing in…" : status === "loading" ? "Checking session…" : "Sign in"}
            </button>
          </form>
        </section>

        <p className="mt-5 text-center text-xs text-slate-500">
          Contact an administrator if you need access.
        </p>
      </div>
    </main>
  );
}
