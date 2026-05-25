import { useState, useEffect, useRef, useCallback } from 'react';
import { CircleAlert, MapPin } from 'lucide-react';
import LiveMap from './LiveMap';
import { DisasterIcon } from '../lib/iconMaps';
import useLiveGeolocation from '../hooks/useLiveGeolocation';
import { submitEmergencyReport, updateEmergencyLocation } from '../lib/firebase';
import { hasMovedSignificantly } from '../lib/geoUtils';
import '../lib/leafletIcon';

const EMERGENCY_TYPES = [
  'Flood',
  'Fire',
  'Wildfire',
  'Fire Accident',
  'Earthquake',
  'Building Collapse',
  'Medical Emergency',
  'Pandemic',
];
const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

const severityStyles = {
  Low: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
  Medium: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
  High: 'border-orange-500/50 bg-orange-500/10 text-orange-300',
  Critical: 'border-red-500/50 bg-red-500/10 text-red-300',
};

export default function GeoTagEmergency({ onReportSubmitted, onLocationUpdate }) {
  const {
    coords,
    accuracy,
    loading: geoLoading,
    error: geoError,
    source: locationSource,
    sourceLabel,
    isRefining,
    requestPreciseGPS,
    useNetworkApproximation,
    setExactLocation,
    forcePreciseGPS,
  } = useLiveGeolocation(true);

  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [mapPicked, setMapPicked] = useState(false);
  const hasCoords = coords.lat != null && coords.lng != null;
  const locationUnreliable =
    locationSource === 'ip' || (accuracy != null && accuracy > 200 && locationSource === 'gps');

  useEffect(() => {
    if (coords.lat != null && coords.lng != null) {
      setManualLat(coords.lat.toFixed(6));
      setManualLng(coords.lng.toFixed(6));
    }
  }, [coords.lat, coords.lng]);

  const handleMapPick = (lat, lng) => {
    setExactLocation(lat, lng, 'Exact pin on map');
    setManualLat(lat.toFixed(6));
    setManualLng(lng.toFixed(6));
    setMapPicked(true);
  };

  const applyManualCoordinates = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return;
    }
    setExactLocation(lat, lng, 'Exact coordinates entered');
    setMapPicked(true);
  };

  const [emergencyType, setEmergencyType] = useState('Flood');
  const [severity, setSeverity] = useState('Medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sosActive, setSosActive] = useState(false);

  const [activeAlertId, setActiveAlertId] = useState(null);
  const [isLiveBroadcast, setIsLiveBroadcast] = useState(false);
  const [locationPingCount, setLocationPingCount] = useState(0);
  const [lastCoordinatorSync, setLastCoordinatorSync] = useState(null);
  const [positionTrail, setPositionTrail] = useState([]);

  const lastSentCoordsRef = useRef(null);
  const reportMetaRef = useRef({ type: 'Flood', severity: 'Medium', description: '', sos: false });

  const pushToCoordinators = useCallback(
    async (alertId, lat, lng, meta = {}) => {
      const payload = {
        latitude: lat,
        longitude: lng,
        accuracy,
        ...meta,
        timestamp: new Date().toISOString(),
        liveTracking: true,
      };
      await updateEmergencyLocation(alertId, payload);
      setLocationPingCount((n) => n + 1);
      setLastCoordinatorSync(new Date());
      onLocationUpdate?.(alertId, payload);
    },
    [accuracy, onLocationUpdate]
  );

  const startLiveBroadcast = useCallback(
    (alertId, meta) => {
      setActiveAlertId(alertId);
      setIsLiveBroadcast(true);
      reportMetaRef.current = meta;
      lastSentCoordsRef.current = null;
      setPositionTrail([]);
      setLocationPingCount(0);
    },
    []
  );

  const buildReport = useCallback(
    (isSOS = false, forcedId = null) => ({
      id: forcedId || activeAlertId || `alert-${Date.now()}`,
      type: emergencyType,
      severity: isSOS ? 'Critical' : severity,
      description: description.trim() || (isSOS ? 'SOS — Immediate assistance required!' : ''),
      latitude: coords.lat,
      longitude: coords.lng,
      accuracy,
      timestamp: new Date().toISOString(),
      sos: isSOS,
      liveTracking: true,
    }),
    [activeAlertId, emergencyType, severity, description, coords, accuracy]
  );

  const handleSubmit = async (isSOS = false, existingAlertId = null) => {
    if (coords.lat == null || coords.lng == null) {
      return;
    }

    setSubmitting(true);
    const report = buildReport(isSOS, existingAlertId);
    const alertId = report.id;

    try {
      await submitEmergencyReport(report);
      startLiveBroadcast(alertId, {
        type: report.type,
        severity: report.severity,
        description: report.description,
        sos: report.sos,
      });
      lastSentCoordsRef.current = { lat: coords.lat, lng: coords.lng };
      await pushToCoordinators(alertId, coords.lat, coords.lng, {
        type: report.type,
        severity: report.severity,
        description: report.description,
        sos: report.sos,
        event: 'alert_created',
      });
      setSubmitted(true);
      onReportSubmitted?.({ ...report, id: alertId });
      setTimeout(() => setSubmitted(false), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSOS = async () => {
    setSosActive(true);
    setSeverity('Critical');
    const desc = description.trim() || 'SOS — Immediate assistance required!';
    setDescription(desc);
    const sosId = `alert-${Date.now()}`;
    await handleSubmit(true, sosId);
    setTimeout(() => setSosActive(false), 3000);
  };

  useEffect(() => {
    if (!isLiveBroadcast || !activeAlertId || coords.lat == null) return;

    const moved = hasMovedSignificantly(lastSentCoordsRef.current, coords, 3);
    if (!moved && lastSentCoordsRef.current != null) return;

    lastSentCoordsRef.current = { lat: coords.lat, lng: coords.lng };
    setPositionTrail((trail) => {
      const next = [...trail, [coords.lat, coords.lng]];
      return next.length > 50 ? next.slice(-50) : next;
    });

    pushToCoordinators(activeAlertId, coords.lat, coords.lng, {
      ...reportMetaRef.current,
      event: 'position_update',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync when coordinates change
  }, [coords.lat, coords.lng, isLiveBroadcast, activeAlertId]);

  const stopLiveBroadcast = () => {
    setIsLiveBroadcast(false);
    setActiveAlertId(null);
    lastSentCoordsRef.current = null;
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-secondary/20 bg-slate-muted px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isLiveBroadcast ? 'animate-ping bg-red-400' : 'bg-secondary'
              }`}
            />
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${
                isLiveBroadcast ? 'bg-red-500' : 'bg-secondary'
              }`}
            />
          </span>
          <span className="text-sm font-semibold text-primary">
            {isLiveBroadcast ? 'Live GPS Broadcast to Coordinators' : 'Live GPS Tracking'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-secondary">
          {geoLoading && !hasCoords ? (
            <span className="animate-pulse text-secondary">Locating (&lt; 5 sec)…</span>
          ) : isRefining ? (
            <span className="text-secondary/80">Refining precision…</span>
          ) : coords.lat != null ? (
            <>
              <span className="font-mono text-secondary/90">
                {coords.lat.toFixed(6)}°, {coords.lng.toFixed(6)}°
              </span>
              {accuracy != null && (
                <span className="text-secondary">±{Math.round(accuracy)}m</span>
              )}
            </>
          ) : (
            <span className="text-amber-400/90">
              {sourceLabel || 'Waiting for location…'}
            </span>
          )}
          {isLiveBroadcast && (
            <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 font-semibold text-red-400">
              {locationPingCount} sync{locationPingCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {isLiveBroadcast && (
        <div className="animate-pulse-glow flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-4">
          <div>
            <p className="text-sm font-bold text-red-300">
              Emergency active — coordinators receive your location in real time
            </p>
            <p className="mt-1 text-xs text-secondary">
              Position updates automatically when you move (≈3m+). Map marker follows your GPS.
            </p>
            {lastCoordinatorSync && (
              <p className="mt-1 font-mono text-[10px] text-secondary/80">
                Last sync: {lastCoordinatorSync.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={stopLiveBroadcast}
            className="rounded-lg border border-primary/20 px-3 py-1.5 text-xs text-secondary transition hover:border-secondary/40 hover:text-primary"
          >
            End tracking
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-secondary/25 bg-slate-surface p-6 shadow-[0_0_25px_rgba(84, 122, 149,0.06)] backdrop-blur-xl transition duration-300 hover:border-secondary/40 md:p-8">
          <h2 className="mb-1 text-xl font-bold text-primary">Report Emergency</h2>
          <p className="mb-6 text-sm text-secondary">
            Geo-tagged alert — lat/lng sent to coordinators immediately and on every move
          </p>

          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-secondary">
            Emergency Type
          </label>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {EMERGENCY_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setEmergencyType(type)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all duration-300 ${
                  emergencyType === type
                    ? 'border-secondary bg-secondary/15 text-primary shadow-[0_0_20px_rgba(84, 122, 149,0.25)]'
                    : 'border-primary/10 bg-slate-muted text-secondary hover:border-secondary/40 hover:text-primary'
                }`}
              >
                <DisasterIcon type={type} className="h-5 w-5" />
                {type}
              </button>
            ))}
          </div>

          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-secondary">
            Severity Level
          </label>
          <div className="mb-6 flex flex-wrap gap-2">
            {SEVERITY_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setSeverity(level)}
                className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-300 ${
                  severity === level
                    ? `${severityStyles[level]} shadow-[0_0_15px_rgba(84, 122, 149,0.2)]`
                    : 'border-primary/10 bg-slate-muted text-secondary hover:border-primary/20'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-secondary">
            Description{' '}
            <span className="font-normal normal-case text-secondary">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Optional — add details about the situation, people affected, access routes..."
            className="mb-6 w-full resize-none rounded-xl border border-primary/10 bg-white px-4 py-3 text-sm text-primary placeholder:text-secondary-muted outline-none transition focus:border-secondary/50 focus:shadow-[0_0_15px_rgba(84, 122, 149,0.15)] focus:ring-1 focus:ring-secondary/30"
          />

          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-secondary">
            Exact coordinates {locationUnreliable && <span className="text-red-400">(fix if wrong)</span>}
          </label>
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              inputMode="decimal"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="Latitude e.g. 12.975123"
              className="rounded-xl border border-secondary/30 bg-white px-4 py-3 font-mono text-sm text-primary outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/40"
            />
            <input
              type="text"
              inputMode="decimal"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              placeholder="Longitude e.g. 77.591234"
              className="rounded-xl border border-secondary/30 bg-white px-4 py-3 font-mono text-sm text-primary outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/40"
            />
          </div>
          <button
            type="button"
            onClick={applyManualCoordinates}
            className="mb-4 w-full rounded-xl border border-secondary/40 bg-secondary/10 py-2.5 text-xs font-bold uppercase tracking-wider text-secondary transition hover:bg-secondary/20"
          >
            Apply coordinates to map
          </button>

          {sourceLabel && hasCoords && (
            <p
              className={`mb-4 rounded-lg border px-3 py-2 text-xs ${
                locationSource === 'gps'
                  ? 'border-secondary/30 bg-secondary/10 text-primary'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
              }`}
            >
              {sourceLabel}
            </p>
          )}

          {(locationUnreliable || geoError || mapPicked) && (
            <div
              className={`mb-4 space-y-3 rounded-lg border px-3 py-3 ${
                locationUnreliable
                  ? 'border-red-500/40 bg-red-500/10'
                  : 'border-amber-500/30 bg-amber-500/10'
              }`}
            >
              <p className={`text-xs ${locationUnreliable ? 'text-red-200' : 'text-amber-200'}`}>
                {locationUnreliable && (
                  <>
                    <span className="font-bold">Pin is probably wrong</span> (network/city GPS).
                    {' '}
                  </>
                )}
                {geoError && <span>{geoError} </span>}
                <span className="font-semibold">Tap the map</span> at your building, or enter lat/lng
                above, then click Apply.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMapPicked(false);
                    forcePreciseGPS();
                  }}
                  className="rounded-lg border border-secondary/50 bg-secondary/15 px-3 py-1.5 text-xs font-bold text-secondary transition hover:bg-secondary/25"
                >
                  <MapPin size={14} className="inline" /> Use device GPS
                </button>
                <button
                  type="button"
                  onClick={useNetworkApproximation}
                  className="rounded-lg border border-primary/20 px-3 py-1.5 text-xs text-secondary transition hover:border-secondary/40"
                >
                  Rough network only
                </button>
              </div>
            </div>
          )}

          {submitted && (
            <div className="animate-pulse-glow mb-4 rounded-lg border border-secondary/40 bg-secondary/10 px-4 py-3 text-sm text-secondary">
              Alert sent. Live coordinates streaming to coordinators as you move.
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={submitting || (geoLoading && !hasCoords) || !hasCoords}
              className="flex-1 rounded-xl border border-secondary/50 bg-secondary/10 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-secondary transition-all duration-300 hover:border-secondary hover:bg-secondary/20 hover:shadow-[0_0_25px_rgba(84, 122, 149,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Transmitting...' : 'Submit Alert & Track'}
            </button>

            <button
              type="button"
              onClick={handleSOS}
              disabled={submitting || !hasCoords}
              className={`flex h-16 w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-500 bg-red-600/90 px-8 text-lg font-black uppercase tracking-widest text-primary transition-all duration-300 hover:bg-red-500 hover:shadow-[0_0_35px_rgba(239,68,68,0.5)] sm:w-auto sm:min-w-[140px] ${
                sosActive ? 'animate-sos-pulse' : ''
              }`}
            >
              <CircleAlert size={24} strokeWidth={2.5} /> SOS
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary">Live Map</h2>
            <span
              className={`rounded-full border px-3 py-1 text-xs ${
                isLiveBroadcast
                  ? 'border-red-500/40 bg-red-500/10 text-red-400'
                  : 'border-secondary/30 bg-secondary/10 text-secondary'
              }`}
            >
              {isLiveBroadcast ? 'Broadcasting' : 'Tracking'} · Zoom 15
            </span>
          </div>
          <LiveMap
            latitude={coords.lat}
            longitude={coords.lng}
            emergencyType={emergencyType}
            severity={severity}
            trail={positionTrail}
            accuracy={accuracy}
            locationSource={locationSource}
            loading={geoLoading}
            allowMapPick
            onMapClickPick={handleMapPick}
          />
          <p className="text-center text-xs text-secondary">
            {mapPicked
              ? 'Pin placed on map — coordinators see this exact spot'
              : isLiveBroadcast
                ? 'Trail = path to coordinators · dot = your position'
                : 'Pulsing dot = your GPS · circle shows accuracy radius'}
          </p>
        </div>
      </div>
    </section>
  );
}
