import { updateAlertLocation } from './alertStore';

const locationListeners = new Set();

export function subscribeToLocationUpdates(callback) {
  locationListeners.add(callback);
  return () => locationListeners.delete(callback);
}

export function broadcastLocationToCoordinators(alertId, payload) {
  const update = {
    alertId,
    ...payload,
    coordinatorReceivedAt: new Date().toISOString(),
  };
  updateAlertLocation(alertId, payload);
  locationListeners.forEach((cb) => cb(update));
  return update;
}
