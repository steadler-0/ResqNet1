import { syncEmergencyToFirebase } from './firebase.js';

let twilioClient = null;
let twilioChecked = false;

async function getTwilio() {
  if (twilioChecked) return twilioClient;
  twilioChecked = true;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || sid.startsWith('YOUR_')) return null;
  try {
    const twilio = await import('twilio');
    twilioClient = twilio.default(sid, token);
  } catch {
    twilioClient = null;
  }
  return twilioClient;
}

export async function notifyCitizen(emergency, message, extra = {}) {
  const payload = {
    emergencyId: emergency.id,
    message,
    status: emergency.responderStatus,
    responderName: emergency.responderName,
    etaMinutes: emergency.etaMinutes,
    ...extra,
    at: new Date().toISOString(),
  };

  console.log(`[Notify Citizen] ${emergency.id}: ${message}`);
  await syncEmergencyToFirebase(emergency);

  const phone = emergency.reporterPhone;
  const client = await getTwilio();
  const from = process.env.TWILIO_FROM_NUMBER;
  if (client && phone && from) {
    try {
      await client.messages.create({ body: message, from, to: phone });
    } catch (err) {
      console.warn('[Twilio]', err.message);
    }
  }
}

export async function notifyResponder(responder, message, emergency = null) {
  console.log(`[Notify Responder] ${responder.id}: ${message}`);
  if (emergency) await syncEmergencyToFirebase(emergency);
}

export const CITIZEN_MESSAGES = {
  accepted: 'Responder accepted your request. Help is on the way.',
  onTheWay: 'Responder is on the way',
  arrived: 'Responder has arrived at your location',
  completed: 'Emergency response completed. Stay safe.',
  broadcasting: 'Searching for nearby responders within 5 km…',
};
