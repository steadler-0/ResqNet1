export default function HeatmapPlaceholder() {
  const cells = Array.from({ length: 64 }, (_, i) => {
    const intensity = Math.sin(i * 0.5) * 0.5 + 0.5;
    return intensity;
  });

  return (
    <div className="rn-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-primary">Severity Heatmap</h3>
          <p className="text-xs text-secondary">Severity density · Placeholder</p>
        </div>
        <span className="animate-pulse rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-[10px] text-secondary">
          LIVE PREVIEW
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-primary/10 bg-slate-muted p-4">
        <div className="grid grid-cols-8 gap-1">
          {cells.map((intensity, i) => (
            <div
              key={i}
              className="aspect-square rounded-sm transition-all duration-500 hover:scale-110"
              style={{
                backgroundColor: `rgba(84, 122, 149, ${intensity * 0.7})`,
                boxShadow:
                  intensity > 0.6 ? `0 0 8px rgba(84, 122, 149, ${intensity * 0.5})` : 'none',
              }}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex justify-between text-[10px] text-zinc-600">
          <span>Low density</span>
          <span className="text-secondary">→</span>
          <span className="text-primary font-medium">High severity</span>
        </div>
      </div>
    </div>
  );
}
