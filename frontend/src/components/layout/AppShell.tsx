"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { UserRole } from "@/types";

type NavigationItem = {
  href: string;
  label: string;
  roles?: UserRole[];
};

const navigation: NavigationItem[] = [
  { href: "/", label: "Overview" },
  { href: "/downtime", label: "Downtime" },
  { href: "/machines", label: "Machines" },
  {
    href: "/settings",
    label: "Plant setup",
    roles: ["ADMIN"],
  },
  {
    href: "/users",
    label: "Users",
    roles: ["ADMIN"],
  },
];

function FullPageLoading({ label }: { label: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#f5f6f8] px-5 text-slate-700">
      <div className="text-center">
        <div className="mx-auto size-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
        <p className="mt-4 text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, status, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!isLoginPage && status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoginPage, pathname, router, status]);

  if (isLoginPage) return children;
  if (status === "loading") return <FullPageLoading label="Checking your session…" />;
  if (status === "unauthenticated" || !user) {
    return <FullPageLoading label="Taking you to sign in…" />;
  }

  const visibleNavigation = navigation.filter(
    (item) => !item.roles || item.roles.includes(user.role),
  );
  const active = (href: string) =>
    href === "/" ? pathname === href : pathname.startsWith(href);
  const signOut = async () => {
    setSigningOut(true);
    try {
      await logout();
    } catch {
      // The local session is cleared by AuthProvider even if the API is unreachable.
    } finally {
      router.replace("/login");
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="MECH overview">
            <span className="grid size-8 place-items-center rounded bg-slate-900 text-sm font-bold text-white">M</span>
            <span>
              <span className="block text-sm font-bold leading-none tracking-wide">MECH</span>
              <span className="mt-1 hidden text-[11px] leading-none text-slate-500 sm:block">Downtime tracking</span>
            </span>
          </Link>

          <nav className="hidden h-full items-center gap-1 md:flex" aria-label="Primary navigation">
            {visibleNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-full items-center border-b-2 px-3 text-sm font-medium transition-colors ${
                  active(item.href)
                    ? "border-blue-600 text-slate-950"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-3">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="max-w-44 truncate text-sm font-medium text-slate-800">{user.displayName}</p>
              <p className="mt-0.5 text-[11px] capitalize text-slate-500">{user.role.toLowerCase()}</p>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              disabled={signingOut}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto border-t border-slate-100 px-3 md:hidden" aria-label="Mobile navigation">
          {visibleNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium ${
                active(item.href)
                  ? "border-blue-600 text-slate-950"
                  : "border-transparent text-slate-500"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">{children}</main>
    </div>
  );
}
