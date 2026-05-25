/**
 * Fast network fallback when GPS exceeds 5s (city-level, ~km accuracy).
 */

const IP_TIMEOUT_MS = 3000;

async function fetchIpApiCo() {
  const res = await fetch('https://ipapi.co/json/', {
    signal: AbortSignal.timeout(IP_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error('ipapi failed');
  const data = await res.json();
  if (data.latitude == null || data.longitude == null) throw new Error('no coords');
  return {
    lat: data.latitude,
    lng: data.longitude,
    accuracy: 5000,
    city: data.city,
  };
}

async function fetchIpApiCom() {
  const res = await fetch('http://ip-api.com/json/?fields=status,lat,lon,city', {
    signal: AbortSignal.timeout(IP_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error('ip-api failed');
  const data = await res.json();
  if (data.status !== 'success') throw new Error('ip-api error');
  return {
    lat: data.lat,
    lng: data.lon,
    accuracy: 5000,
    city: data.city,
  };
}

export async function fetchLocationFromIP() {
  try {
    return await fetchIpApiCo();
  } catch {
    return fetchIpApiCom();
  }
}
