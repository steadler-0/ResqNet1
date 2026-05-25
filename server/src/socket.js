import {
  tryAcceptEmergency,
  updateResponderStatus,
  updateCitizenLocation,
  updateResponderLocation,
} from './services/emergencyService.js';
import { broadcastSosToAll } from './broadcastSos.js';
import { rejectOffer } from './services/matching.js';
import { getEmergency, saveResponder, getResponder } from './store.js';
import {
  registerResponderConnection,
  unregisterSocket,
  getOnlineResponderCount,
} from './onlineRegistry.js';

const PING_INTERVAL_MS = 25000;

export function registerSocketHandlers(io) {
  io.on('connection', async (socket) => {
    const auth = socket.handshake.auth || {};
    const query = socket.handshake.query || {};
    const role = auth.role || query.role;
    const responderId = auth.responderId || query.responderId;
    const emergencyId = auth.emergencyId || query.emergencyId;
    const citizenAlertId = auth.citizenAlertId || query.citizenAlertId;

    console.log('[Socket] Client connected', {
      id: socket.id,
      role,
      responderId,
      transport: socket.conn?.transport?.name,
    });

    if (role === 'coordinator') {
      socket.join('coordinators');
      socket.data.role = 'coordinator';
    }

    if (role === 'responder') {
      socket.data.role = 'responder';
      if (responderId) {
        await registerResponderConnection(socket, responderId);
        console.log('[Socket] Responder connected:', responderId, 'pool:', getOnlineResponderCount());
      } else {
        socket.join('responders:pool');
      }
    }

    if (role === 'citizen' && (emergencyId || citizenAlertId)) {
      socket.join(`citizen:${emergencyId || citizenAlertId}`);
      socket.data.role = 'citizen';
    }

    const markResponderOnline = async (payload = {}) => {
      const id = payload.id || responderId;
      if (!id) return;
      let r = getResponder(id);
      if (!r) {
        console.warn('[Socket] Unknown responder id, creating slot:', id);
        r = {
          id,
          name: id,
          team: 'Field',
          lat: payload.lat ?? 12.9716,
          lng: payload.lng ?? 77.5946,
          available: true,
          status: 'idle',
          activeEmergencyId: null,
        };
      }
      r.lat = payload.lat ?? r.lat;
      r.lng = payload.lng ?? r.lng;
      r.available = payload.available !== false;
      r.online = true;
      r.lastSeen = new Date().toISOString();
      await saveResponder(r);
      await registerResponderConnection(socket, id);
      console.log('[Socket] Responder online:', id, 'pool:', getOnlineResponderCount());
      if (payload.lat != null && payload.lng != null) {
        await updateResponderLocation(id, payload.lat, payload.lng, io);
      }
      socket.emit('responder:online:ack', { ok: true, responderId: id });
    };

    socket.on('responder:register', markResponderOnline);
    socket.on('responder:online', markResponderOnline);

    socket.on('responder:offline', async ({ id } = {}) => {
      const rid = id || responderId;
      const r = getResponder(rid);
      if (r) {
        r.available = false;
        r.online = false;
        await saveResponder(r);
      }
      console.log('[Socket] Responder offline:', rid);
    });

    socket.on('responder:location', async ({ responderId: rid, lat, lng }) => {
      await updateResponderLocation(rid || responderId, lat, lng, io);
    });

    socket.on('citizen:location', async ({ emergencyId: eid, lat, lng }) => {
      await updateCitizenLocation(eid, lat, lng, io);
    });

    /** Primary citizen SOS channel */
    socket.on('sos_request', async (report, ack) => {
      try {
        const result = await broadcastSosToAll(io, report);
        if (result.ok && result.emergency?.id) {
          socket.join(`citizen:${result.emergency.id}`);
        }
        if (typeof ack === 'function') ack(result);
      } catch (err) {
        console.error('[Socket] sos_request error:', err);
        if (typeof ack === 'function') ack({ ok: false, error: 'server_error' });
      }
    });

    /** Legacy alias */
    socket.on('citizen:sos', async (report, ack) => {
      try {
        const result = await broadcastSosToAll(io, report);
        if (typeof ack === 'function') ack(result);
      } catch (err) {
        if (typeof ack === 'function') ack({ ok: false, error: 'server_error' });
      }
    });

    socket.on('emergency:accept', async ({ emergencyId, responderId: rid }, ack) => {
      const result = await tryAcceptEmergency(emergencyId, rid || responderId, io);
      if (result.ok) {
        console.log('[RescueNet] Responder accepted request:', rid || responderId, emergencyId);
      }
      if (typeof ack === 'function') ack(result);
    });

    socket.on('emergency:reject', ({ emergencyId, responderId: rid }) => {
      rejectOffer(emergencyId, rid || responderId);
      socket.emit('emergency:offer:dismissed', { emergencyId });
    });

    socket.on('emergency:status', async ({ emergencyId, responderId: rid, responderStatus }, ack) => {
      const result = await updateResponderStatus(
        emergencyId,
        rid || responderId,
        responderStatus,
        io
      );
      if (typeof ack === 'function') ack(result);
    });

    socket.on('citizen:subscribe', ({ emergencyId: eid }) => {
      socket.join(`citizen:${eid}`);
      const e = getEmergency(eid);
      if (e) socket.emit('emergency:update', e);
    });

    socket.on('disconnect', (reason) => {
      unregisterSocket(socket);
      console.log('[Socket] Disconnected', socket.id, reason, 'pool:', getOnlineResponderCount());
    });

    socket.on('error', (err) => {
      console.error('[Socket] Error', socket.id, err.message);
    });
  });

  setInterval(() => {
    io.to('responders:pool').emit('server:ping', { t: Date.now() });
  }, PING_INTERVAL_MS);
}
