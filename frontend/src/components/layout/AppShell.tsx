"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const nav = [
  ["/", "Overview", "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm8 0h8v-9h-8v9Zm0-16v5h8V4h-8Z"],
  ["/downtime", "Downtime", "M12 9v4m0 4h.01M10.3 3.8 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0Z"],
  ["/machines", "Machines", "M4 7h16v12H4V7Zm3 0V4h4v3m2 0V4h4v3M8 12h.01M12 12h.01M16 12h.01M8 16h8"],
  ["/settings", "Plant setup", "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-3.5a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.5 1a8 8 0 0 0-1.8-1L14.6 3h-4l-.4 2.7a8 8 0 0 0-1.8 1L5.9 5.8l-2 3.4L6 11a7 7 0 0 0 0 2l-2.1 1.7 2 3.4 2.5-1a8 8 0 0 0 1.8 1l.4 2.7h4l.4-2.7a8 8 0 0 0 1.8-1l2.5 1 2-3.4-2-1.7a7 7 0 0 0 .1-1Z"],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = (href: string) => href === "/" ? pathname === href : pathname.startsWith(href);
  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-800 bg-slate-950 text-white lg:block">
      <div className="flex h-20 items-center gap-3 border-b border-slate-800 px-6"><div className="grid size-10 place-items-center rounded-xl bg-cyan-400 font-black text-slate-950">M</div><div><p className="font-bold tracking-wide">MECH</p><p className="text-xs text-slate-400">Operations intelligence</p></div></div>
      <nav className="space-y-1 p-4">{nav.map(([href, label, path]) => <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${active(href) ? "bg-cyan-400 text-slate-950" : "text-slate-300 hover:bg-slate-900 hover:text-white"}`}><svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d={path} strokeLinecap="round" strokeLinejoin="round" /></svg>{label}</Link>)}</nav>
      <div className="absolute inset-x-4 bottom-5 rounded-xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs font-semibold text-emerald-400">● SYSTEM ONLINE</p><p className="mt-1 text-xs text-slate-400">Live plant monitoring</p></div>
    </aside>
    <div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur md:px-8"><Link href="/" className="font-bold lg:hidden">MECH</Link><div className="hidden text-sm text-slate-500 lg:block">Manufacturing Execution & Control Hub</div><div className="flex items-center gap-3"><span className="hidden text-sm text-slate-500 sm:inline">Operations Team</span><div className="grid size-9 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">OT</div></div></header>
      <main className="p-5 pb-24 md:p-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-slate-200 bg-white p-2 lg:hidden">{nav.map(([href,label,path]) => <Link key={href} href={href} className={`flex min-w-16 flex-col items-center gap-1 rounded-lg p-2 text-[10px] ${active(href) ? "text-cyan-700" : "text-slate-500"}`}><svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d={path} strokeLinecap="round" strokeLinejoin="round" /></svg>{label}</Link>)}</nav>
    </div>
  </div>;
}
