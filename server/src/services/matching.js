import {
  distanceMeters,
  estimateEtaMinutes,
  formatDistance,
  isWithinRadius,
  MATCH_RADIUS_M,
} from '../geo.js';
import {
  getRejections,
  listAvailableResponders,
  recordRejection,
} from '../store.js';

export function findNearbyResponders(lat, lng, emergencyId = null) {
  const available = listAvailableResponders();
  const rejected = emergencyId ? getRejections(emergencyId) : new Set();

  return available
    .filter((r) => !rejected.has(r.id))
    .map((r) => {
      const distanceM = distanceMeters(lat, lng, r.lat, r.lng);
      return {
        ...r,
        distanceM,
        distanceLabel: formatDistance(distanceM),
        etaMinutes: estimateEtaMinutes(distanceM),
        withinRadius: distanceM <= MATCH_RADIUS_M,
      };
    })
    .filter((r) => r.withinRadius)
    .sort((a, b) => a.distanceM - b.distanceM);
}

export function buildOfferPayload(emergency, responder) {
  const distanceM = distanceMeters(
    emergency.lat,
    emergency.lng,
    responder.lat,
    responder.lng
  );
  return {
    emergencyId: emergency.id,
    type: emergency.type,
    severity: emergency.severity,
    priority: emergency.priority,
    sos: emergency.sos,
    description: emergency.description,
    citizenLat: emergency.lat,
    citizenLng: emergency.lng,
    locationLabel: emergency.locationLabel,
    distanceM,
    distanceLabel: formatDistance(distanceM),
    etaMinutes: estimateEtaMinutes(distanceM),
    timestamp: emergency.timestamp,
    status: emergency.responderStatus || 'Request Received',
  };
}

export function rejectOffer(emergencyId, responderId) {
  recordRejection(emergencyId, responderId);
}

export { isWithinRadius, MATCH_RADIUS_M };
