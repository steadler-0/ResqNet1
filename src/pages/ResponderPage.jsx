import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Navigation,
  MapPin,
  Radio,
  Check,
  X,
  ChevronRight,
  CircleAlert,
  Clock,
} from 'lucide-react';
import LiveMap from '../components/LiveMap';
import useLiveGeolocation from '../hooks/useLiveGeolocation';
import { useAuth } from '../lib/AuthContext';
import { DisasterIcon } from '../lib/iconMaps';
import {
  acceptEmergency,
  rejectEmergency,
  updateMissionStatus,
  responderHeartbeat,
} from '../lib/emergencyApi';
import { emitResponderLocation, disconnectResponderSocket, getSocketUrl } from '../lib/socketClient';
import { ensureResponderAlertWire, onResponderAlert, pingResponderOnline } from '../lib/responderAlertBus';
import { requestNotificationPermission, showLocalNotification } from '../lib/pushNotifications';
import { playEmergencyAlert, vibrateEmergencyAlert } from '../lib/alertSound';
import { useLang } from '../lib/LanguageContext';
import { t } from '../lib/i18n';
import { disasterLabel, severityLabel, responderStatusLabel } from '../lib/disasterI18n';

const STATUS_FLOW = [
  'Request Received',
  'Accepted',
  'On The Way',
  'Arrived',
  'Completed',
];

const STATUS_STYLES = {
  'Request Received': 'bg-amber-500/15 text-amber-700 border-amber-500/40',
  Accepted: 'bg-violet-500/15 text-violet-700 border-violet-500/40',
  'On The Way': 'bg-blue-500/15 text-blue-700 border-blue-500/40',
  Arrived: 'bg-secondary/15 text-secondary border-secondary/40',
  Completed: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40',
};

