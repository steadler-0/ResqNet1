import { useState, useEffect } from 'react';
import { MapPin, Radio } from 'lucide-react';
import GeoTagEmergency from '../components/sentinelx/GeoTagEmergency';
import RealtimeAlerts from '../components/sentinelx/RealtimeAlerts';
import SafetyInstructions from '../components/sentinelx/SafetyInstructions';
import SeverityHeatmap from '../components/sentinelx/SeverityHeatmap';
import LiveAnalytics from '../components/sentinelx/LiveAnalytics';
import { subscribeToLocationUpdates } from '../lib/sentinelx/coordinatorFeed';
import { sortAlertsNewestFirst } from '../lib/sentinelx/sortAlerts';

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
    <section className="mt-10 pt-10 border-t border-primary/10">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-secondary mb-2">
            <MapPin className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">SentinelX</span>
          </div>
          <h2 className="text-xl md:text-2xl font-semibold text-primary">
            Citizen Emergency — Geo-Tag & Live Tracking
          </h2>
          <p className="text-secondary text-sm mt-1 max-w-2xl">
            Report emergencies with live GPS. Coordinators see your location immediately and when you
            move.
          </p>
        </div>
        {activeIncidents > 0 && (
          <div className="card-muted px-4 py-3 flex items-center gap-2">
            <Radio className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-primary tabular-nums">
              {activeIncidents} active broadcast{activeIncidents !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </header>

      <GeoTagEmergency
        onReportSubmitted={handleReportSubmitted}
        onLocationUpdate={handleLocationUpdate}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-6">
        <div className="lg:col-span-2">
          <RealtimeAlerts alerts={alerts} />
        </div>
        <SafetyInstructions emergencyType={lastEmergencyType} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-6">
        <SeverityHeatmap />
        <LiveAnalytics alerts={alerts} />
      </div>
    </section>
  );
}
