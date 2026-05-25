import { getResponder } from './store.js';
import { buildOfferPayload } from './services/matching.js';

const responderSockets = new Map();
const poolSockets = new Set();

export async function registerResponderConnection(socket, responderId) {
  poolSockets.add(socket);
  await socket.join('responders:pool');
  if (responderId) {
    await socket.join(`responder:${responderId}`);
    if (!responderSockets.has(responderId)) responderSockets.set(responderId, new Set());
    responderSockets.get(responderId).add(socket);
    socket.data.responderId = responderId;
    socket.data.role = 'responder';
  }
}

export function unregisterSocket(socket) {
  poolSockets.delete(socket);
  const rid = socket.data?.responderId;
  if (rid && responderSockets.has(rid)) {
    responderSockets.get(rid).delete(socket);
    if (responderSockets.get(rid).size === 0) responderSockets.delete(rid);
  }
}

export function getOnlineResponderCount() {
  return poolSockets.size;
}

export function isResponderOnline(responderId) {
  const set = responderSockets.get(responderId);
  return set != null && set.size > 0;
}

/**
 * Emit to every live responder app socket with optional per-responder distance.
 */
export async function emitToResponderPool(io, event, basePayload, emergency = null) {
  let roomCount = 0;

  try {
    const inRoom = await io.in('responders:pool').fetchSockets();
    roomCount = inRoom.length;

    for (const remoteSocket of inRoom) {
      const rid = remoteSocket.data?.responderId;
      let payload = basePayload;

      if (emergency && rid) {
        const r = getResponder(rid);
        if (r?.lat != null) {
          payload = { ...basePayload, ...buildOfferPayload(emergency, r) };
        }
      }

      remoteSocket.emit(event, payload);
    }

    console.log(`[RescueNet] emit ${event} → ${roomCount} responder socket(s) in pool`);
  } catch (err) {
    console.warn('[RescueNet] pool fetchSockets failed:', err.message);
    io.to('responders:pool').emit(event, basePayload);
  }

  poolSockets.forEach((socket) => {
    if (socket.connected && !socket.rooms?.has?.('responders:pool')) {
      socket.emit(event, basePayload);
    }
  });

  return roomCount;
}

export function emitToResponder(io, responderId, event, payload) {
  const set = responderSockets.get(responderId);
  if (set) {
    set.forEach((socket) => {
      if (socket.connected) socket.emit(event, payload);
    });
  }
  io.to(`responder:${responderId}`).emit(event, payload);
}
