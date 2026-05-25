import { saveResponder, getResponder } from './store.js';

const TEAMS = [
  'NDRF', 'Fire & Rescue', 'Medical', 'Relief Corps', 'Civil Defence',
  'Coast Guard', 'State Disaster', 'Red Cross', 'Police Rescue', 'Municipal',
];

const VEHICLES = ['Rescue Van', 'Ambulance', '4x4', 'Fire Truck', 'Boat', 'Helicopter Support'];

const NAMES = [
  'Alpha Unit', 'Bravo Unit', 'Charlie Unit', 'Delta Unit', 'Echo Unit',
  'Foxtrot Unit', 'NDRF Squad 1', 'NDRF Squad 2', 'Medical Team A', 'Medical Team B',
  'Fire Unit 3', 'Relief Corps 5', 'Rapid Response 1', 'Rapid Response 2', 'Field Team 9',
];

/** Ensure ~15 available responders within 5 km of an emergency. */
export async function spawnRespondersNear(lat, lng, count = 15) {
  if (lat == null || lng == null) return [];

  const spawned = [];
  const latRad = (lat * Math.PI) / 180;

  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count + Math.random() * 0.15;
    const distM = 400 + (i / count) * 4200 + Math.random() * 350;
    const dLat = (distM / 111320) * Math.cos(angle);
    const dLng = (distM / (111320 * Math.cos(latRad))) * Math.sin(angle);

    const id = `r-zone-${i + 1}`;
    const doc = {
      id,
      name: NAMES[i % NAMES.length],
      team: TEAMS[i % TEAMS.length],
      vehicle: VEHICLES[i % VEHICLES.length],
      lat: lat + dLat,
      lng: lng + dLng,
      available: true,
      status: 'idle',
      activeEmergencyId: null,
      lastSeen: new Date().toISOString(),
      spawnedNear: `${lat.toFixed(3)},${lng.toFixed(3)}`,
    };
    await saveResponder(doc);
    spawned.push(doc);
  }

  const loginUnit = getResponder('r-ndrf-1');
  if (loginUnit) {
    loginUnit.lat = lat + 0.002;
    loginUnit.lng = lng + 0.002;
    loginUnit.available = true;
    loginUnit.activeEmergencyId = null;
    loginUnit.lastSeen = new Date().toISOString();
    await saveResponder(loginUnit);
    spawned.push(loginUnit);
  }

  return spawned;
}
