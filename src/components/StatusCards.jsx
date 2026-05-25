const CARDS = [
  {
    id: 'response',
    label: 'Response Teams',
    value: '12',
    unit: 'deployed',
    status: 'online',
    color: 'cyan',
  },
  {
    id: 'shelters',
    label: 'Shelters Open',
    value: '8',
    unit: 'facilities',
    status: 'available',
    color: 'emerald',
  },
  {
    id: 'alerts',
    label: 'Live Alerts',
    value: '24',
    unit: 'broadcasting',
    status: 'active',
    color: 'amber',
  },
  {
    id: 'coverage',
    label: 'Geo Coverage',
    value: '94%',
    unit: 'mapped',
    status: 'stable',
    color: 'violet',
  },
];

const colorMap = {
  cyan: 'border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)]',
  emerald: 'border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.15)]',
  amber: 'border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.15)]',
  violet: 'border-violet-500/30 text-violet-400 shadow-[0_0_15px_rgba(167,139,250,0.15)]',
};

export default function StatusCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((card) => (
        <div
          key={card.id}
          className={`group rounded-2xl border bg-zinc-950/50 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-zinc-900/60 ${colorMap[card.color]}`}
        >
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              {card.label}
            </p>
            <span className="flex items-center gap-1.5 text-[10px] uppercase text-zinc-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-80" />
              {card.status}
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold">{card.value}</p>
          <p className="mt-1 text-xs text-zinc-500">{card.unit}</p>
        </div>
      ))}
    </div>
  );
}
