/**
 * Permanent responder alert listeners — single event: incoming_emergency
 */
import { getResponderSocket } from './socketClient';

const handlers = new Set();
let wired = false;

function fanOut(payload) {
  console.log('Emergency received', payload);
  handlers.forEach((fn) => {
    try {
      fn(payload);
    } catch (err) {
      console.error('[ResqNet] alert handler error', err);
    }
  });
}

/** Wire incoming_emergency once on the shared responder socket */
export function ensureResponderAlertWire(responderId) {
  const s = getResponderSocket(responderId);

  if (!wired) {
    s.off('incoming_emergency');
    s.on('incoming_emergency', fanOut);
    wired = true;
    console.log('[ResqNet Socket] Listening for incoming_emergency on responder socket');
  }

  return s;
}

export function onResponderAlert(handler) {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

export function pingResponderOnline(responderId, coords = {}) {
  const s = ensureResponderAlertWire(responderId);
  const payload = {
    id: responderId,
    available: true,
    ...(coords.lat != null ? { lat: coords.lat, lng: coords.lng } : {}),
  };

  const send = () => {
    s.emit('responder:register', payload);
    s.emit('responder:online', payload);
    console.log('[ResqNet Socket] Responder online ping sent', responderId);
  };

  if (s.connected) send();
  else s.once('connect', send);

  return s;
}
