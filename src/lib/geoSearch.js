/**
 * Haversine distance between two lat/lng points (in km)
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Filter facilities within a radius (km) of a point
 */
export function facilitiesNearby(facilities, lat, lng, radiusKm = 200) {
  return facilities
    .map((f) => ({ ...f, distance: haversineDistance(lat, lng, f.lat, f.lng) }))
    .filter((f) => f.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Geocode a location string using Nominatim (OpenStreetMap)
 */
export async function geocodeLocation(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error('Geocoding failed');
  return res.json();
}
