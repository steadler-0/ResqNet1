/** Hash routes for shareable test links — e.g. /#responder, /#sos */

const VALID_PAGES = new Set([
  'home',
  'dashboard',
  'sos',
  'map',
  'alerts',
  'coordinator',
  'responder',
  'profile',
  'login',
]);

export function parseHashRoute() {
  const raw = (window.location.hash || '').replace(/^#\/?/, '').trim();
  if (!raw) return { page: null, role: null };

  const [segment, ...rest] = raw.split('/').filter(Boolean);
  const page = VALID_PAGES.has(segment) ? segment : null;

  let role = null;
  if (page === 'login') {
    const sub = rest[0];
    if (sub === 'responder' || sub === 'coordinator') role = sub;
  }
  if (page === 'responder') role = 'responder';

  return { page, role };
}

export function setHashRoute(page, role = null) {
  if (!page || page === 'home') {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    return;
  }
  if (page === 'login' && role) {
    window.location.hash = `#login/${role}`;
    return;
  }
  window.location.hash = `#${page}`;
}

export function getTestLinks(origin = window.location.origin) {
  const base = origin.replace(/\/$/, '');
  return {
    home: `${base}/`,
    citizenSos: `${base}/#sos`,
    citizenApp: `${base}/#sos`,
    responderApp: `${base}/#responder`,
    responderLogin: `${base}/#login/responder`,
    coordinator: `${base}/#login/coordinator`,
    map: `${base}/#map`,
  };
}
