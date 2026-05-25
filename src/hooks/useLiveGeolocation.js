import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchLocationFromIP } from '../lib/ipGeolocation';

/** Precise device GPS — use first for accuracy */
const PRECISE_GPS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 10000,
};

const FAST_GPS = {
  enableHighAccuracy: false,
  maximumAge: 0,
  timeout: 5000,
};

const REFINE_WATCH = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 20000,
};

export const DEFAULT_MAP_CENTER = [12.9716, 77.5946];

function formatGpsLabel(accuracy) {
  if (accuracy == null || Number.isNaN(accuracy)) return 'GPS location';
  const m = Math.round(accuracy);
  if (m <= 15) return `Exact GPS · ±${m}m`;
  if (m <= 50) return `GPS · ±${m}m`;
  return `GPS · ±${m}m — tap map if pin looks wrong`;
}

function buildStateFromCoords(coordsRef, lat, lng, extra = {}) {
  coordsRef.current = { lat, lng };
  return {
    coords: { lat, lng },
    position: [lat, lng],
    accuracy: extra.accuracy ?? null,
    heading: extra.heading ?? null,
    speed: extra.speed ?? null,
    timestamp: extra.timestamp ?? Date.now(),
    loading: extra.loading ?? false,
    error: null,
    source: extra.source ?? 'gps',
    sourceLabel: extra.sourceLabel ?? null,
    isRefining: extra.isRefining ?? false,
  };
}

const tryGetCurrent = (options) =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

export default function useLiveGeolocation(enabled = true) {
  const [state, setState] = useState({
    coords: { lat: null, lng: null },
    position: null,
    accuracy: null,
    heading: null,
    speed: null,
    timestamp: null,
    loading: true,
    error: null,
    source: null,
    sourceLabel: 'Getting precise GPS…',
    isRefining: false,
  });

  const watchIdRef = useRef(null);
  const mountedRef = useRef(true);
  const coordsRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const stopWatching = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const applyCoords = useCallback((lat, lng, extra = {}) => {
    if (!mountedRef.current) return;
    setState((s) => ({
      ...s,
      ...buildStateFromCoords(coordsRef, lat, lng, {
        ...extra,
        sourceLabel:
          extra.sourceLabel ??
          (extra.source === 'gps' ? formatGpsLabel(extra.accuracy) : s.sourceLabel),
        loading: false,
        isRefining: false,
      }),
    }));
  }, []);

  const applyFromPosition = useCallback(
    (pos, source = 'gps') => {
      const acc = pos.coords.accuracy;
      const currentAcc = stateRef.current.accuracy;

      if (
        source === 'manual' ||
        coordsRef.current?.lat == null ||
        acc == null ||
        currentAcc == null ||
        acc <= currentAcc * 0.9
      ) {
        applyCoords(pos.coords.latitude, pos.coords.longitude, {
          accuracy: acc,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
          source,
        });
      }
    },
    [applyCoords]
  );

  const startPreciseWatch = useCallback(() => {
    if (!navigator.geolocation) return;
    stopWatching();
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => applyFromPosition(pos, 'gps'),
      () => {},
      REFINE_WATCH
    );
  }, [stopWatching, applyFromPosition]);

  const forcePreciseGPS = useCallback(async () => {
    if (!navigator.geolocation || !window.isSecureContext) {
      setState((s) => ({
        ...s,
        loading: false,
        error: 'Allow location permission, or set coordinates manually / tap the map.',
      }));
      return;
    }

    stopWatching();
    setState((s) => ({
      ...s,
      loading: true,
      error: null,
      sourceLabel: 'Getting exact GPS (allow location)…',
      isRefining: true,
    }));

    startPreciseWatch();

    try {
      const pos = await tryGetCurrent(PRECISE_GPS);
      if (!mountedRef.current) return;
      applyFromPosition(pos, 'gps');
    } catch {
      try {
        const pos = await tryGetCurrent(FAST_GPS);
        if (!mountedRef.current) return;
        applyFromPosition(pos, 'gps');
      } catch (err) {
        if (!mountedRef.current) return;
        setState((s) => ({
          ...s,
          loading: false,
          isRefining: false,
          error:
            'GPS failed. Tap your exact spot on the map → or type latitude & longitude below.',
        }));
      }
    }
  }, [stopWatching, startPreciseWatch, applyFromPosition]);

  const useNetworkApproximation = useCallback(async () => {
    stopWatching();
    setState((s) => ({ ...s, loading: true, sourceLabel: 'Network location (often wrong)…' }));
    try {
      const ip = await fetchLocationFromIP();
      if (!mountedRef.current) return;
      applyCoords(ip.lat, ip.lng, {
        accuracy: 5000,
        source: 'ip',
        sourceLabel: `⚠ Approximate (${ip.city || 'network'}) — NOT exact. Tap map to fix.`,
      });
    } catch {
      setState((s) => ({
        ...s,
        loading: false,
        error: 'Could not detect location. Tap the map to set your position.',
      }));
    }
  }, [applyCoords, stopWatching]);

  const setExactLocation = useCallback(
    (lat, lng, label = 'Exact location (you set)') => {
      stopWatching();
      applyCoords(lat, lng, {
        source: 'manual',
        sourceLabel: label,
        accuracy: 3,
      });
    },
    [applyCoords, stopWatching]
  );

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      stopWatching();
      return () => {
        mountedRef.current = false;
      };
    }

    if (!window.isSecureContext) {
      setState((s) => ({
        ...s,
        loading: false,
        error: 'Open http://localhost:5173',
      }));
      return () => {
        mountedRef.current = false;
      };
    }

    forcePreciseGPS();
    return () => {
      mountedRef.current = false;
      stopWatching();
    };
  }, [enabled, forcePreciseGPS, stopWatching]);

  return {
    ...state,
    retry: forcePreciseGPS,
    requestPreciseGPS: forcePreciseGPS,
    forcePreciseGPS,
    useNetworkApproximation,
    setDemoLocation: setExactLocation,
    setExactLocation,
  };
}
