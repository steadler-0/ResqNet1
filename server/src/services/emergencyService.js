import {
  distanceMeters,
  estimateEtaMinutes,
  formatDistance,
} from '../geo.js';
import {
  getEmergency,
  getResponder,
  saveEmergency,
  saveResponder,
} from '../store.js';
import { findNearbyResponders, buildOfferPayload } from './matching.js';
import { spawnRespondersNear } from '../spawnResponders.js';
import { notifyCitizen, notifyResponder, CITIZEN_MESSAGES } from './notifications.js';
import { syncResponderLocation } from './firebase.js';
import {
  emitToResponderPool,
  emitToResponder,
  getOnlineResponderCount,
  isResponderOnline,
} from '../onlineRegistry.js';

const RESPONDER_STATUSES = [
  'Request Received',
  'Accepted',
  'On The Way',
  'Arrived',
  'Completed',
];

export function createEmergencyPayload(body) {
  const id = body.id || `alert-${Date.now()}`;
  const priority =
    body.sos || body.severity === 'Critical'
      ? 'Critical'
      : body.severity || 'Medium';

  return {
    id,
    type: body.type || 'Emergency',
    severity: body.severity || priority,
    priority,
    description: body.description || '',
    scarcity: body.scarcity || [],
    sos: !!body.sos,
    lat: body.latitude ?? body.lat,
    lng: body.longitude ?? body.lng,
    accuracy: body.accuracy,
    locationLabel:
      body.locationLabel ||
      (body.latitude != null
        ? `${Number(body.latitude).toFixed(4)}, ${Number(body.longitude).toFixed(4)}`
        : 'India'),
    reporter: body.reporterName || body.reporter || 'Citizen App',
    reporterEmail: body.reporterEmail || '',
    reporterPhone: body.reporterPhone || '',
    timestamp: body.timestamp || new Date().toISOString(),
    status: 'Broadcasting',
    responderStatus: 'Request Received',
    locked: false,
    responderId: null,
    responderName: null,
    etaMinutes: null,
    distanceLabel: null,
    liveTracking: true,
    offeredTo: [],
    broadcastAt: new Date().toISOString(),
  };
}

export async function broadcastEmergency(emergency, io) {
  console.log('[RescueNet] SOS received — broadcasting:', emergency.id, emergency.type, emergency.severity);

  await spawnRespondersNear(emergency.lat, emergency.lng, 15);
  const nearby = findNearbyResponders(emergency.lat, emergency.lng, emergency.id);
  emergency.offeredTo = nearby.map((r) => r.id);
  emergency.nearbyCount = nearby.length;
  await saveEmergency(emergency);

  await notifyCitizen(emergency, CITIZEN_MESSAGES.broadcasting);

  const basePayload = {
    emergencyId: emergency.id,
    incidentId: emergency.id,
    id: emergency.id,
    type: emergency.type,
    severity: emergency.severity,
    priority: emergency.priority,
    sos: emergency.sos,
    description: emergency.description,
    citizenLat: emergency.lat,
    citizenLng: emergency.lng,
    latitude: emergency.lat,
    longitude: emergency.lng,
    locationLabel: emergency.locationLabel,
    timestamp: emergency.timestamp,
    status: emergency.responderStatus || 'Request Received',
    urgent: true,
    alertAt: Date.now(),
  };

  const onlinePool = getOnlineResponderCount();
  console.log('[RescueNet] Broadcasting to responders:', {
    nearby: nearby.length,
    onlineSockets: onlinePool,
  });

  const notifiedOnline = new Set();

  for (const responder of nearby) {
    const offer = { ...basePayload, ...buildOfferPayload(emergency, responder) };

    if (isResponderOnline(responder.id)) {
      emitToResponder(io, responder.id, 'emergency:offer', offer);
      emitToResponder(io, responder.id, 'emergency:alert', offer);
      notifiedOnline.add(responder.id);
    }

    await notifyResponder(
      responder,
      `New ${emergency.sos ? 'SOS' : 'emergency'} nearby — ${offer.distanceLabel}`,
      emergency
    );
  }

  const poolPayload = {
    ...basePayload,
    distanceLabel: nearby[0]?.distanceLabel,
    distanceM: nearby[0]?.distanceM,
    etaMinutes: nearby[0]?.etaMinutes,
    nearbyCount: nearby.length,
  };

  const poolCount = await emitToResponderPool(io, 'emergency:alert', poolPayload, emergency);
  await emitToResponderPool(io, 'emergency:offer', poolPayload, emergency);

  console.log('[RescueNet] Broadcast complete — online notified:', notifiedOnline.size, 'pool sockets:', poolCount);

  io.to('coordinators').emit('emergency:created', emergency);
  io.to(`citizen:${emergency.id}`).emit('emergency:update', sanitizeForCitizen(emergency));

  return { emergency, nearbyCount: nearby.length, onlineNotified: notifiedOnline.size };
}

