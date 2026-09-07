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
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-[minmax(0,1.05fr)_minmax(440px,.95fr)]">
      <section className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-32 top-24 size-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-36 right-0 size-[32rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-cyan-400 font-black text-slate-950">M</div>
          <div>
            <p className="font-bold tracking-wide">MECH</p>
            <p className="text-xs text-slate-400">Operations intelligence</p>
          </div>
        </div>
        <div className="relative max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-cyan-400">Maintenance knowledge</p>
          <h1 className="mt-5 text-5xl font-bold leading-tight tracking-tight">
            Every fault recorded today can solve a problem tomorrow.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            Track active downtime, search past incidents, and keep your plant’s maintenance experience in one place.
          </p>
        </div>
        <p className="relative text-xs text-slate-500">Manufacturing Execution &amp; Control Hub</p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-slate-50 p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid size-10 place-items-center rounded-xl bg-cyan-400 font-black text-slate-950">M</div>
            <p className="font-bold tracking-wide">MECH</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-700">Secure access</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in with your plant operations account.
            </p>

            {error && (
              <div role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="mt-7 space-y-5">
              <label className="block text-sm font-semibold text-slate-700">
                Username
                <input
                  required
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Password
                <input
                  required
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </label>
              <button
                disabled={submitting || status === "loading"}
                className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Signing in…" : status === "loading" ? "Checking session…" : "Sign in"}
              </button>
            </form>
          </div>
          <p className="mt-5 text-center text-xs text-slate-400">
            Contact an administrator if you need an account or role change.
          </p>
        </div>
      </section>
    </main>
  );
}
