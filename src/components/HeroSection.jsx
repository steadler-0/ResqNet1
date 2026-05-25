export default function HeroSection({ activeIncidents, emergencyRequests }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-zinc-950/60 p-8 shadow-[0_0_40px_rgba(34,211,238,0.08)] backdrop-blur-xl transition-all duration-500 hover:border-cyan-400/40 md:p-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(34,211,238,0.12)_0%,_transparent_55%)]" />
      <div className="pointer-events-none absolute -left-20 top-0 h-40 w-40 rounded-full bg-cyan-500/5 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            Live Command Center
          </div>
          <h1 className="bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-4xl font-black tracking-tight text-transparent md:text-5xl lg:text-6xl">
            SentinelX
          </h1>
          <p className="mt-2 text-lg font-medium text-cyan-400/90 md:text-xl">
            Disaster Response Coordination Platform
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 md:text-base">
            Geo-tagged citizen emergency reporting, real-time incident tracking, and
            AI-assisted multilingual safety guidance — built for rapid community response.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-4">
          <div className="min-w-[140px] rounded-2xl border border-cyan-500/25 bg-black/50 px-6 py-4 text-center backdrop-blur-sm transition hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            <p className="text-3xl font-bold text-cyan-400">{activeIncidents}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">Active Incidents</p>
          </div>
          <div className="min-w-[140px] rounded-2xl border border-red-500/25 bg-black/50 px-6 py-4 text-center backdrop-blur-sm transition hover:border-red-400/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]">
            <p className="text-3xl font-bold text-red-400">{emergencyRequests}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">Emergency Requests</p>
          </div>
        </div>
      </div>
    </section>
  );
}
