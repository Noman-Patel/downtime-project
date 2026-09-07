"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { UserRole } from "@/types";

export function RoleGuard({
  allow,
  children,
}: {
  allow: UserRole[];
  children: ReactNode;
}) {
  const { user, status } = useAuth();

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200 bg-white p-16 text-center text-sm text-slate-500">
        Checking permissions…
      </div>
    );
  }

  if (!user || !allow.includes(user.role)) {
    return (
      <section className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-amber-100 text-xl" aria-hidden="true">
          🔒
        </div>
        <h1 className="mt-4 text-xl font-bold text-amber-950">Administrator access required</h1>
        <p className="mt-2 text-sm leading-6 text-amber-800">
          Your account can view plant data and manage downtime, but this area changes system configuration.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Return to dashboard
        </Link>
      </section>
    );
  }

  return children;
}
