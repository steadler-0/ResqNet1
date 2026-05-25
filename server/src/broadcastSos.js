import { createEmergencyPayload } from './services/emergencyService.js';
import { saveEmergency } from './store.js';

/** Normalize SOS payload for all clients (no distance / radius filtering). */
export function buildIncomingEmergencyPayload(report) {
  const emergency = createEmergencyPayload(report);

  return {
    emergencyId: emergency.id,
    incidentId: emergency.id,
    id: emergency.id,
    type: emergency.type || 'Emergency',
    severity: emergency.severity || 'Critical',
    priority: emergency.priority || emergency.severity,
    sos: !!emergency.sos,
    description: emergency.description || '',
    latitude: emergency.lat,
    longitude: emergency.lng,
    citizenLat: emergency.lat,
    citizenLng: emergency.lng,
    locationLabel: emergency.locationLabel,
    timestamp: emergency.timestamp || new Date().toISOString(),
    status: emergency.status || 'Request Received',
    urgent: true,
    alertAt: Date.now(),
    distanceLabel: '—',
    etaMinutes: 5,
  };
}

/**
 * Debug broadcast: store + io.emit("incoming_emergency") to ALL connected clients.
 * No 5km / online / distance filtering.
 */
export async function broadcastSosToAll(io, report, { persist = true } = {}) {
  console.log('SOS received', report);

  const emergency = createEmergencyPayload(report);
  if (emergency.lat == null || emergency.lng == null) {
    return { ok: false, error: 'location_required' };
  }

  if (persist) {
    await saveEmergency(emergency);
  }

  const payload = buildIncomingEmergencyPayload(emergency);
  console.log('Broadcasting SOS', payload);

  io.emit('incoming_emergency', payload);

  io.to('coordinators').emit('emergency:created', emergency);
  io.to(`citizen:${emergency.id}`).emit('emergency:update', emergency);

  return {
    ok: true,
    emergency,
    payload,
    nearbyCount: 'all',
  };
}
