export default function LoadingOverlay({ message = 'Initializing systems...' }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-primary/90 backdrop-blur-md">
      <div className="relative h-24 w-24">
        <div className="absolute inset-0 rounded-full border-2 border-secondary/30" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-secondary" />
        <div className="absolute inset-3 animate-pulse rounded-full bg-secondary/10" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold tracking-widest text-white">RN</span>
        </div>
      </div>
      <p className="mt-6 text-sm font-medium tracking-wide text-white/90">{message}</p>
      <div className="mt-4 flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-accent"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