export default function ResponderPage({ searchPlace, searchPlaceTick = 0 }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const responderId = user?.responderId || 'r-ndrf-1';
  const {
    coords,
    accuracy,
    loading: geoLoading,
    forcePreciseGPS,
    setExactLocation,
  } = useLiveGeolocation(true);

  const [online, setOnline] = useState(true);
  const [incoming, setIncoming] = useState(null);
  const [activeMission, setActiveMission] = useState(null);
  const [missionStatus, setMissionStatus] = useState('Accepted');
  const [accepting, setAccepting] = useState(false);
  const [toast, setToast] = useState(null);
  const [socketStatus, setSocketStatus] = useState('connecting');
  const dismissedRef = useRef(new Set());
  const activeMissionRef = useRef(null);
  activeMissionRef.current = activeMission;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (searchPlaceTick === 0 || searchPlace?.lat == null) return;
    setExactLocation(
      searchPlace.lat,
      searchPlace.lng,
      searchPlace.label || 'Search location'
    );
    showToast(`${searchPlace.label}`);
  }, [searchPlaceTick, searchPlace, setExactLocation]);

  const pulseLocation = useCallback(async () => {
    if (coords.lat == null) return;
    try {
      await responderHeartbeat(responderId, {
        lat: coords.lat,
        lng: coords.lng,
        available: online && !activeMission,
      });
      emitResponderLocation(responderId, coords.lat, coords.lng);
    } catch {
      /* offline API */
    }
  }, [coords.lat, coords.lng, online, activeMission, responderId]);

  useEffect(() => {
    requestNotificationPermission();
    pulseLocation();
    const t = setInterval(pulseLocation, 8000);
    return () => clearInterval(t);
  }, [pulseLocation]);

  const handleIncomingOffer = useCallback(
    (offer) => {
      console.log('Emergency received', offer);
      const eid = offer.emergencyId || offer.incidentId || offer.id;
      if (!eid) {
        showToast(t(lang, 'resp_alert_title'));
        return;
      }
      if (activeMissionRef.current || dismissedRef.current.has(eid)) return;

      const normalized = { ...offer, emergencyId: eid };
      playEmergencyAlert();
      vibrateEmergencyAlert();
      setIncoming(normalized);

      const title = offer.sos ? t(lang, 'resp_alert_title_sos') : t(lang, 'resp_alert_title');
      const dist = offer.distanceLabel || '—';
      const eta = offer.etaMinutes ?? '—';
      const body = `${disasterLabel(lang, offer.type)} · ${dist} · ~${eta} min`;
      showToast(`${title}: ${disasterLabel(lang, offer.type)} (${dist})`);
      showLocalNotification(title, body, eid);
    },
    [lang]
  );

  /* Alert listeners — stable, not torn down on GPS ticks */
  useEffect(() => {
    if (!online) {
      setSocketStatus('offline');
      disconnectResponderSocket();
      return undefined;
    }

    setSocketStatus('connecting');
    console.log('[ResqNet] Responder subscribing, socket:', getSocketUrl());

    ensureResponderAlertWire(responderId);
    const s = pingResponderOnline(
      responderId,
      coords.lat != null ? coords : { lat: 12.9716, lng: 77.5946 }
    );

    const unsubAlert = onResponderAlert(handleIncomingOffer);

    const onAck = () => setSocketStatus('connected');
    s.on('responder:online:ack', onAck);

    const onLocked = ({ emergencyId }) => {
      setIncoming((cur) => (cur?.emergencyId === emergencyId ? null : cur));
      dismissedRef.current.add(emergencyId);
    };
    const onAssigned = ({ emergency }) => {
      setActiveMission(emergency);
      setIncoming(null);
      setMissionStatus(emergency.responderStatus || 'Accepted');
      showToast(t(lang, 'resp_mission_assigned'));
    };
    const onLocation = ({ lat, lng }) => {
      setActiveMission((m) => (m ? { ...m, lat, lng, citizenLat: lat, citizenLng: lng } : m));
    };
    const onStatus = ({ responderStatus }) => setMissionStatus(responderStatus);

    s.on('emergency:locked', onLocked);
    s.on('emergency:assigned', onAssigned);
    s.on('emergency:location', onLocation);
    s.on('emergency:status', onStatus);
    s.on('connect', () => setSocketStatus('connected'));

    return () => {
      unsubAlert();
      s.off('responder:online:ack', onAck);
      s.off('emergency:locked', onLocked);
      s.off('emergency:assigned', onAssigned);
      s.off('emergency:location', onLocation);
      s.off('emergency:status', onStatus);
    };
  }, [online, responderId, handleIncomingOffer]);

  /* Re-ping location without re-subscribing alerts */
  useEffect(() => {
    if (!online || coords.lat == null) return;
    pingResponderOnline(responderId, coords);
  }, [online, responderId, coords.lat, coords.lng]);

  const handleAccept = async () => {
    if (!incoming) return;
    setAccepting(true);
    try {
      const { emergency } = await acceptEmergency(incoming.emergencyId, responderId);
      setActiveMission({
        ...emergency,
        citizenLat: incoming.citizenLat,
        citizenLng: incoming.citizenLng,
      });
      setIncoming(null);
      setMissionStatus('Accepted');
      showToast(t(lang, 'resp_you_accepted'));
    } catch (err) {
      if (err.data?.error === 'already_assigned') {
        showToast(t(lang, 'resp_another_accepted'));
        setIncoming(null);
      } else {
        showToast(t(lang, 'resp_accept_failed'));
      }
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!incoming) return;
    dismissedRef.current.add(incoming.emergencyId);
    try {
      await rejectEmergency(incoming.emergencyId, responderId);
    } catch {
      /* ok */
    }
    setIncoming(null);
  };

  const advanceStatus = async () => {
    if (!activeMission) return;
    const idx = STATUS_FLOW.indexOf(missionStatus);
    const next = STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)];
    if (next === missionStatus) return;
    try {
      await updateMissionStatus(activeMission.id || activeMission.emergencyId, responderId, next);
      setMissionStatus(next);
      if (next === 'Completed') {
        setActiveMission(null);
        setOnline(true);
        showToast(t(lang, 'resp_mission_done'));
      }
    } catch {
      setMissionStatus(next);
    }
  };

  const mission = activeMission;
  const citizenLat = mission?.citizenLat ?? mission?.lat;
  const citizenLng = mission?.citizenLng ?? mission?.lng;

  return (
    <div className="mx-auto max-w-lg">
      {toast && (
        <div className="fixed top-20 left-1/2 z-[2000] -translate-x-1/2 rounded-xl border border-secondary/40 bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Header — driver app style */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">{t(lang, 'resp_title')}</p>
          <h1 className="text-xl font-bold text-primary">{user?.name || 'Rescue Unit'}</h1>
          <p className="text-xs text-muted">{user?.team || 'Field Team'}</p>
        </div>
        <button
          type="button"
          onClick={() => setOnline((o) => !o)}
          className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${
            online
              ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/40'
              : 'bg-slate-muted text-muted border border-primary/10'
          }`}
        >
          {online ? `● ${t(lang, 'resp_online')}` : t(lang, 'resp_offline')}
        </button>
      </div>
      {online && (
        <p className="mb-2 text-[10px] font-mono text-muted">
          Socket: {socketStatus} · {getSocketUrl()}
        </p>
      )}

      {/* Status card */}
      <div className="rn-card mb-4">
        <div className="flex items-center gap-3">
          <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${online ? 'bg-secondary/15' : 'bg-slate-muted'}`}>
            <Radio size={22} className={online ? 'text-secondary' : 'text-muted'} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-primary">
              {mission ? t(lang, 'resp_on_mission') : online ? t(lang, 'resp_waiting') : t(lang, 'resp_go_online')}
            </p>
            <p className="text-xs text-muted">
              {coords.lat != null
                ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                : t(lang, 'sos_locating')}
            </p>
          </div>
          <button type="button" onClick={forcePreciseGPS} className="text-xs font-semibold text-secondary hover:underline">
            {t(lang, 'resp_refresh_gps')}
          </button>
        </div>
      </div>

      {/* Incoming request popup */}
      {incoming && !mission && (
        <div className="fixed inset-x-4 bottom-24 z-[1500] md:bottom-8 md:left-auto md:right-8 md:max-w-md animate-[rn-page-in_0.25s_ease-out]">
          <div className="overflow-hidden rounded-2xl border-2 border-red-500/50 bg-white shadow-[0_8px_40px_rgba(44,57,71,0.2)]">
            <div className="bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <CircleAlert size={20} />
                <span className="text-sm font-black uppercase tracking-wider">
                  {incoming.sos ? t(lang, 'resp_sos_request') : t(lang, 'resp_emergency_request')}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <DisasterIcon type={incoming.type} className="h-8 w-8 text-secondary shrink-0" />
                <div>
                  <p className="font-bold text-primary">{disasterLabel(lang, incoming.type)}</p>
                  <p className="text-xs text-muted line-clamp-2">{incoming.description || t(lang, 'resp_citizen_help')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-slate-muted px-3 py-2">
                  <p className="text-[10px] uppercase text-muted">{t(lang, 'resp_distance')}</p>
                  <p className="text-lg font-bold text-primary">{incoming.distanceLabel}</p>
                </div>
                <div className="rounded-xl bg-slate-muted px-3 py-2">
                  <p className="text-[10px] uppercase text-muted">ETA</p>
                  <p className="text-lg font-bold text-primary flex items-center gap-1">
                    <Clock size={16} /> ~{incoming.etaMinutes} min
                  </p>
                </div>
              </div>
              <span
                className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                  incoming.severity === 'Critical'
                    ? 'border-red-500/50 bg-red-500/10 text-red-600'
                    : 'border-secondary/40 bg-secondary/10 text-secondary'
                }`}
              >
                {severityLabel(lang, incoming.severity)}
              </span>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleReject}
                  className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-primary/15 py-3.5 text-sm font-bold text-secondary hover:bg-slate-muted"
                >
                  <X size={18} /> {t(lang, 'resp_reject')}
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={accepting}
                  className="flex flex-[1.4] items-center justify-center gap-1 rounded-xl bg-primary py-3.5 text-sm font-black uppercase text-white shadow-[0_4px_20px_rgba(44,57,71,0.25)] hover:bg-primary-dark disabled:opacity-60"
                >
                  <Check size={20} /> {accepting ? t(lang, 'resp_accepting') : t(lang, 'resp_accept')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active mission */}
      {mission && (
        <div className="space-y-4">
          <div className="rn-card border-secondary/30">
            <div className="mb-3 flex items-center justify-between">
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${STATUS_STYLES[missionStatus]}`}>
                {responderStatusLabel(lang, missionStatus)}
              </span>
              {mission.etaMinutes != null && (
                <span className="text-xs font-semibold text-secondary">ETA ~{mission.etaMinutes} min</span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <DisasterIcon type={mission.type} className="h-5 w-5 text-secondary" />
              <p className="font-bold text-primary">{disasterLabel(lang, mission.type)}</p>
            </div>
            <p className="flex items-center gap-1 text-xs text-muted mb-4">
              <MapPin size={14} />
              {mission.locationLabel || `${citizenLat?.toFixed(4)}, ${citizenLng?.toFixed(4)}`}
            </p>
            {mission.distanceLabel && (
              <p className="text-sm text-secondary mb-4">Distance: {mission.distanceLabel}</p>
            )}

            <LiveMap
              latitude={citizenLat}
              longitude={citizenLng}
              emergencyType={mission.type}
              severity={mission.severity}
              loading={geoLoading}
              allowMapPick={false}
            />

            <p className="mt-2 text-center text-[10px] text-muted">{t(lang, 'resp_route_preview')}</p>

            <div className="mt-4 flex gap-2">
              <a
                href={
                  citizenLat != null
                    ? `https://www.google.com/maps/dir/?api=1&destination=${citizenLat},${citizenLng}`
                    : '#'
                }
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-secondary/40 bg-secondary/10 py-3 text-sm font-bold text-secondary"
              >
                <Navigation size={18} /> {t(lang, 'resp_navigate')}
              </a>
              <button
                type="button"
                onClick={advanceStatus}
                disabled={missionStatus === 'Completed'}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary-dark"
              >
                {missionStatus === 'Arrived' ? t(lang, 'resp_complete') : t(lang, 'resp_update_status')}
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="flex justify-between gap-1 px-1">
            {STATUS_FLOW.slice(1).map((s) => {
              const done = STATUS_FLOW.indexOf(missionStatus) >= STATUS_FLOW.indexOf(s);
              return (
                <div key={s} className="flex-1 text-center">
                  <div
                    className={`mx-auto mb-1 h-1.5 rounded-full ${done ? 'bg-secondary' : 'bg-primary/10'}`}
                  />
                  <span className={`text-[8px] font-semibold uppercase ${done ? 'text-secondary' : 'text-muted'}`}>
                    {s.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!mission && !incoming && online && (
        <div className="rn-card text-center py-12">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
            <Radio size={32} className="text-secondary animate-pulse" />
          </div>
          <p className="font-semibold text-primary">{t(lang, 'resp_listening')}</p>
          <p className="mt-1 text-sm text-muted">{t(lang, 'resp_listening_sub')}</p>
        </div>
      )}
    </div>
  );
}
