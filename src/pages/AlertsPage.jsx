import { useState, useEffect } from 'react';
import { Bell, MapPin, Clock, User } from 'lucide-react';
import { useLang } from '../lib/LanguageContext';
import { t } from '../lib/i18n';
import { getAlerts, subscribeToAlerts, updateAlert } from '../lib/alertStore';
import { subscribeToLocationUpdates } from '../lib/coordinatorFeed';
import { DisasterIcon } from '../lib/iconMaps';
import { COORDINATOR_QUEUE } from '../data/rescueNetMock';
import { sortAlertsNewestFirst } from '../lib/sortAlerts';

const PRIORITY_STYLES = {
  Critical: 'border-red-500/40 bg-red-500/8 text-red-700',
  High: 'border-orange-500/40 bg-orange-500/8 text-orange-700',
  Medium: 'border-amber-500/40 bg-amber-500/8 text-amber-800',
  Low: 'border-emerald-500/40 bg-emerald-500/8 text-emerald-700',
};

export default function AlertsPage() {
  const { lang } = useLang();
  const [alerts, setAlerts] = useState(() => [...getAlerts(), ...COORDINATOR_QUEUE.filter((q) => !getAlerts().find((a) => a.id === q.id))]);
  const [livePing, setLivePing] = useState(null);

  useEffect(() => {
    return subscribeToAlerts((list) => {
      const merged = [...list];
      COORDINATOR_QUEUE.forEach((q) => {
        if (!merged.find((a) => a.id === q.id)) merged.push(q);
      });
      setAlerts(sortAlertsNewestFirst(merged));
    });
  }, []);

  useEffect(() => {
    return subscribeToLocationUpdates((u) => setLivePing(u));
  }, []);

  const critical = alerts.filter((a) => a.priority === 'Critical').length;

  return (
    <div className="rn-fade-in mx-auto max-w-4xl space-y-6 pb-24 md:pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/8 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-red-600">
              {t(lang, 'alerts_live_feed')}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-primary">{t(lang, 'alerts_title')}</h1>
          <p className="text-sm text-muted">{t(lang, 'alerts_subtitle')}</p>
        </div>
        <span className="rn-card-muted text-sm font-semibold text-primary">
          {alerts.length} {t(lang, 'coord_total')} · {critical} {t(lang, 'coord_critical')}
        </span>
      </header>

      {livePing && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/8 px-4 py-3 rn-fade-in">
          <p className="text-xs font-bold uppercase text-red-600">{t(lang, 'coord_incoming_sos')}</p>
          <p className="mt-1 font-mono text-xs text-muted">
            {livePing.alertId} · {livePing.latitude?.toFixed(4)}, {livePing.longitude?.toFixed(4)}
          </p>
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="rn-card text-center py-12">
          <Bell size={32} className="mx-auto text-muted opacity-40" />
          <p className="mt-3 text-muted">{t(lang, 'alerts_empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, i) => (
            <article
              key={alert.id}
              className={`rn-card border-l-4 transition hover:shadow-soft ${
                alert.priority === 'Critical' ? 'border-l-red-500' : 'border-l-secondary'
              } ${i === 0 && alert.time === 'Just now' ? 'ring-2 ring-red-500/20' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <DisasterIcon type={alert.type} className="h-5 w-5 text-secondary" />
                  <div>
                    <h3 className="font-bold text-primary">{alert.type}</h3>
                    <p className="text-xs text-muted">{alert.description}</p>
                  </div>
                </div>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${PRIORITY_STYLES[alert.priority] || PRIORITY_STYLES.Medium}`}>
                  {t(lang, `severity_${alert.priority}`) || alert.priority}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <span className="flex items-center gap-1.5 text-muted">
                  <MapPin size={12} className="shrink-0" />
                  {alert.location}
                </span>
                <span className="flex items-center gap-1.5 text-muted">
                  <Clock size={12} />
                  {t(lang, 'alerts_timestamp')}: {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : alert.time}
                </span>
                <span className="flex items-center gap-1.5 text-muted">
                  <User size={12} />
                  {alert.reporter}
                </span>
                <span className="text-muted">
                  {t(lang, 'alerts_disaster')}: {alert.type} · {t(lang, 'alerts_severity')}: {alert.severity || alert.priority}
                </span>
              </div>
              {alert.liveTracking && (
                <span className="mt-2 inline-block rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-600">
                  GPS LIVE
                </span>
              )}
              <div className="mt-3 flex gap-2">
                <select
                  value={alert.status}
                  onChange={(e) => updateAlert(alert.id, { status: e.target.value })}
                  className="rounded-lg border border-primary/10 px-2 py-1 text-xs"
                >
                  {['Unassigned', 'In Progress', 'Assigned', 'Resolved', 'Monitoring'].map((s) => (
                    <option key={s} value={s}>{t(lang, `status_${s.replace(' ', '_')}`) || s}</option>
                  ))}
                </select>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
