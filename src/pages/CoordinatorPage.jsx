import { useState, useEffect } from 'react';
import { MapPin, Users, Radio } from 'lucide-react';
import { useLang } from '../lib/LanguageContext';
import { t } from '../lib/i18n';
import { DisasterIcon } from '../lib/iconMaps';
import { COORDINATOR_QUEUE } from '../data/rescueNetMock';
import { getAlerts, subscribeToAlerts } from '../lib/alertStore';
import { subscribeToLocationUpdates } from '../lib/coordinatorFeed';
import { subscribeCoordinator } from '../lib/socketClient';
import { fetchEmergencies, checkApiHealth } from '../lib/emergencyApi';
import { sortAlertsNewestFirst } from '../lib/sortAlerts';
import { disasterLabel } from '../lib/disasterI18n';

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

const DISPATCH_BADGE = {
  Broadcasting: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  Assigned: 'bg-violet-500/10 text-violet-600 border-violet-500/30',
  'In Progress': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  Resolved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  Unassigned: 'bg-secondary/10 text-secondary border-secondary/30',
};

function mapApiAlert(e) {
  return {
    id: e.id,
    type: e.type,
    location: e.locationLabel,
    lat: e.lat,
    lng: e.lng,
    time: 'Live',
    reporter: e.reporter,
    priority: e.priority,
    status: e.status,
    responder: e.responderName,
    responderStatus: e.responderStatus,
    locked: e.locked,
    nearbyCount: e.nearbyCount,
    description: e.description,
  };
}

export default function CoordinatorPage() {
  const { lang } = useLang();
  const [queue, setQueue] = useState(() => mergeQueues(getAlerts(), COORDINATOR_QUEUE));
  const [liveAlerts, setLiveAlerts] = useState([]);

  useEffect(() => {
    return subscribeToAlerts((live) => setQueue(mergeQueues(live, COORDINATOR_QUEUE)));
  }, []);

  useEffect(() => {
    let unsub = () => {};
    checkApiHealth().then((ok) => {
      if (!ok) return;
      fetchEmergencies()
        .then((list) => {
          if (list?.length) setQueue(mergeQueues(list.map(mapApiAlert), COORDINATOR_QUEUE));
        })
        .catch(() => {});
      unsub = subscribeCoordinator({
        onCreated: (e) => setQueue((prev) => mergeQueues([mapApiAlert(e), ...prev], COORDINATOR_QUEUE)),
        onAssigned: (e) =>
          setQueue((prev) => prev.map((a) => (a.id === e.id ? { ...a, ...mapApiAlert(e) } : a))),
        onUpdated: (e) =>
          setQueue((prev) => prev.map((a) => (a.id === e.id ? { ...a, ...mapApiAlert(e) } : a))),
      });
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    return subscribeToLocationUpdates((update) => {
      setLiveAlerts((prev) => [update, ...prev].slice(0, 10));
    });
  }, []);

  const sortedQueue = [...queue].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
  );

  const byPriority = { Critical: [], High: [], Medium: [], Low: [] };
  sortedQueue.forEach((alert) => {
    if (byPriority[alert.priority]) byPriority[alert.priority].push(alert);
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1">
            <Radio size={12} className="text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              {t(lang, 'coord_auto_dispatch')}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-primary">{t(lang, 'coord_title')}</h1>
          <p className="mt-1 text-sm text-secondary">{t(lang, 'coord_no_manual')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-primary/10 bg-slate-surface px-3 py-2 text-xs text-secondary">
            {queue.length} {t(lang, 'coord_active')} · {queue.filter((a) => a.status === 'Broadcasting').length}{' '}
            {t(lang, 'coord_broadcasting_count')}
          </span>
          <span className="flex items-center gap-1.5 rounded-xl border border-secondary/30 bg-secondary/8 px-3 py-2 text-xs font-semibold text-secondary">
            <Users size={14} /> {t(lang, 'coord_marketplace')}
          </span>
        </div>
      </div>

      {liveAlerts.length > 0 && (
        <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/8 px-5 py-3">
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">{t(lang, 'coord_live_gps')}</span>
          </div>
          <p className="text-xs text-secondary">
            {liveAlerts[0].alertId} · {liveAlerts[0].latitude?.toFixed(4)}, {liveAlerts[0].longitude?.toFixed(4)}
          </p>
        </div>
      )}

      <div className="space-y-5">
        {Object.entries(byPriority).map(([priority, alerts]) => {
          const s = PRIORITY_STYLES[priority];
          return (
            <div key={priority}>
              <div className={`mb-3 flex items-center gap-3 rounded-xl border px-4 py-2.5 ${s.header}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                <span className="text-sm font-bold uppercase tracking-wider">
                  {t(lang, `coord_${priority.toLowerCase()}`)}
                </span>
                <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-black ${s.count}`}>
                  {alerts.length}
                </span>
              </div>

              {alerts.length === 0 ? (
                <div className="rounded-xl border border-primary/5 bg-slate-muted/40 px-4 py-4 text-center text-xs text-secondary">
                  {t(lang, 'coord_no_alerts', { priority: t(lang, `coord_${priority.toLowerCase()}`) })}
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <AlertRow key={alert.id} alert={alert} priorityStyle={s} lang={lang} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AlertRow({ alert, priorityStyle: s, lang }) {
  return (
    <div className={`rounded-xl border p-4 transition hover:shadow-[0_2px_12px_rgba(44,57,71,0.08)] ${s.row}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <DisasterIcon type={alert.type} className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-primary">{disasterLabel(lang, alert.type)}</p>
            <p className="flex items-center gap-1 text-xs text-secondary mt-0.5">
              <MapPin size={12} className="shrink-0" />
              {alert.location}
            </p>
            {alert.description && (
              <p className="text-[10px] text-muted mt-1 line-clamp-2">{alert.description}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${s.badge}`}>
            {alert.priority}
          </span>
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${DISPATCH_BADGE[alert.status] || DISPATCH_BADGE.Unassigned}`}
          >
            {alert.status}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-primary/5 pt-3">
        {alert.responder ? (
          <span className="text-xs font-semibold text-secondary">
            {t(lang, 'coord_responder_label')}: <span className="text-primary">{alert.responder}</span>
            {alert.responderStatus && ` · ${alert.responderStatus}`}
          </span>
        ) : alert.status === 'Broadcasting' ? (
          <span className="text-xs text-amber-700 font-medium animate-pulse">
            {t(lang, 'coord_offered', { count: alert.nearbyCount ?? 15 })}
          </span>
        ) : (
          <span className="text-xs text-muted">{t(lang, 'coord_awaiting')}</span>
        )}
        {alert.locked && (
          <span className="rounded border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-violet-600">
            {t(lang, 'coord_locked')}
          </span>
        )}
      </div>
    </div>
  );
}
