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

/** Major Indian cities — used when Nominatim is unavailable or rate-limited */
const INDIA_PLACES = {
  'new delhi': { lat: 28.6139, lng: 77.209, label: 'New Delhi, India' },
  delhi: { lat: 28.6139, lng: 77.209, label: 'Delhi, India' },
  mumbai: { lat: 19.076, lng: 72.8777, label: 'Mumbai, India' },
  bombay: { lat: 19.076, lng: 72.8777, label: 'Mumbai, India' },
  bengaluru: { lat: 12.9716, lng: 77.5946, label: 'Bengaluru, India' },
  bangalore: { lat: 12.9716, lng: 77.5946, label: 'Bengaluru, India' },
  chennai: { lat: 13.0827, lng: 80.2707, label: 'Chennai, India' },
  madras: { lat: 13.0827, lng: 80.2707, label: 'Chennai, India' },
  kolkata: { lat: 22.5726, lng: 88.3639, label: 'Kolkata, India' },
  calcutta: { lat: 22.5726, lng: 88.3639, label: 'Kolkata, India' },
  hyderabad: { lat: 17.385, lng: 78.4867, label: 'Hyderabad, India' },
  pune: { lat: 18.5204, lng: 73.8567, label: 'Pune, India' },
  ahmedabad: { lat: 23.0225, lng: 72.5714, label: 'Ahmedabad, India' },
  jaipur: { lat: 26.9124, lng: 75.7873, label: 'Jaipur, India' },
  lucknow: { lat: 26.8467, lng: 80.9462, label: 'Lucknow, India' },
  chandigarh: { lat: 30.7333, lng: 76.7794, label: 'Chandigarh, India' },
  kochi: { lat: 9.9312, lng: 76.2673, label: 'Kochi, India' },
  goa: { lat: 15.2993, lng: 74.124, label: 'Goa, India' },
  patna: { lat: 25.5941, lng: 85.1376, label: 'Patna, India' },
  bhopal: { lat: 23.2599, lng: 77.4126, label: 'Bhopal, India' },
  indore: { lat: 22.7196, lng: 75.8577, label: 'Indore, India' },
  nagpur: { lat: 21.1458, lng: 79.0882, label: 'Nagpur, India' },
  surat: { lat: 21.1702, lng: 72.8311, label: 'Surat, India' },
  visakhapatnam: { lat: 17.6868, lng: 83.2185, label: 'Visakhapatnam, India' },
  guwahati: { lat: 26.1445, lng: 91.7362, label: 'Guwahati, India' },
};

function normalizeQuery(query) {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Match query to a known Indian city without network */
export function matchLocalPlace(query) {
  const q = normalizeQuery(query);
  if (!q) return null;
  if (INDIA_PLACES[q]) return { ...INDIA_PLACES[q] };

  for (const [key, place] of Object.entries(INDIA_PLACES)) {
    if (q === key || q.includes(key) || key.includes(q)) {
      return { ...place };
    }
  }
  return null;
}

/** Filter facilities whose name/address contains the query */
export function facilitiesByText(facilities, query) {
  const q = normalizeQuery(query);
  if (!q || q.length < 2) return [];
  return facilities
    .filter(
      (f) =>
        f.name?.toLowerCase().includes(q) ||
        f.address?.toLowerCase().includes(q) ||
        f.type?.toLowerCase().includes(q)
    )
    .slice(0, 50);
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

function nominatimToPlace(row) {
  return {
    lat: parseFloat(row.lat),
    lng: parseFloat(row.lon),
    label: row.display_name || row.name || 'Selected area',
  };
}

/**
 * Geocode via Nominatim (OpenStreetMap) — may fail when rate-limited
 */
export async function geocodeLocation(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
      'User-Agent': 'RescueNet/1.0 (emergency-app; localhost-dev)',
    },
  });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  return res.json();
}

/**
 * Resolve a place query: local city DB first, then Nominatim, then facility text match.
 */
export async function resolvePlaceQuery(query) {
  const trimmed = query?.trim();
  if (!trimmed) return null;

  const local = matchLocalPlace(trimmed);
  if (local) return local;

  try {
    const rows = await geocodeLocation(trimmed);
    if (rows?.length > 0) return nominatimToPlace(rows[0]);
  } catch {
    /* rate limit or offline — fall through */
  }

  return null;
}

/**
 * Search facilities near a resolved place + text matches in address/name.
 */
export function searchFacilitiesForQuery(facilities, query, radiusKm = 150) {
  const trimmed = query?.trim();
  if (!trimmed) return { place: null, facilities: [] };

  const place = matchLocalPlace(trimmed);
  let nearby = [];

  if (place) {
    nearby = facilitiesNearby(facilities, place.lat, place.lng, radiusKm);
  }

  const textMatches = facilitiesByText(facilities, trimmed);
  const seen = new Set();
  const merged = [];

  for (const f of [...nearby, ...textMatches]) {
    if (!seen.has(f.id)) {
      seen.add(f.id);
      merged.push(f);
    }
  }

  let resolvedPlace = place;
  if (!resolvedPlace && merged.length > 0) {
    resolvedPlace = {
      lat: merged[0].lat,
      lng: merged[0].lng,
      label: trimmed,
    };
  }

  return { place: resolvedPlace, facilities: merged.slice(0, 50) };
}

/** Async variant: tries Nominatim when local match fails */
export async function searchFacilitiesForQueryAsync(facilities, query, radiusKm = 150) {
  const trimmed = query?.trim();
  if (!trimmed) return { place: null, facilities: [] };

  let place = matchLocalPlace(trimmed);

  if (!place) {
    try {
      const rows = await geocodeLocation(trimmed);
      if (rows?.length > 0) place = nominatimToPlace(rows[0]);
    } catch {
      /* use text-only fallback */
    }
  }

  let nearby = [];
  if (place) {
    nearby = facilitiesNearby(facilities, place.lat, place.lng, radiusKm);
  }

  const textMatches = facilitiesByText(facilities, trimmed);
  const seen = new Set();
  const merged = [];

  for (const f of [...nearby, ...textMatches]) {
    if (!seen.has(f.id)) {
      seen.add(f.id);
      merged.push(f);
    }
  }

  let resolvedPlace = place;
  if (!resolvedPlace && merged.length > 0) {
    resolvedPlace = {
      lat: merged[0].lat,
      lng: merged[0].lng,
      label: trimmed,
    };
  }

  return { place: resolvedPlace, facilities: merged.slice(0, 50) };
}
