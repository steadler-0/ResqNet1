/**
 * In-memory store with optional MongoDB persistence.
 */

const emergencies = new Map();
const responders = new Map();
const rejections = new Map(); // emergencyId -> Set(responderId)

let mongoDb = null;
let emergenciesCol = null;
let respondersCol = null;

export async function initStore() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('[RescueNet] Using in-memory store (set MONGODB_URI for persistence)');
    seedDemoResponders();
    return;
  }
  try {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(uri);
    await client.connect();
    mongoDb = client.db(process.env.MONGODB_DB || 'rescuenet');
    emergenciesCol = mongoDb.collection('emergencies');
    respondersCol = mongoDb.collection('responders');
    const existing = await respondersCol.countDocuments();
    if (existing === 0) seedDemoResponders();
    console.log('[RescueNet] MongoDB connected');
  } catch (err) {
    console.warn('[RescueNet] MongoDB unavailable, using memory:', err.message);
    seedDemoResponders();
  }
}

function seedDemoResponders() {
  const center = { lat: 12.9716, lng: 77.5946 };
  for (let i = 0; i < 15; i++) {
    const angle = (2 * Math.PI * i) / 15;
    const distM = 600 + i * 280;
    const latRad = (center.lat * Math.PI) / 180;
    const dLat = (distM / 111320) * Math.cos(angle);
    const dLng = (distM / (111320 * Math.cos(latRad))) * Math.sin(angle);
    const id = i === 0 ? 'r-ndrf-1' : `r-zone-${i + 1}`;
    responders.set(id, {
      id,
      name: i === 0 ? 'NDRF Unit 1' : `Rapid Unit ${i + 1}`,
      team: 'NDRF',
      vehicle: 'Rescue Van',
      lat: center.lat + dLat,
      lng: center.lng + dLng,
      available: true,
      status: 'idle',
      activeEmergencyId: null,
      lastSeen: new Date().toISOString(),
    });
  }
}

async function persistEmergency(doc) {
  if (emergenciesCol) {
    await emergenciesCol.updateOne({ id: doc.id }, { $set: doc }, { upsert: true });
  }
}

async function persistResponder(doc) {
  if (respondersCol) {
    await respondersCol.updateOne({ id: doc.id }, { $set: doc }, { upsert: true });
  }
}

export function getEmergency(id) {
  return emergencies.get(id) || null;
}

export function listEmergencies() {
  return [...emergencies.values()].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
}

export async function saveEmergency(doc) {
  emergencies.set(doc.id, doc);
  await persistEmergency(doc);
  return doc;
}

export function getResponder(id) {
  return responders.get(id) || null;
}

export function listAvailableResponders() {
  return [...responders.values()].filter(
    (r) => r.available && !r.activeEmergencyId && r.lat != null
  );
}

export async function saveResponder(doc) {
  responders.set(doc.id, doc);
  await persistResponder(doc);
  return doc;
}

export function getRejections(emergencyId) {
  if (!rejections.has(emergencyId)) rejections.set(emergencyId, new Set());
  return rejections.get(emergencyId);
}

export function recordRejection(emergencyId, responderId) {
  getRejections(emergencyId).add(responderId);
}

export function hasRejected(emergencyId, responderId) {
  return getRejections(emergencyId).has(responderId);
}
