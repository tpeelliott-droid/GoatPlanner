import type { FirebaseApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage, type Messaging } from "firebase/messaging";

let messagingInstance: Messaging | null = null;

/**
 * Cloud Messaging isn't available in every browser (notably Safari before PWA
 * install, and any non-secure context) — probe support before initialising so
 * the rest of the app doesn't have to guard every call site.
 */
export function getMessagingSafe(app: FirebaseApp): Promise<Messaging | null> {
  return isSupported()
    .then((supported) => {
      if (!supported) return null;
      if (!messagingInstance) messagingInstance = getMessaging(app);
      return messagingInstance;
    })
    .catch(() => null);
}

export async function requestPushPermission(app: FirebaseApp): Promise<string | null> {
  const messaging = await getMessagingSafe(app);
  if (!messaging) return null;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch {
    return null;
  }
}

export function listenForForegroundMessages(
  app: FirebaseApp,
  callback: (payload: unknown) => void,
) {
  getMessagingSafe(app).then((messaging) => {
    if (!messaging) return;
    onMessage(messaging, callback);
  });
}
