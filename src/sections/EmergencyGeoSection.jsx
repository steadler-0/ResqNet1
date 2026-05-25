import { useState, useEffect } from 'react';
import GeoTagEmergency from '../components/GeoTagEmergency';
import RealtimeAlerts from '../components/RealtimeAlerts';
import SafetyInstructions from '../components/SafetyInstructions';
import SeverityHeatmap from '../components/SeverityHeatmap';
import LiveAnalytics from '../components/LiveAnalytics';
import { subscribeToLocationUpdates } from '../lib/coordinatorFeed';
import { sortAlertsNewestFirst } from '../lib/sortAlerts';

export default function EmergencyGeoSection() {
  const [alerts, setAlerts] = useState([]);
  const [lastEmergencyType, setLastEmergencyType] = useState('Flood');
  const [activeIncidents, setActiveIncidents] = useState(0);

  useEffect(() => {
    return subscribeToLocationUpdates((update) => {
      setAlerts((prev) => {
        const idx = prev.findIndex((a) => a.id === update.alertId);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          submittedAt: next[idx].submittedAt || next[idx].timestamp,
          latitude: update.latitude,
          longitude: update.longitude,
          accuracy: update.accuracy,
          lastLocationUpdate: update.timestamp,
          liveTracking: true,
          locationUpdates: (next[idx].locationUpdates || 0) + 1,
        };
        return sortAlertsNewestFirst(next);
      });
    });
  }, []);

  const handleReportSubmitted = (report) => {
    const submittedAt = report.timestamp || new Date().toISOString();
    setAlerts((prev) =>
      sortAlertsNewestFirst([
        {
          ...report,
          id: report.id || `alert-${Date.now()}`,
          submittedAt,
          timestamp: submittedAt,
          liveTracking: true,
          locationUpdates: 1,
          lastLocationUpdate: submittedAt,
        },
        ...prev,
      ])
    );
    setActiveIncidents((n) => n + 1);
    setLastEmergencyType(report.type);
  };

  const handleLocationUpdate = (alertId, payload) => {
    setAlerts((prev) => {
      const idx = prev.findIndex((a) => a.id === alertId);
      if (idx === -1) {
        const submittedAt = payload.timestamp || new Date().toISOString();
        return sortAlertsNewestFirst([
          {
            id: alertId,
            type: payload.type || 'Unknown',
            severity: payload.severity || 'Critical',
            description: payload.description || 'Live tracking',
            latitude: payload.latitude,
            longitude: payload.longitude,
            submittedAt,
            timestamp: submittedAt,
            liveTracking: true,
            locationUpdates: 1,
            lastLocationUpdate: payload.timestamp,
            sos: payload.sos,
          },
          ...prev,
        ]);
      }
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        submittedAt: next[idx].submittedAt || next[idx].timestamp,
        latitude: payload.latitude,
        longitude: payload.longitude,
        accuracy: payload.accuracy,
        lastLocationUpdate: payload.timestamp,
        liveTracking: true,
        locationUpdates: (next[idx].locationUpdates || 0) + 1,
      };
      return sortAlertsNewestFirst(next);
    });
  };

  return (
    <section className="mt-10 border-t border-primary/10 pt-10">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-secondary">SentinelX</p>
        <h2 className="mt-1 text-xl font-semibold text-primary md:text-2xl">
          Citizen Emergency — Geo-Tag & Live Tracking
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-secondary">
          Report with live GPS. Coordinators receive your position immediately and when you move.
          {activeIncidents > 0 && (
            <span className="ml-2 font-medium text-primary">
              · {activeIncidents} active broadcast{activeIncidents !== 1 ? 's' : ''}
            </span>
          )}
        </p>
      </header>

      <GeoTagEmergency
        onReportSubmitted={handleReportSubmitted}
        onLocationUpdate={handleLocationUpdate}
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RealtimeAlerts alerts={alerts} />
        </div>
        <SafetyInstructions emergencyType={lastEmergencyType} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SeverityHeatmap />
        <LiveAnalytics alerts={alerts} />
      </div>
    </section>
  );
}
