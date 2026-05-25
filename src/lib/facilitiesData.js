import { INDIA_FACILITIES as SEED } from '../data/rescueNetMock';

let cached = null;
let loading = null;

/** Load 3300+ facilities from generated JSON, fallback to seed */
export async function loadIndiaFacilities() {
  if (cached) return cached;
  if (loading) return loading;
  loading = (async () => {
    try {
      const res = await fetch('/facilities-india.json');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 100) {
          cached = [...SEED, ...data];
          return cached;
        }
      }
    } catch {
      /* offline or missing */
    }
    cached = SEED;
    return cached;
  })();
  return loading;
}

export function getFacilitiesSync() {
  return cached || SEED;
}
