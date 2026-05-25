/** Distance in meters between two lat/lng points (Haversine). */
export function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** True if position changed enough to warrant a new coordinator ping. */
export function hasMovedSignificantly(prev, next, thresholdMeters = 3) {
  if (!prev?.lat || !next?.lat) return true;
  return distanceMeters(prev.lat, prev.lng, next.lat, next.lng) >= thresholdMeters;
}
