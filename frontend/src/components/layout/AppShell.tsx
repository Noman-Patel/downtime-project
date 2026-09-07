"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import type { UserRole } from "@/types";

type NavigationItem = {
  href: string;
  label: string;
  path: string;
  roles?: UserRole[];
};

const navigation: NavigationItem[] = [
  {
    href: "/",
    label: "Overview",
    path: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm8 0h8v-9h-8v9Zm0-16v5h8V4h-8Z",
  },
  {
    href: "/downtime",
    label: "Downtime",
    path: "M12 9v4m0 4h.01M10.3 3.8 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z",
  },
  {
    href: "/machines",
    label: "Machines",
    path: "M4 7h16v12H4V7Zm3 0V4h4v3m2 0V4h4v3M8 12h.01M12 12h.01M16 12h.01M8 16h8",
  },
  {
    href: "/settings",
    label: "Plant setup",
    path: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-3.5a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.5 1a8 8 0 0 0-1.8-1L14.6 3h-4l-.4 2.7a8 8 0 0 0-1.8 1L5.9 5.8l-2 3.4L6 11a7 7 0 0 0 0 2l-2.1 1.7 2 3.4 2.5-1a8 8 0 0 0 1.8 1l.4 2.7h4l.4-2.7a8 8 0 0 0 1.8-1l2.5 1 2-3.4-2-1.7a7 7 0 0 0 .1-1Z",
    roles: ["ADMIN"],
  },
  {
    href: "/users",
    label: "Users",
    path: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87m-1-11.26a4 4 0 0 1 0 7.75",
    roles: ["ADMIN"],
  },
];

function FullPageLoading({ label }: { label: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 px-5 text-white">
      <div className="text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-cyan-400 text-xl font-black text-slate-950 shadow-lg shadow-cyan-400/10">
          M
        </div>
        <div className="mx-auto mt-6 h-1 w-32 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-cyan-400" />
        </div>
        <p className="mt-4 text-sm text-slate-400">{label}</p>
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
  const initials = (user.displayName || user.username)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-800 bg-slate-950 text-white lg:block">
        <div className="flex h-20 items-center gap-3 border-b border-slate-800 px-6">
          <div className="grid size-10 place-items-center rounded-xl bg-cyan-400 font-black text-slate-950">M</div>
          <div>
            <p className="font-bold tracking-wide">MECH</p>
            <p className="text-xs text-slate-400">Operations intelligence</p>
          </div>
        </div>
        <nav className="space-y-1 p-4" aria-label="Primary navigation">
          {visibleNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                active(item.href)
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d={item.path} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute inset-x-4 bottom-5 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-xs font-semibold text-emerald-400">● SESSION ACTIVE</p>
          <p className="mt-1 truncate text-xs text-slate-400">Signed in as {user.username}</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 py-2 backdrop-blur md:px-8">
          <Link href="/" className="font-bold lg:hidden">MECH</Link>
          <div className="hidden text-sm text-slate-500 lg:block">Manufacturing Execution &amp; Control Hub</div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-48 truncate text-sm font-semibold text-slate-800">{user.displayName}</p>
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-cyan-700">{user.role}</p>
            </div>
            <div className="grid size-9 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white" aria-hidden="true">
              {initials || "U"}
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              disabled={signingOut}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950 disabled:opacity-50"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </header>

        <main className="p-5 pb-24 md:p-8">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around overflow-x-auto border-t border-slate-200 bg-white p-2 lg:hidden" aria-label="Mobile navigation">
          {visibleNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-16 flex-col items-center gap-1 rounded-lg p-2 text-[10px] ${
                active(item.href) ? "text-cyan-700" : "text-slate-500"
              }`}
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d={item.path} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
