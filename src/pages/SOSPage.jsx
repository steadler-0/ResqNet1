import { useState, useEffect, useRef, useCallback } from 'react';
import { CircleAlert, MapPin } from 'lucide-react';
import LiveMap from '../components/LiveMap';
import useLiveGeolocation from '../hooks/useLiveGeolocation';
import { submitEmergencyReport, updateEmergencyLocation } from '../lib/firebase';
import { hasMovedSignificantly } from '../lib/geoUtils';
import { subscribeCitizen, emitCitizenLocation, getCitizenSocket, getSocketUrl } from '../lib/socketClient';
import { showLocalNotification } from '../lib/pushNotifications';
import { disasterLabel, severityLabel } from '../lib/disasterI18n';
import { useLang } from '../lib/LanguageContext';
import { useAuth } from '../lib/AuthContext';
import { t } from '../lib/i18n';
import { DISASTER_ICON, SCARCITY_ICON } from '../lib/iconMaps';
import '../lib/leafletIcon';

const EMERGENCY_TYPES = Object.keys(DISASTER_ICON);

const SCARCITY_OPTIONS = [
  { id: 'water', key: 'sos_scarcity_water' },
  { id: 'food', key: 'sos_scarcity_food' },
  { id: 'medical', key: 'sos_scarcity_medical' },
  { id: 'shelter', key: 'sos_scarcity_shelter' },
  { id: 'power', key: 'sos_scarcity_power' },
];

