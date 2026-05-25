let db = null;
let initialized = false;

export async function initFirebase() {
  if (initialized) return db;
  initialized = true;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const databaseURL = process.env.FIREBASE_DATABASE_URL;
  if (!projectId || !databaseURL || projectId.startsWith('YOUR_')) {
    console.log('[RescueNet] Firebase RTDB skipped (set FIREBASE_* env vars)');
    return null;
  }

  try {
    const admin = await import('firebase-admin');
    if (!admin.apps.length) {
      const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (credPath) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          databaseURL,
        });
      } else {
        admin.initializeApp({ projectId, databaseURL });
      }
    }
    db = admin.database();
    console.log('[RescueNet] Firebase Realtime Database connected');
  } catch (err) {
    console.warn('[RescueNet] Firebase init failed:', err.message);
    db = null;
  }
  return db;
}

export async function syncEmergencyToFirebase(emergency) {
  if (!db && !(await initFirebase())) return;
  try {
    await db.ref(`emergencies/${emergency.id}`).set({
      id: emergency.id,
      type: emergency.type,
      severity: emergency.severity,
      priority: emergency.priority,
      lat: emergency.lat,
      lng: emergency.lng,
      status: emergency.status,
      responderStatus: emergency.responderStatus,
      locked: emergency.locked,
      responderId: emergency.responderId,
      responderName: emergency.responderName,
      etaMinutes: emergency.etaMinutes,
      timestamp: emergency.timestamp,
      updatedAt: new Date().toISOstring(),
    });
  } catch (err) {
    console.warn('[Firebase sync]', err.message);
  }
}

export async function syncResponderLocation(responderId, lat, lng) {
  if (!db && !(await initFirebase())) return;
  try {
    await db.ref(`responders/${responderId}`).update({
      lat,
      lng,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Firebase responder]', err.message);
  }
}
