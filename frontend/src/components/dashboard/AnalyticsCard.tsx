export function AnalyticsCard({ title, rows, valueKey }: { title: string; rows: { label: string; value: number }[]; valueKey: string }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-6">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">Events recorded for each machine</p>
      </div>
      {rows.length ? (
        <div className="space-y-4">
          {rows.slice(0, 6).map((row, index) => (
            <div key={`${row.label}-${index}`}>
              <div className="mb-1.5 flex justify-between gap-4 text-sm">
                <span className="truncate font-medium text-slate-700">{row.label || "Uncategorized"}</span>
                <span className="shrink-0 tabular-nums text-slate-500">{row.value} {valueKey}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max((row.value / max) * 100, 4)}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid h-40 place-items-center border-t border-slate-100 text-sm text-slate-500">
          No downtime data yet
        </div>
      )}
    </section>
  );
}
