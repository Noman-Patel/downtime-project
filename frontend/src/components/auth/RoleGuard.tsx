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
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
        Checking permissions…
      </div>
    );
  }

  if (!user || !allow.includes(user.role)) {
    return (
      <section className="mx-auto max-w-lg rounded-lg border border-slate-200 bg-white p-8">
        <p className="text-sm font-medium text-red-700">Access restricted</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-950">Administrator access required</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Your account can view plant data and manage downtime, but this area changes system configuration.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Return to dashboard
        </Link>
      </section>
    );
  }

  return children;
}
