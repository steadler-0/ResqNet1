/**
 * Real-time alert bus — SOS reports appear instantly for coordinators.
 * Persists to localStorage for cross-tab sync.
 */

const STORAGE_KEY = 'rescuenet_alerts';
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(alerts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts.slice(0, 200)));
  } catch {
    /* quota */
  }
}

function notify() {
  const alerts = load();
  listeners.forEach((cb) => cb(alerts));
}

export function getAlerts() {
  return load();
}

export function subscribeToAlerts(callback) {
  listeners.add(callback);
  callback(load());
  const onStorage = (e) => {
    if (e.key === STORAGE_KEY) callback(load());
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

/**
 * @param {object} report — from SOS submit
 */
export function pushAlert(report) {
  const alerts = load();
  const priority = report.sos || report.severity === 'Critical' ? 'Critical' : report.severity || 'Medium';
  const entry = {
    id: report.id || `alert-${Date.now()}`,
    type: report.type || 'Emergency',
    location: report.locationLabel || formatLocation(report),
    lat: report.latitude ?? report.lat,
    lng: report.longitude ?? report.lng,
    time: 'Just now',
    timestamp: report.timestamp || new Date().toISOString(),
    reporter: report.reporter || report.reporterName || 'Citizen App',
    reporterEmail: report.reporterEmail || '',
    reporterPhone: report.reporterPhone || '',
    priority,
    severity: report.severity || priority,
    status: 'Unassigned',
    description: report.description || '',
    scarcity: report.scarcity || [],
    sos: !!report.sos,
    responder: null,
    liveTracking: !!report.liveTracking,
  };
  const next = [entry, ...alerts.filter((a) => a.id !== entry.id)].slice(0, 200);
  save(next);
  notify();
  return entry;
}

export function updateAlert(id, patch) {
  const alerts = load().map((a) => (a.id === id ? { ...a, ...patch } : a));
  save(alerts);
  notify();
}

export function updateAlertLocation(alertId, payload) {
  const alerts = load().map((a) =>
    a.id === alertId
      ? {
          ...a,
          lat: payload.latitude ?? a.lat,
          lng: payload.longitude ?? a.lng,
          lastGpsUpdate: payload.timestamp || new Date().toISOString(),
          liveTracking: true,
        }
      : a
  );
  save(alerts);
  notify();
}

function formatLocation(report) {
  if (report.latitude != null && report.longitude != null) {
    return `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`;
  }
  return 'India';
}
