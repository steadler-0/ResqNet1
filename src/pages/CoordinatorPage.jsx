import { useState, useEffect } from 'react';
import { Check, MapPin, X } from 'lucide-react';
import { useLang } from '../lib/LanguageContext';
import { t } from '../lib/i18n';
import { DisasterIcon } from '../lib/iconMaps';
import { COORDINATOR_QUEUE } from '../data/rescueNetMock';
import { getAlerts, subscribeToAlerts, updateAlert } from '../lib/alertStore';
import { subscribeToLocationUpdates } from '../lib/coordinatorFeed';
import { sortAlertsNewestFirst } from '../lib/sortAlerts';

function mergeQueues(live, seed) {
  const ids = new Set(live.map((a) => a.id));
  return sortAlertsNewestFirst([...live, ...seed.filter((s) => !ids.has(s.id))]);
}

const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 };

const PRIORITY_STYLES = {
  Critical: {
    badge: 'bg-red-500/15 text-red-600 border-red-500/40',
    row: 'border-red-500/20 bg-red-500/4',
    dot: 'bg-red-500',
    header: 'border-red-500/30 bg-red-500/8 text-red-600',
    count: 'bg-red-500 text-white',
  },
  High: {
    badge: 'bg-orange-500/15 text-orange-600 border-orange-500/40',
    row: 'border-orange-500/15 bg-orange-500/4',
    dot: 'bg-orange-500',
    header: 'border-orange-500/25 bg-orange-500/8 text-orange-600',
    count: 'bg-orange-500 text-white',
  },
  Medium: {
    badge: 'bg-amber-500/15 text-amber-700 border-amber-500/40',
    row: 'border-amber-500/15 bg-amber-500/4',
    dot: 'bg-amber-500',
    header: 'border-amber-500/25 bg-amber-500/8 text-amber-700',
    count: 'bg-amber-500 text-white',
  },
  Low: {
    badge: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40',
    row: 'border-emerald-500/15 bg-emerald-500/4',
    dot: 'bg-emerald-500',
    header: 'border-emerald-500/25 bg-emerald-500/8 text-emerald-700',
    count: 'bg-emerald-500 text-white',
  },
};

const STATUS_BADGE = {
  Unassigned: 'bg-secondary/10 text-secondary border-secondary/30',
  'In Progress': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  Assigned: 'bg-violet-500/10 text-violet-600 border-violet-500/30',
  Resolved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  Monitoring: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
};

const RESPONDERS = [
  'Team Alpha', 'Team Bravo', 'NDRF Unit 1', 'NDRF Unit 2', 'NDRF Unit 3',
  'Relief Corps 1', 'Relief Corps 2', 'Health Team 1', 'Fire Unit 7',
];