export async function tryAcceptEmergency(emergencyId, responderId, io) {
  const emergency = getEmergency(emergencyId);
  if (!emergency) return { ok: false, error: 'not_found' };
  if (emergency.locked) return { ok: false, error: 'already_assigned' };

  const responder = getResponder(responderId);
  if (!responder) return { ok: false, error: 'responder_not_found' };

  if (responder.activeEmergencyId === emergencyId) {
    if (emergency.locked && emergency.responderId === responderId) {
      return { ok: true, emergency };
    }
  }

  if (responder.activeEmergencyId) {
    const prev = getEmergency(responder.activeEmergencyId);
    const stale =
      !prev ||
      prev.status === 'Resolved' ||
      prev.responderId !== responderId ||
      !prev.locked;
    if (stale) {
      responder.activeEmergencyId = null;
      responder.status = 'idle';
      responder.available = true;
      await saveResponder(responder);
    }
  }

  if (!responder.available || responder.activeEmergencyId) {
    return { ok: false, error: 'responder_unavailable' };
  }

  const distanceM = distanceMeters(emergency.lat, emergency.lng, responder.lat, responder.lng);
  const etaMinutes = estimateEtaMinutes(distanceM);

  emergency.locked = true;
  emergency.responderId = responderId;
  emergency.responderName = responder.name;
  emergency.status = 'Assigned';
  emergency.responderStatus = 'Accepted';
  emergency.assignedAt = new Date().toISOString();
  emergency.etaMinutes = etaMinutes;
  emergency.distanceLabel = formatDistance(distanceM);
  await saveEmergency(emergency);

  responder.available = false;
  responder.activeEmergencyId = emergencyId;
  responder.status = 'on_mission';
  await saveResponder(responder);

  await notifyCitizen(emergency, CITIZEN_MESSAGES.accepted);
  await notifyCitizen(emergency, CITIZEN_MESSAGES.onTheWay);

  io.to('coordinators').emit('emergency:assigned', emergency);
  io.to(`citizen:${emergencyId}`).emit('emergency:update', sanitizeForCitizen(emergency));
  io.to(`responder:${responderId}`).emit('emergency:assigned', { emergencyId, emergency });

  // Lock for all other responders
  for (const rid of emergency.offeredTo || []) {
    if (rid !== responderId) {
      io.to(`responder:${rid}`).emit('emergency:locked', { emergencyId, assignedTo: responder.name });
    }
  }
  const lockPayload = { emergencyId, assignedTo: responder.name };
  await emitToResponderPool(io, 'emergency:locked', lockPayload, null);
  io.emit('emergency:locked', lockPayload);

  return { ok: true, emergency };
}

export async function updateResponderStatus(emergencyId, responderId, responderStatus, io) {
  const emergency = getEmergency(emergencyId);
  if (!emergency || emergency.responderId !== responderId) {
    return { ok: false, error: 'forbidden' };
  }
  if (!RESPONDER_STATUSES.includes(responderStatus)) {
    return { ok: false, error: 'invalid_status' };
  }

  emergency.responderStatus = responderStatus;
  if (responderStatus === 'On The Way') emergency.status = 'In Progress';
  if (responderStatus === 'Arrived') emergency.status = 'In Progress';
  if (responderStatus === 'Completed') {
    emergency.status = 'Resolved';
    const responder = getResponder(responderId);
    if (responder) {
      responder.available = true;
      responder.activeEmergencyId = null;
      responder.status = 'idle';
      await saveResponder(responder);
    }
    await notifyCitizen(emergency, CITIZEN_MESSAGES.completed);
  } else if (responderStatus === 'On The Way') {
    await notifyCitizen(emergency, CITIZEN_MESSAGES.onTheWay);
  } else if (responderStatus === 'Arrived') {
    await notifyCitizen(emergency, CITIZEN_MESSAGES.arrived);
  }

  await saveEmergency(emergency);
  io.to(`citizen:${emergencyId}`).emit('emergency:update', sanitizeForCitizen(emergency));
  io.to('coordinators').emit('emergency:updated', emergency);
  io.to(`responder:${responderId}`).emit('emergency:status', { emergencyId, responderStatus });

  return { ok: true, emergency };
}

export async function updateCitizenLocation(emergencyId, lat, lng, io) {
  const emergency = getEmergency(emergencyId);
  if (!emergency) return null;
  emergency.lat = lat;
  emergency.lng = lng;
  emergency.lastGpsUpdate = new Date().toISOString();
  await saveEmergency(emergency);
  io.to('coordinators').emit('emergency:location', { emergencyId, lat, lng });
  if (emergency.responderId) {
    io.to(`responder:${emergency.responderId}`).emit('emergency:location', { emergencyId, lat, lng });
  }
  io.to(`citizen:${emergencyId}`).emit('emergency:update', sanitizeForCitizen(emergency));
  return emergency;
}

export async function updateResponderLocation(responderId, lat, lng, io) {
  const responder = getResponder(responderId);
  if (!responder) return null;
  responder.lat = lat;
  responder.lng = lng;
  responder.lastSeen = new Date().toISOString();
  await saveResponder(responder);
  await syncResponderLocation(responderId, lat, lng);

  if (responder.activeEmergencyId) {
    const emergency = getEmergency(responder.activeEmergencyId);
    if (emergency?.lat != null) {
      const distanceM = distanceMeters(emergency.lat, emergency.lng, lat, lng);
      emergency.etaMinutes = estimateEtaMinutes(distanceM);
      emergency.distanceLabel = formatDistance(distanceM);
      await saveEmergency(emergency);
      io.to(`citizen:${emergency.id}`).emit('emergency:eta', {
        emergencyId: emergency.id,
        etaMinutes: emergency.etaMinutes,
        distanceLabel: emergency.distanceLabel,
      });
    }
  }
  io.to('coordinators').emit('responder:location', { responderId, lat, lng });
  return responder;
}

function sanitizeForCitizen(emergency) {
  return {
    id: emergency.id,
    type: emergency.type,
    severity: emergency.severity,
    priority: emergency.priority,
    status: emergency.status,
    responderStatus: emergency.responderStatus,
    locked: emergency.locked,
    responderName: emergency.responderName,
    etaMinutes: emergency.etaMinutes,
    distanceLabel: emergency.distanceLabel,
    nearbyCount: emergency.nearbyCount,
    lat: emergency.lat,
    lng: emergency.lng,
    timestamp: emergency.timestamp,
  };
}

export { RESPONDER_STATUSES };