const SEVERITY_LEVELS = [
  { id: 'Critical', color: 'border-red-500/60 bg-red-500/10 text-red-600', active: 'border-red-500 bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' },
  { id: 'High', color: 'border-orange-500/60 bg-orange-500/10 text-orange-600', active: 'border-orange-500 bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]' },
  { id: 'Medium', color: 'border-amber-500/60 bg-amber-500/10 text-amber-700', active: 'border-amber-500 bg-amber-500 text-white shadow-[0_0_20px_rgba(234,179,8,0.4)]' },
  { id: 'Low', color: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-700', active: 'border-emerald-500 bg-emerald-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' },
];

export default function SOSPage({ searchPlace, searchPlaceTick = 0 }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const {
    coords, accuracy, loading: geoLoading, error: geoError,
    source: locationSource, sourceLabel, isRefining,
    setExactLocation, forcePreciseGPS, useNetworkApproximation,
  } = useLiveGeolocation(true);

  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [mapPicked, setMapPicked] = useState(false);
  const [emergencyType, setEmergencyType] = useState('Flood');
  const [scarcity, setScarcity] = useState([]);
  const [severity, setSeverity] = useState('Medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [activeAlertId, setActiveAlertId] = useState(null);
  const [isLiveBroadcast, setIsLiveBroadcast] = useState(false);
  const [locationPingCount, setLocationPingCount] = useState(0);
  const [lastSync, setLastSync] = useState(null);
  const [positionTrail, setPositionTrail] = useState([]);
  const [dispatchStatus, setDispatchStatus] = useState(null);
  const [responderEta, setResponderEta] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const lastSentRef = useRef(null);
  const reportMetaRef = useRef({});

  const hasCoords = coords.lat != null && coords.lng != null;
  const locationUnreliable = locationSource === 'ip' || (accuracy != null && accuracy > 200 && locationSource === 'gps');

  useEffect(() => {
    if (coords.lat != null) {
      setManualLat(coords.lat.toFixed(6));
      setManualLng(coords.lng.toFixed(6));
    }
  }, [coords.lat, coords.lng]);

  useEffect(() => {
    if (searchPlaceTick === 0 || searchPlace?.lat == null) return;
    setExactLocation(
      searchPlace.lat,
      searchPlace.lng,
      searchPlace.label || 'Search location'
    );
    setManualLat(searchPlace.lat.toFixed(6));
    setManualLng(searchPlace.lng.toFixed(6));
    setMapPicked(true);
  }, [searchPlaceTick, searchPlace, setExactLocation]);

  const handleMapPick = (lat, lng) => {
    setExactLocation(lat, lng, 'Exact pin on map');
    setManualLat(lat.toFixed(6));
    setManualLng(lng.toFixed(6));
    setMapPicked(true);
  };

  const applyManual = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
    setExactLocation(lat, lng, 'Exact coordinates entered');
    setMapPicked(true);
  };

  const toggleScarcity = (id) => {
    setScarcity(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const pushLocation = useCallback(async (alertId, lat, lng, meta = {}) => {
    const payload = { latitude: lat, longitude: lng, accuracy, ...meta, timestamp: new Date().toISOString(), liveTracking: true };
    await updateEmergencyLocation(alertId, payload);
    emitCitizenLocation(alertId, lat, lng);
    setLocationPingCount(n => n + 1);
    setLastSync(new Date());
  }, [accuracy]);

  const handleSubmit = async (isSOS = false) => {
    if (!hasCoords || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    const id = `alert-${Date.now()}`;
    const report = {
      id, type: emergencyType, severity: isSOS ? 'Critical' : severity,
      description: description.trim() || (isSOS ? 'SOS — Immediate assistance required!' : ''),
      scarcity, latitude: coords.lat, longitude: coords.lng,
      accuracy, timestamp: new Date().toISOString(), sos: isSOS, liveTracking: true,
    };
    try {
      const alertId = await submitEmergencyReport(report, user || {});
      const finalId = alertId || id;
      setActiveAlertId(finalId);
      setIsLiveBroadcast(true);
      reportMetaRef.current = { type: report.type, severity: report.severity, sos: report.sos };
      lastSentRef.current = { lat: coords.lat, lng: coords.lng };
      setDispatchStatus({ status: 'Broadcasting', message: t(lang, 'sos_searching') });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
      pushLocation(finalId, coords.lat, coords.lng, { ...reportMetaRef.current, event: 'alert_created' }).catch(
        () => {}
      );
    } catch (err) {
      const msg =
        err.message === 'api_offline'
          ? 'Server offline — run npm run dev:server in a terminal'
          : err.message === 'request_timeout'
            ? 'Request timed out — check API at http://localhost:3001'
            : t(lang, 'sos_submit_failed') || 'Could not send alert. Try again.';
      setSubmitError(msg);
      console.error('[ResqNet] SOS submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSOS = async () => {
    setSosActive(true);
    setSeverity('Critical');
    const desc = description.trim() || 'SOS — Immediate assistance required!';
    setDescription(desc);
    await handleSubmit(true);
    setTimeout(() => setSosActive(false), 3000);
  };

  useEffect(() => {
    if (!isLiveBroadcast || !activeAlertId || coords.lat == null) return;
    if (!hasMovedSignificantly(lastSentRef.current, coords, 3) && lastSentRef.current != null) return;
    lastSentRef.current = { lat: coords.lat, lng: coords.lng };
    setPositionTrail(trail => { const n = [...trail, [coords.lat, coords.lng]]; return n.length > 50 ? n.slice(-50) : n; });
    pushLocation(activeAlertId, coords.lat, coords.lng, { ...reportMetaRef.current, event: 'position_update' });
  }, [coords.lat, coords.lng, isLiveBroadcast, activeAlertId]);

  useEffect(() => {
    getCitizenSocket();
    console.log('[ResqNet] Citizen SOS page socket target:', getSocketUrl());
  }, []);

  useEffect(() => {
    if (!activeAlertId || !isLiveBroadcast) return undefined;
    return subscribeCitizen(activeAlertId, {
      onUpdate: (update) => {
        setDispatchStatus(update);
        if (update.responderStatus === 'Accepted' || update.locked) {
          const msg = update.responderName
            ? `${update.responderName} — ${t(lang, 'sos_responder_on_way')}`
            : t(lang, 'sos_responder_on_way');
          setDispatchStatus({ ...update, message: msg });
          showLocalNotification(t(lang, 'push_citizen_accepted'), msg, update.id);
        }
        if (update.responderStatus === 'On The Way') {
          showLocalNotification(
            t(lang, 'push_citizen_on_way'),
            `${t(lang, 'sos_eta')} ~${update.etaMinutes || '—'} min`,
            update.id
          );
        }
      },
      onEta: ({ etaMinutes, distanceLabel }) => setResponderEta({ etaMinutes, distanceLabel }),
    });
  }, [activeAlertId, isLiveBroadcast, lang]);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/8 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-red-600">{t(lang, 'sos_emergency_banner')}</span>
        </div>
        <h1 className="text-2xl font-bold text-primary">{t(lang, 'sos_title')}</h1>
        <p className="mt-1 text-sm text-secondary">{t(lang, 'sos_subtitle')}</p>
      </div>

      {/* GPS Status Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-secondary/20 bg-slate-surface px-5 py-3 shadow-[0_2px_12px_rgba(44,57,71,0.06)]">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isLiveBroadcast ? 'animate-ping bg-red-400' : 'bg-secondary'}`} />
            <span className={`relative inline-flex h-3 w-3 rounded-full ${isLiveBroadcast ? 'bg-red-500' : 'bg-secondary'}`} />
          </span>
          <span className="text-sm font-semibold text-primary">
            {isLiveBroadcast ? t(lang, 'sos_live_title') : t(lang, 'sos_tracking')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-secondary">
          {geoLoading && !hasCoords ? (
            <span className="animate-pulse">{t(lang, 'sos_locating')}</span>
          ) : coords.lat != null ? (
            <>
              <span className="font-mono">{coords.lat.toFixed(6)}°, {coords.lng.toFixed(6)}°</span>
              {accuracy != null && <span>±{Math.round(accuracy)}m</span>}
            </>
          ) : (
            <span className="text-amber-600">{sourceLabel || t(lang, 'sos_waiting_gps')}</span>
          )}
          {isLiveBroadcast && (
            <span className="rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 font-semibold text-red-500">
              {locationPingCount} {t(lang, 'sos_syncs')}
            </span>
          )}
        </div>
      </div>

      {/* Live Broadcast Banner */}
      {isLiveBroadcast && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-500/40 bg-red-500/8 px-5 py-4">
          <div>
            <p className="text-sm font-bold text-red-600">
              {dispatchStatus?.message || t(lang, 'sos_broadcast_active')}
            </p>
            {dispatchStatus?.responderName && (
              <p className="mt-1 text-xs font-semibold text-secondary">
                {t(lang, 'sos_assigned')}: {dispatchStatus.responderName}
                {dispatchStatus.responderStatus && ` · ${dispatchStatus.responderStatus}`}
              </p>
            )}
            {responderEta?.etaMinutes != null && (
              <p className="mt-1 text-xs text-secondary">
                {t(lang, 'sos_eta')} ~{responderEta.etaMinutes} min
                {responderEta.distanceLabel ? ` · ${responderEta.distanceLabel} ${t(lang, 'sos_away')}` : ''}
              </p>
            )}
            {lastSync && (
              <p className="mt-1 font-mono text-[10px] text-secondary">
                {t(lang, 'sos_last_sync')}: {lastSync.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button onClick={() => { setIsLiveBroadcast(false); setActiveAlertId(null); }}
            className="rounded-lg border border-primary/20 px-3 py-1.5 text-xs text-secondary transition hover:border-secondary/40 hover:text-primary">
            {t(lang, 'sos_end_tracking')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Form */}
        <div className="rn-card space-y-6">
          {/* Disaster Type */}
          <div>
            <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-secondary">
              {t(lang, 'sos_disaster_type')}
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {EMERGENCY_TYPES.map(id => {
                const Icon = DISASTER_ICON[id];
                return (
                  <button key={id} type="button" onClick={() => setEmergencyType(id)}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center text-[10px] font-semibold transition-all duration-200 ${
                      emergencyType === id
                        ? 'border-secondary bg-secondary/15 text-primary shadow-[0_0_16px_rgba(84,122,149,0.25)]'
                        : 'border-primary/10 bg-slate-muted text-secondary hover:border-secondary/30 hover:text-primary'
                    }`}>
                    <Icon size={20} strokeWidth={1.75} className="text-secondary" />
                    <span className="leading-tight">{disasterLabel(lang, id)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scarcity */}
          <div>
            <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-secondary">
              {t(lang, 'sos_scarcity')}
            </label>
            <div className="flex flex-wrap gap-2">
              {SCARCITY_OPTIONS.map(({ id, key }) => {
                const Icon = SCARCITY_ICON[id];
                return (
                  <button key={id} type="button" onClick={() => toggleScarcity(id)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                      scarcity.includes(id)
                        ? 'border-accent bg-accent/15 text-primary shadow-[0_0_12px_rgba(194,165,109,0.25)]'
                        : 'border-primary/10 bg-slate-muted text-secondary hover:border-accent/40'
                    }`}>
                    <Icon size={16} strokeWidth={2} />
                    {t(lang, key)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-secondary">
              {t(lang, 'sos_severity')}
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SEVERITY_LEVELS.map(({ id, color, active }) => (
                <button key={id} type="button" onClick={() => setSeverity(id)}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition-all duration-200 ${severity === id ? active : color}`}>
                  {severityLabel(lang, id)}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-secondary">
              {t(lang, 'sos_description')} <span className="font-normal normal-case text-secondary/70">{t(lang, 'sos_description_opt')}</span>
            </label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder={t(lang, 'sos_desc_placeholder')}
              className="w-full resize-none rounded-xl border border-primary/10 bg-slate-muted px-4 py-3 text-sm text-primary placeholder:text-secondary/50 outline-none transition focus:border-secondary/50 focus:bg-white focus:ring-1 focus:ring-secondary/20" />
          </div>

          {/* Coordinates */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-secondary">
              {t(lang, 'sos_lat')} / {t(lang, 'sos_lng')}
              {locationUnreliable && <span className="ml-2 text-red-500">{t(lang, 'sos_fix_wrong')}</span>}
            </label>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <input type="text" inputMode="decimal" value={manualLat} onChange={e => setManualLat(e.target.value)}
                placeholder={t(lang, 'sos_lat_placeholder')}
                className="rounded-xl border border-secondary/30 bg-white px-4 py-2.5 font-mono text-sm text-primary outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30" />
              <input type="text" inputMode="decimal" value={manualLng} onChange={e => setManualLng(e.target.value)}
                placeholder={t(lang, 'sos_lng_placeholder')}
                className="rounded-xl border border-secondary/30 bg-white px-4 py-2.5 font-mono text-sm text-primary outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30" />
            </div>
            <button type="button" onClick={applyManual}
              className="w-full rounded-xl border border-secondary/40 bg-secondary/8 py-2.5 text-xs font-bold uppercase tracking-wider text-secondary transition hover:bg-secondary/15">
              {t(lang, 'sos_apply_coords')}
            </button>
          </div>

          {/* GPS Fix Helpers */}
          {(locationUnreliable || geoError || mapPicked) && (
            <div className={`space-y-3 rounded-xl border px-4 py-3 ${locationUnreliable ? 'border-red-500/40 bg-red-500/8' : 'border-amber-500/30 bg-amber-500/8'}`}>
              <p className={`text-xs ${locationUnreliable ? 'text-red-600' : 'text-amber-700'}`}>
                {locationUnreliable && (
                  <>
                    <span className="font-bold">{t(lang, 'sos_pin_wrong')}</span> ({t(lang, 'sos_network_gps')}).{' '}
                  </>
                )}
                {geoError && <span>{geoError} </span>}
                <span className="font-semibold">{t(lang, 'sos_tap_map')}</span> {t(lang, 'sos_tap_map_fix')}
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setMapPicked(false); forcePreciseGPS(); }}
                  className="rounded-lg border border-secondary/50 bg-secondary/15 px-3 py-1.5 text-xs font-bold text-secondary transition hover:bg-secondary/25">
                  <MapPin size={14} className="inline" /> {t(lang, 'sos_device_gps')}
                </button>
                <button type="button" onClick={useNetworkApproximation}
                  className="rounded-lg border border-primary/20 px-3 py-1.5 text-xs text-secondary transition hover:border-secondary/40">
                  {t(lang, 'sos_network_only')}
                </button>
              </div>
            </div>
          )}

          {/* Success */}
          {submitted && (
            <div className="rounded-xl border border-secondary/40 bg-secondary/10 px-4 py-3 text-sm font-medium text-secondary">
              {t(lang, 'sos_success')}
            </div>
          )}

          {submitError && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600">
              {submitError}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center pt-2">
            <button type="button" onClick={() => handleSubmit(false)}
              disabled={submitting || !hasCoords}
              className="flex-1 rounded-xl border border-secondary/50 bg-secondary/10 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-secondary transition-all duration-300 hover:border-secondary hover:bg-secondary/20 hover:shadow-[0_0_20px_rgba(84,122,149,0.3)] disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? t(lang, 'sos_transmitting') : t(lang, 'sos_submit')}
            </button>
            <button type="button" onClick={handleSOS} disabled={submitting || !hasCoords}
              className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-500 bg-red-600 px-8 text-base font-black uppercase tracking-widest text-white transition-all duration-300 hover:bg-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] sm:w-auto sm:min-w-[130px] disabled:opacity-50 ${sosActive ? 'animate-pulse' : ''}`}>
              <CircleAlert size={22} strokeWidth={2.5} /> SOS
            </button>
          </div>
        </div>

        {/* Map Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary">{t(lang, 'sos_live_map')}</h2>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${isLiveBroadcast ? 'border-red-500/40 bg-red-500/10 text-red-500' : 'border-secondary/30 bg-secondary/10 text-secondary'}`}>
              {isLiveBroadcast ? `${t(lang, 'sos_broadcasting')} · Live` : t(lang, 'sos_tracking_label')}
            </span>
          </div>
          <LiveMap
            latitude={coords.lat} longitude={coords.lng}
            emergencyType={emergencyType} severity={severity}
            trail={positionTrail} accuracy={accuracy}
            locationSource={locationSource} loading={geoLoading}
            allowMapPick onMapClickPick={handleMapPick}
          />
          <p className="text-center text-xs text-secondary">
            {mapPicked ? t(lang, 'sos_map_pin_placed')
              : isLiveBroadcast ? t(lang, 'sos_map_trail')
              : t(lang, 'sos_map_gps_hint')}
          </p>
        </div>
      </div>
    </div>
  );
}
