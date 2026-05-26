const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'https://resqnet1-x9e8.onrender.com/api';

const REQUEST_TIMEOUT_MS = 15000;

async function request(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      signal: controller.signal,
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw Object.assign(new Error(data.error || 'request_failed'), { status: res.status, data });
    }
    return data;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('request_timeout');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function createEmergency(report) {
  return request('/emergencies', { method: 'POST', body: JSON.stringify(report) });
}

export async function patchEmergencyLocation(alertId, payload) {
  return request(`/emergencies/${alertId}/location`, {
    method: 'PATCH',
    body: JSON.stringify({
      latitude: payload.latitude ?? payload.lat,
      longitude: payload.longitude ?? payload.lng,
    }),
  });
}

export async function acceptEmergency(emergencyId, responderId) {
  return request(`/emergencies/${emergencyId}/accept`, {
    method: 'POST',
    body: JSON.stringify({ responderId }),
  });
}

export async function rejectEmergency(emergencyId, responderId) {
  return request(`/emergencies/${emergencyId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ responderId }),
  });
}

export async function updateMissionStatus(emergencyId, responderId, responderStatus) {
  return request(`/emergencies/${emergencyId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ responderId, responderStatus }),
  });
}

export async function responderHeartbeat(responderId, { lat, lng, available }) {
  return request(`/responders/${responderId}/heartbeat`, {
    method: 'POST',
    body: JSON.stringify({ lat, lng, available }),
  });
}

export async function fetchEmergency(id) {
  return request(`/emergencies/${id}`);
}

export async function fetchEmergencies() {
  return request('/emergencies');
}

export async function checkApiHealth() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

export function getApiBase() {
  return API_BASE;
}
