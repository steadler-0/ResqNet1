import { broadcastLocationToCoordinators } from './coordinatorFeed';
import { pushAlert } from './alertStore';

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
  };
  pushAlert(full);
  console.log('[ResqNet] Emergency report queued for coordinators:', full.id);
  return full.id;
}

export async function updateEmergencyLocation(alertId, locationPayload) {
  broadcastLocationToCoordinators(alertId, locationPayload);
  return alertId;
}

export function subscribeToEmergencies(callback) {
  return () => {};
}
