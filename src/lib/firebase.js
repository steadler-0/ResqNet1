import { broadcastLocationToCoordinators } from './coordinatorFeed';
import { pushAlert } from './alertStore';
import { createEmergency, patchEmergencyLocation, checkApiHealth, getApiBase } from './emergencyApi';
import { emitSosRequest, getSocketUrl } from './socketClient';

export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

export async function submitEmergencyReport(report, reporter = {}) {
  const full = {
    ...report,
    reporterName: reporter.name || 'Citizen App',
    reporterEmail: reporter.email || '',
    reporterPhone: reporter.phone || '',
    latitude: report.latitude ?? report.lat,
    longitude: report.longitude ?? report.lng,
  };

  const apiUp = await checkApiHealth();
  if (!apiUp) {
    console.warn('[ResqNet] API health check failed — attempting socket / REST fallback @', getApiBase());
  }

  let emergencyId = full.id;
  let result = null;
  let socketErr = null;

  try {
    console.log('[ResqNet] Emitting sos_request via socket @', getSocketUrl());
    result = await emitSosRequest(full);
    emergencyId = result.emergency?.id || result.payload?.id || full.id;
    console.log('[ResqNet] sos_request broadcast ok', emergencyId);
  } catch (err) {
    socketErr = err;
    console.warn('[ResqNet] sos_request failed, REST fallback:', err.message);
    try {
      result = await createEmergency(full);
      emergencyId = result.emergency?.id || full.id;
    } catch (restErr) {
      console.error('[ResqNet] emergency REST create failed:', restErr);
      pushAlert({ ...full, status: 'Broadcasting' });
      if (!apiUp) throw new Error('api_offline');
      throw restErr;
    }
  }

  pushAlert({
    ...full,
    id: emergencyId,
    status: result?.emergency?.status || 'Broadcasting',
    nearbyCount: result?.nearbyCount ?? 'all',
    responderStatus: 'Request Received',
    locked: false,
  });

  return emergencyId;
}

export async function updateEmergencyLocation(alertId, locationPayload) {
  broadcastLocationToCoordinators(alertId, locationPayload);

  if (!(await checkApiHealth())) return alertId;

  try {
    await patchEmergencyLocation(alertId, locationPayload);
  } catch (err) {
    console.warn('[ResqNet] Location patch failed:', err.message);
  }
  return alertId;
}

export function subscribeToEmergencies() {
  return () => {};
}
