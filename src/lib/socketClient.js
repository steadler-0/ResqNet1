import { io } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL?.replace(/\/$/, '') || 'http://localhost:3001';

const SOCKET_OPTS = {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  withCredentials: true,
};

let responderSocket = null;
let citizenSocket = null;
let coordinatorSocket = null;

function log(...args) {
  console.log('[ResqNet Socket]', ...args);
}

function attachLifecycle(s, label) {
  s.off('connect');
  s.off('disconnect');
  s.off('connect_error');
  s.off('reconnect');

  s.on('connect', () => log(`Connected to socket (${label})`, s.id));
  s.on('disconnect', (reason) => log(`Disconnected (${label})`, reason));
  s.on('connect_error', (err) => log(`Connect error (${label})`, err.message));
  s.on('reconnect', (attempt) => log(`Reconnected (${label})`, attempt));

  s.on('server:ping', () => {
    s.emit('server:pong', { t: Date.now() });
  });
}

function createSocket(auth, label) {
  const s = io(SOCKET_URL, {
    ...SOCKET_OPTS,
    auth,
    query: auth,
    autoConnect: true,
  });
  attachLifecycle(s, label);
  return s;
}

export function getSocketUrl() {
  return SOCKET_URL;
}

/** Dedicated responder connection — never shared with citizen/coordinator */
export function getResponderSocket(responderId) {
  if (responderSocket) {
    responderSocket.auth = { role: 'responder', responderId };
    if (!responderSocket.connected) responderSocket.connect();
    return responderSocket;
  }
  responderSocket = createSocket({ role: 'responder', responderId }, 'responder');
  return responderSocket;
}

export function getCitizenSocket(emergencyId = null) {
  if (!citizenSocket || citizenSocket.disconnected) {
    citizenSocket = createSocket(
      { role: 'citizen', emergencyId, citizenAlertId: emergencyId },
      'citizen'
    );
  } else if (emergencyId) {
    citizenSocket.auth = { role: 'citizen', emergencyId, citizenAlertId: emergencyId };
  }
  return citizenSocket;
}

export function getCoordinatorSocket() {
  if (!coordinatorSocket || coordinatorSocket.disconnected) {
    coordinatorSocket = createSocket({ role: 'coordinator' }, 'coordinator');
  }
  return coordinatorSocket;
}

export function disconnectResponderSocket() {
  if (responderSocket?.connected) {
    responderSocket.emit('responder:offline', { id: responderSocket.auth?.responderId });
    responderSocket.disconnect();
  }
}

export function disconnectSocket() {
  disconnectResponderSocket();
}

const SOS_EMIT_TIMEOUT_MS = 8000;

/** Citizen SOS — emits sos_request (primary realtime channel) */
export function emitSosRequest(report) {
  return new Promise((resolve, reject) => {
    const s = getCitizenSocket(report.id);
    const payload = {
      id: report.id,
      type: report.type,
      severity: report.severity,
      latitude: report.latitude ?? report.lat,
      longitude: report.longitude ?? report.lng,
      timestamp: report.timestamp || new Date().toISOString(),
      sos: report.sos,
      description: report.description,
      scarcity: report.scarcity,
      accuracy: report.accuracy,
    };

    let settled = false;
    const done = (fn, val) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      s.off('connect', onConnect);
      s.off('connect_error', onError);
      fn(val);
    };

    const timer = setTimeout(() => done(reject, new Error('socket_timeout')), SOS_EMIT_TIMEOUT_MS);

    const onError = (err) => done(reject, err || new Error('socket_connect_failed'));

    const onConnect = () => {
      log('Emitting sos_request', payload.id);
      s.emit('sos_request', payload, (ack) => {
        if (ack?.ok) {
          log('sos_request ack ok', payload.id);
          done(resolve, ack);
        } else {
          done(reject, new Error(ack?.error || 'sos_request_failed'));
        }
      });
    };

    s.once('connect_error', onError);
    if (s.connected) onConnect();
    else s.once('connect', onConnect);
  });
}

/** @deprecated use emitSosRequest */
export const emitCitizenSOS = emitSosRequest;

