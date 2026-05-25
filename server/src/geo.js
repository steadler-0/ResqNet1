const R = 6371000;

function toRad(d) {
  return (d * Math.PI) / 180;
}

/** Distance in meters (Haversine). */
export function distanceMeters(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const MATCH_RADIUS_M = 5000;

export function isWithinRadius(lat1, lng1, lat2, lng2, radiusM = MATCH_RADIUS_M) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return false;
  return distanceMeters(lat1, lng1, lat2, lng2) <= radiusM;
}

/** Rough ETA in minutes (urban rescue ~25 km/h average). */
export function estimateEtaMinutes(distanceM, speedKmh = 25) {
  if (!distanceM || distanceM <= 0) return 1;
  const hours = distanceM / 1000 / speedKmh;
  return Math.max(1, Math.ceil(hours * 60));
}

export function formatDistance(m) {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}
