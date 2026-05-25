const METRICS = [
  { label: 'Avg Response Time', value: '4.2 min', trend: '-12%' },
  { label: 'Resolved Today', value: '47', trend: '+8%' },
  { label: 'Citizens Reached', value: '12.4k', trend: '+23%' },
  { label: 'Coverage Zones', value: '18', trend: 'stable' },
];

export default function AnalyticsDashboard({ alerts = [] }) {
  return (
    <div className="rn-card">
      <h3 className="mb-1 text-lg font-bold text-primary">Live Analytics</h3>
      <p className="mb-5 text-xs text-secondary">Command center metrics · Placeholder dashboard</p>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-primary/10 bg-slate-muted p-3 transition hover:border-secondary/30"
          >
            <p className="text-[10px] uppercase tracking-wider text-secondary">{m.label}</p>
            <p className="mt-1 text-xl font-bold text-secondary">{m.value}</p>
            <p className="text-[10px] text-emerald-400/80">{m.trend}</p>
          </div>
        ))}
      </div>

      {/* Mini chart placeholder */}
      <div className="flex h-24 items-end justify-between gap-1 rounded-xl border border-primary/10 bg-slate-muted px-4 pb-2 pt-4">
        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
          <div
            key={i}
            className="w-full max-w-[20px] rounded-t bg-gradient-to-t from-secondary to-secondary-light transition-all duration-500 hover:from-secondary hover:to-secondary-light"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>

      {alerts.length > 0 && (
        <div className="mt-4 max-h-32 space-y-2 overflow-y-auto">
          <p className="text-xs font-semibold uppercase text-zinc-500">Recent Alerts</p>
          {alerts.slice(-3).reverse().map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-zinc-300">
                {a.type} — {a.severity} at {a.latitude?.toFixed(4)}, {a.longitude?.toFixed(4)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
