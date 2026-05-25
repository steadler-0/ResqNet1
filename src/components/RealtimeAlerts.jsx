import { getSubmittedTime, sortAlertsNewestFirst } from '../lib/sortAlerts';

const severityDot = {
  Low: 'bg-emerald-500',
  Medium: 'bg-amber-500',
  High: 'bg-orange-500',
  Critical: 'bg-red-500 animate-pulse',
};

export default function RealtimeAlerts({ alerts }) {
  const displayAlerts = sortAlertsNewestFirst(
    alerts.length > 0
      ? alerts
      : [
          {
            id: 'demo-1',
            type: 'Medical Emergency',
            severity: 'Critical',
            description: 'Multi-casualty incident — awaiting confirmation',
            submittedAt: new Date().toISOString(),
            timestamp: new Date().toISOString(),
          },
          {
            id: 'demo-2',
            type: 'Flood',
            severity: 'High',
            description: 'Street flooding reported near downtown',
            submittedAt: new Date(Date.now() - 120000).toISOString(),
            timestamp: new Date(Date.now() - 120000).toISOString(),
          },
        ]
  ).slice(0, 50);

  const newestTime = displayAlerts[0] ? getSubmittedTime(displayAlerts[0]) : 0;

  return (
    <div className="rn-card">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <h3 className="text-lg font-bold text-primary">Coordinator Feed — Live Geo Alerts</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-secondary">
          Latest alert on top
        </span>
      </div>

      <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
        {displayAlerts.map((alert, i) => {
          const isLatest = i === 0 && getSubmittedTime(alert) === newestTime;
          return (
            <div
              key={alert.id ?? `alert-${i}`}
              className={`group rounded-xl border p-4 transition-all duration-300 ${
                isLatest
                  ? 'border-secondary/50 bg-secondary/10 shadow-soft'
                  : 'border-primary/10 bg-slate-muted hover:border-secondary/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {isLatest && (
                    <span className="rounded border border-secondary/60 bg-secondary/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-secondary">
                      Latest
                    </span>
                  )}
                  <span
                    className={`h-2 w-2 rounded-full ${severityDot[alert.severity] || 'bg-secondary/50'}`}
                  />
                  <span className="font-semibold text-primary">{alert.type}</span>
                  {alert.sos && (
                    <span className="rounded border border-red-500/50 bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
                      SOS
                    </span>
                  )}
                  {alert.liveTracking && (
                  <span className="flex items-center gap-1 rounded border border-secondary/40 bg-secondary/10 px-1.5 py-0.5 text-[10px] font-bold text-secondary">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />
                      LIVE GPS
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-[10px] text-secondary">
                  {new Date(alert.submittedAt || alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {alert.description ? (
                <p className="mt-2 text-sm text-secondary">{alert.description}</p>
              ) : (
                <p className="mt-2 text-sm italic text-secondary">No description provided</p>
              )}
              {alert.latitude != null && (
                <p className="mt-1 font-mono text-[10px] text-secondary">
                  {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
                  {alert.accuracy != null && (
                    <span className="text-secondary"> · ±{Math.round(alert.accuracy)}m</span>
                  )}
                </p>
              )}
              {alert.locationUpdates > 1 && (
                <p className="mt-1 text-[10px] text-secondary">
                  ↻ GPS updated {alert.locationUpdates} times · submitted{' '}
                  {new Date(alert.submittedAt || alert.timestamp).toLocaleTimeString()}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