export default function CoordinatorPage() {
  const { lang } = useLang();
  const [queue, setQueue] = useState(() => mergeQueues(getAlerts(), COORDINATOR_QUEUE));
  const [assignTarget, setAssignTarget] = useState(null);
  const [responderInput, setResponderInput] = useState('');
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    return subscribeToAlerts((live) => setQueue(mergeQueues(live, COORDINATOR_QUEUE)));
  }, []);

  /* Simulate real-time updates every 8s */
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker(n => n + 1);
      /* occasionally add a new critical alert */
      if (Math.random() < 0.2) {
        const types = ['Flood', 'Earthquake', 'Building Collapse', 'Medical Emergency', 'Cyclone'];
        const locs = ['Bihar, Patna', 'AP, Vijayawada', 'Gujarat, Surat', 'MP, Indore', 'UP, Varanasi'];
        const newAlert = {
          id: `live-${Date.now()}`,
          type: types[Math.floor(Math.random() * types.length)],
          location: locs[Math.floor(Math.random() * locs.length)],
          time: 'Just now',
          reporter: 'Citizen App',
          priority: Math.random() < 0.4 ? 'Critical' : 'High',
          status: 'Unassigned',
          description: 'Live citizen report — awaiting coordinator review',
          responder: null,
        };
        setQueue(prev => [newAlert, ...prev].slice(0, 30));
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  /* Subscribe to location updates from SOS page */
  useEffect(() => {
    return subscribeToLocationUpdates(update => {
      setLiveAlerts(prev => [update, ...prev].slice(0, 10));
    });
  }, []);

  const sortedQueue = [...queue].sort((a, b) =>
    (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
  );

  const byPriority = { Critical: [], High: [], Medium: [], Low: [] };
  sortedQueue.forEach(alert => {
    if (byPriority[alert.priority]) byPriority[alert.priority].push(alert);
  });

  const assignResponder = (alertId, responder) => {
    updateAlert(alertId, { responder, status: 'Assigned' });
    setAssignTarget(null);
    setResponderInput('');
  };

  const updateStatus = (alertId, status) => {
    updateAlert(alertId, { status });
  };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">Coordinator · Live Queue</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">{t(lang, 'coord_title')}</h1>
          <p className="mt-1 text-sm text-secondary">{t(lang, 'coord_subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-primary/10 bg-slate-surface px-3 py-2 text-xs text-secondary">
            {queue.length} total · {queue.filter(a => a.priority === 'Critical').length} critical
          </span>
          <span className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/8 px-3 py-2 text-xs font-semibold text-red-600">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
            Live Updates
          </span>
        </div>
      </div>

      {/* Live SOS Feed banner */}
      {liveAlerts.length > 0 && (
        <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/8 px-5 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Incoming SOS — Live GPS</span>
          </div>
          <p className="text-xs text-secondary">
            {liveAlerts[0].alertId} · {liveAlerts[0].latitude?.toFixed(4)}, {liveAlerts[0].longitude?.toFixed(4)} · {liveAlerts[0].coordinatorReceivedAt ? new Date(liveAlerts[0].coordinatorReceivedAt).toLocaleTimeString() : ''}
          </p>
        </div>
      )}

      {/* Priority Queues */}
      <div className="space-y-5">
        {Object.entries(byPriority).map(([priority, alerts]) => {
          const s = PRIORITY_STYLES[priority];
          return (
            <div key={priority}>
              {/* Section Header */}
              <div className={`mb-3 flex items-center gap-3 rounded-xl border px-4 py-2.5 ${s.header}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${s.dot} ${priority === 'Critical' ? 'animate-pulse' : ''}`} />
                <span className="text-sm font-bold uppercase tracking-wider">{t(lang, `coord_${priority.toLowerCase()}`)}</span>
                <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-black ${s.count}`}>{alerts.length}</span>
              </div>

              {alerts.length === 0 ? (
                <div className="rounded-xl border border-primary/5 bg-slate-muted/40 px-4 py-4 text-xs text-secondary text-center">
                  No {priority.toLowerCase()} alerts
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map(alert => (
                    <AlertRow
                      key={alert.id}
                      alert={alert}
                      lang={lang}
                      priorityStyle={s}
                      assignTarget={assignTarget}
                      setAssignTarget={setAssignTarget}
                      responderInput={responderInput}
                      setResponderInput={setResponderInput}
                      onAssign={assignResponder}
                      onStatusChange={updateStatus}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Coordinator Feed */}
      <div className="mt-8">
        <div className="rn-card">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
              <h3 className="text-sm font-bold text-primary">{t(lang, 'coord_feed_title')}</h3>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-secondary">{t(lang, 'coord_feed_latest')}</span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {sortedQueue.slice(0, 8).map((alert, i) => (
              <div key={alert.id}
                className={`rounded-xl border p-3 transition-all duration-200 ${PRIORITY_STYLES[alert.priority]?.row || 'border-primary/8 bg-slate-muted/30'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {i === 0 && (
                      <span className="rounded border border-secondary/60 bg-secondary/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-secondary">Latest</span>
                    )}
                    <span className={`h-2 w-2 rounded-full ${PRIORITY_STYLES[alert.priority]?.dot}`} />
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <DisasterIcon type={alert.type} className="h-3.5 w-3.5" />
                      {alert.type}
                    </span>
                    <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${PRIORITY_STYLES[alert.priority]?.badge}`}>{alert.priority}</span>
                  </div>
                  <span className="text-[10px] text-secondary shrink-0">{alert.time}</span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-secondary">
                  <MapPin size={12} className="shrink-0" />
                  {alert.location}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertRow({ alert, lang, priorityStyle: s, assignTarget, setAssignTarget, responderInput, setResponderInput, onAssign, onStatusChange }) {
  const isAssigning = assignTarget === alert.id;

  return (
    <div className={`rounded-xl border p-4 transition-all duration-200 hover:shadow-[0_2px_12px_rgba(44,57,71,0.08)] ${s.row}`}>
      {/* Desktop row */}
      <div className="hidden md:grid gap-3 items-center" style={{ gridTemplateColumns: '2fr 2fr 1fr 1.5fr 1fr 1.5fr 1.5fr' }}>
        {/* Type */}
        <div className="flex items-center gap-2">
          <DisasterIcon type={alert.type} className="h-4 w-4 text-secondary" />
          <div>
            <p className="text-xs font-bold text-primary">{alert.type}</p>
            <p className="text-[10px] text-secondary truncate max-w-[120px]">{alert.description}</p>
          </div>
        </div>
        {/* Location */}
        <div>
          <p className="flex items-center gap-1 text-xs font-semibold text-primary">
            <MapPin size={12} />
            {alert.location}
          </p>
        </div>
        {/* Time */}
        <p className="text-xs text-secondary">{alert.time}</p>
        {/* Reporter */}
        <p className="text-xs text-secondary">{alert.reporter}</p>
        {/* Priority */}
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${s.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${alert.priority === 'Critical' ? 'animate-pulse' : ''}`} />
          {alert.priority}
        </span>
        {/* Status */}
        <select
          value={alert.status}
          onChange={e => onStatusChange(alert.id, e.target.value)}
          className={`rounded-lg border px-2 py-1 text-[10px] font-semibold outline-none cursor-pointer ${STATUS_BADGE[alert.status] || 'border-secondary/30 text-secondary'}`}>
          {['Unassigned', 'In Progress', 'Assigned', 'Resolved', 'Monitoring'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {/* Assign */}
        <div>
          {isAssigning ? (
            <div className="flex gap-1">
              <input
                list={`responders-${alert.id}`}
                value={responderInput}
                onChange={e => setResponderInput(e.target.value)}
                placeholder="Select or type…"
                className="flex-1 min-w-0 rounded-lg border border-secondary/30 px-2 py-1 text-[10px] outline-none focus:border-secondary" />
              <datalist id={`responders-${alert.id}`}>
                {RESPONDERS.map(r => <option key={r} value={r} />)}
              </datalist>
              <button onClick={() => { if (responderInput.trim()) onAssign(alert.id, responderInput.trim()); }}
                className="rounded-lg bg-primary px-2 py-1 text-[10px] font-bold text-white hover:bg-primary-dark transition">
                <Check size={14} />
              </button>
              <button onClick={() => setAssignTarget(null)}
                className="rounded-lg border border-primary/15 px-2 py-1 text-[10px] text-secondary hover:text-primary transition">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setAssignTarget(alert.id); setResponderInput(alert.responder || ''); }}
              className={`w-full rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all duration-200 ${
                alert.responder
                  ? 'border-secondary/30 bg-secondary/8 text-secondary hover:bg-secondary/15'
                  : 'border-primary bg-primary text-white hover:bg-primary-dark'
              }`}>
              {alert.responder || t(lang, 'coord_assign')}
            </button>
          )}
        </div>
      </div>

      {/* Mobile card */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DisasterIcon type={alert.type} className="h-4 w-4 text-secondary" />
            <span className="text-sm font-bold text-primary">{alert.type}</span>
          </div>
          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${s.badge}`}>{alert.priority}</span>
        </div>
        <p className="flex items-center gap-1 text-xs text-secondary">
          <MapPin size={12} />
          {alert.location} · {alert.time}
        </p>
        <p className="text-xs text-secondary">Reporter: {alert.reporter}</p>
        <div className="flex gap-2 mt-2">
          <select value={alert.status} onChange={e => onStatusChange(alert.id, e.target.value)}
            className="flex-1 rounded-lg border border-secondary/30 px-2 py-1.5 text-xs outline-none">
            {['Unassigned', 'In Progress', 'Assigned', 'Resolved', 'Monitoring'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button onClick={() => setAssignTarget(isAssigning ? null : alert.id)}
            className="flex-1 rounded-lg border border-primary bg-primary px-2 py-1.5 text-xs font-bold text-white hover:bg-primary-dark transition">
            {alert.responder || t(lang, 'coord_assign')}
          </button>
        </div>
        {isAssigning && (
          <div className="flex gap-2">
            <input list={`mob-responders-${alert.id}`} value={responderInput}
              onChange={e => setResponderInput(e.target.value)}
              placeholder="Responder name…"
              className="flex-1 rounded-lg border border-secondary/30 px-3 py-1.5 text-xs outline-none focus:border-secondary" />
            <datalist id={`mob-responders-${alert.id}`}>
              {RESPONDERS.map(r => <option key={r} value={r} />)}
            </datalist>
            <button onClick={() => { if (responderInput.trim()) onAssign(alert.id, responderInput.trim()); }}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white">
              <Check size={14} className="mx-auto" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