export function subscribeCitizen(emergencyId, handlers = {}) {
  const s = getCitizenSocket(emergencyId);
  const sub = () => s.emit('citizen:subscribe', { emergencyId });

  if (s.connected) sub();
  else s.once('connect', sub);

  const onUpdate = (data) => {
    log('Citizen received emergency update', data?.id);
    handlers.onUpdate?.(data);
  };
  const onEta = (data) => handlers.onEta?.(data);

  s.on('emergency:update', onUpdate);
  s.on('emergency:eta', onEta);

  return () => {
    s.off('emergency:update', onUpdate);
    s.off('emergency:eta', onEta);
  };
}

function dispatchOffer(handlers, payload) {
  console.log('Emergency received', payload);
  log('incoming_emergency', payload?.emergencyId || payload?.incidentId, payload?.type);
  handlers.onOffer?.(payload);
  handlers.onAlert?.(payload);
}

export function subscribeResponder(responderId, handlers = {}, coords = null) {
  const s = getResponderSocket(responderId);

  const onIncoming = (payload) => dispatchOffer(handlers, payload);

  const registerListeners = () => {
    s.off('incoming_emergency', onIncoming);
    s.on('incoming_emergency', onIncoming);

    if (handlers.onLocked) {
      s.off('emergency:locked', handlers.onLocked);
      s.on('emergency:locked', handlers.onLocked);
    }
    if (handlers.onAssigned) {
      s.off('emergency:assigned', handlers.onAssigned);
      s.on('emergency:assigned', handlers.onAssigned);
    }
    if (handlers.onStatus) {
      s.off('emergency:status', handlers.onStatus);
      s.on('emergency:status', handlers.onStatus);
    }
    if (handlers.onCitizenLocation) {
      s.off('emergency:location', handlers.onCitizenLocation);
      s.on('emergency:location', handlers.onCitizenLocation);
    }
    if (handlers.onDismissed) {
      s.off('emergency:offer:dismissed', handlers.onDismissed);
      s.on('emergency:offer:dismissed', handlers.onDismissed);
    }
    if (handlers.onOnlineAck) {
      s.off('responder:online:ack', handlers.onOnlineAck);
      s.on('responder:online:ack', handlers.onOnlineAck);
    }
  };

  const goOnline = () => {
    registerListeners();
    s.emit('responder:online', {
      id: responderId,
      available: true,
      ...(coords?.lat != null ? { lat: coords.lat, lng: coords.lng } : {}),
    });
    log('Responder online ping sent', responderId);
  };

  if (s.connected) goOnline();
  else s.once('connect', goOnline);

  return () => {
    s.off('incoming_emergency', onIncoming);
    s.off('connect', goOnline);
  };
}

export function subscribeCoordinator(handlers = {}) {
  const s = getCoordinatorSocket();

  const bind = () => {
    const events = [
      ['emergency:created', handlers.onCreated],
      ['emergency:assigned', handlers.onAssigned],
      ['emergency:updated', handlers.onUpdated],
      ['emergency:location', handlers.onLocation],
      ['emergency:alert', (e) => {
        log('Coordinator saw emergency alert', e?.emergencyId);
        handlers.onCreated?.(e);
      }],
      ['responder:location', handlers.onResponderLocation],
    ];
    for (const [ev, fn] of events) {
      if (fn) {
        s.off(ev, fn);
        s.on(ev, fn);
      }
    }
  };

  if (s.connected) bind();
  else s.once('connect', bind);

  return () => s.removeAllListeners();
}

export function emitResponderLocation(responderId, lat, lng) {
  const s = getResponderSocket(responderId);
  if (s.connected) s.emit('responder:location', { responderId, lat, lng });
}

export function emitCitizenLocation(emergencyId, lat, lng) {
  const s = getCitizenSocket(emergencyId);
  if (s.connected) s.emit('citizen:location', { emergencyId, lat, lng });
}

export function acceptEmergencySocket(emergencyId, responderId) {
  return new Promise((resolve) => {
    const s = getResponderSocket(responderId);
    s.emit('emergency:accept', { emergencyId, responderId }, resolve);
  });
}
