"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnalyticsCard } from "@/components/dashboard/AnalyticsCard";
import {
  getDashboardSummary,
  getDowntimeByMachine,
} from "@/services/dashboardService";
import type { DashboardSummary, DowntimeByMachine } from "@/types";

const emptySummary: DashboardSummary = {
  totalDowntimeEvents: 0,
  openDowntimeEvents: 0,
  resolvedDowntimeEvents: 0,
  totalMachines: 0,
  totalDowntimeMinutes: 0,
};

export default function Home() {
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [machines, setMachines] = useState<DowntimeByMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      const results = await Promise.allSettled([
        getDashboardSummary(),
        getDowntimeByMachine(),
      ]);

      if (!active) return;

      setSummary(results[0].status === "fulfilled" ? results[0].value : emptySummary);
      setMachines(results[1].status === "fulfilled" ? results[1].value : []);
      setOffline(results.some((result) => result.status === "rejected"));
      setLoading(false);
    };

    void loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const mostActiveMachine = machines.reduce<DowntimeByMachine | undefined>(
    (current, machine) =>
      !current || machine.downtimeEvents > current.downtimeEvents ? machine : current,
    undefined,
  );

  const metrics = [
    {
      label: "Total events",
      value: summary.totalDowntimeEvents,
      note: "All recorded",
    },
    {
      label: "Open",
      value: summary.openDowntimeEvents,
      note: "Need attention",
      warning: summary.openDowntimeEvents > 0,
    },
    {
      label: "Resolved",
      value: summary.resolvedDowntimeEvents,
      note: "Closed events",
    },
    {
      label: "Downtime",
      value: summary.totalDowntimeMinutes,
      note: "Resolved minutes",
      suffix: " min",
    },
  ];

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Overview</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Current downtime activity across the plant.
          </p>
        </div>
        <Link
          href="/downtime?new=1"
          className="rounded-md bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Record downtime
        </Link>
      </div>

      {offline && (
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Live data could not be loaded. Check that the backend is running, then refresh this page.
        </div>
      )}

      <section className="mt-7 grid overflow-hidden rounded-lg border border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={`px-5 py-5 ${
              index > 0 ? "border-t border-slate-200 sm:border-l lg:border-t-0" : ""
            } ${index === 2 ? "sm:border-l-0 lg:border-l" : ""}`}
          >
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p
              className={`mt-2 text-3xl font-semibold tabular-nums tracking-tight ${
                metric.warning ? "text-amber-700" : "text-slate-950"
              } ${loading ? "animate-pulse text-slate-300" : ""}`}
            >
              {loading ? "—" : `${metric.value}${metric.suffix ?? ""}`}
            </p>
            <p className="mt-1.5 text-xs text-slate-400">{metric.note}</p>
          </div>
        ))}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <AnalyticsCard
          title="Events by machine"
          rows={machines.map((machine) => ({
            label: machine.machineName,
            value: machine.downtimeEvents,
          }))}
          valueKey="events"
        />

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Plant summary</h2>
          </div>
          <dl className="divide-y divide-slate-100 px-5">
            <div className="flex items-center justify-between gap-4 py-4">
              <dt className="text-sm text-slate-500">Registered machines</dt>
              <dd className="font-medium tabular-nums text-slate-900">
                {loading ? "—" : summary.totalMachines}
              </dd>
            </div>
            <div className="py-4">
              <dt className="text-sm text-slate-500">Most recorded events</dt>
              <dd className="mt-1 font-medium text-slate-900">
                {loading ? "Loading…" : mostActiveMachine?.machineName || "No event data"}
              </dd>
              {mostActiveMachine && (
                <p className="mt-1 text-xs text-slate-400">
                  {mostActiveMachine.downtimeEvents} events
                </p>
              )}
            </div>
            <div className="py-4">
              <dt className="text-sm text-slate-500">Open work</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {loading
                  ? "Loading…"
                  : summary.openDowntimeEvents
                    ? `${summary.openDowntimeEvents} events still need attention`
                    : "No open downtime events"}
              </dd>
            </div>
          </dl>
          <div className="border-t border-slate-200 px-5 py-4">
            <Link href="/machines" className="text-sm font-medium text-blue-700 hover:text-blue-900">
              View machine registry →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
