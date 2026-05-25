import { Droplets, HeartPulse, Home, Package, Users, Zap } from 'lucide-react';

const RESOURCES = [
  { name: 'Medical Kits', available: 142, total: 200, Icon: HeartPulse },
  { name: 'Rescue Boats', available: 6, total: 12, Icon: Package },
  { name: 'Emergency Shelters', available: 8, total: 10, Icon: Home },
  { name: 'Water Supply (L)', available: 45000, total: 60000, Icon: Droplets },
  { name: 'Volunteer Teams', available: 34, total: 50, Icon: Users },
  { name: 'Power Generators', available: 18, total: 25, Icon: Zap },
];

function formatValue(n) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n;
}

export default function ResourceCards() {
  return (
    <div className="rn-card">
      <h3 className="mb-1 text-lg font-bold text-primary">Resource Availability</h3>
      <p className="mb-5 text-xs text-muted">Real-time inventory across response zones</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {RESOURCES.map(({ name, available, total, Icon }) => {
          const pct = Math.round((available / total) * 100);
          return (
            <div
              key={name}
              className="rounded-xl border border-primary/8 bg-slate-muted p-4 transition hover:border-secondary/25 hover:shadow-soft"
            >
              <div className="flex items-center justify-between">
                <Icon size={20} className="text-secondary" strokeWidth={1.75} />
                <span
                  className={`text-xs font-bold ${
                    pct > 60 ? 'text-emerald-600' : pct > 30 ? 'text-amber-600' : 'text-red-600'
                  }`}
                >
                  {pct}%
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-primary">{name}</p>
              <p className="text-xs text-muted">
                {formatValue(available)} / {formatValue(total)} available
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/10">
                <div
                  className="h-full rounded-full bg-secondary transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
