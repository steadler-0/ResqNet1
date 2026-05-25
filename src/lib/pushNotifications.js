/**
 * Firebase Cloud Messaging hook — configure VITE_FIREBASE_* and service worker for production.
 */

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function showLocalNotification(title, body, tag = 'rescuenet') {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, tag, icon: '/resqnet-icon.svg' });
  } catch {
    /* mobile / PWA may require service worker */
  }
}

export const PUSH_COPY = {
  citizenAccepted: 'Responder accepted your request',
  citizenOnTheWay: 'Help is on the way',
  responderOffer: 'New emergency nearby — open ResqNet to accept',
};
