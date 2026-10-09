import apiCaller from "@/services/api-caller";


function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

export function supportsBrowserPush() {
  return window.isSecureContext
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window;
}

export async function getBrowserPushState() {
  if (!supportsBrowserPush()) {
    return { supported: false, configured: false, permission: "unsupported", subscribed: false };
  }
  const configuration = (await apiCaller.get("/api/v1/web-push/configuration")).data;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = registration ? await registration.pushManager.getSubscription() : null;
  const serverState = subscription
    ? (await apiCaller.post('/api/v1/web-push/subscriptions/state', { endpoint: subscription.endpoint })).data
    : { subscribed: false };
  return {
    supported: true,
    configured: configuration.enabled,
    publicKey: configuration.public_key,
    permission: Notification.permission,
    subscribed: Boolean(subscription && serverState.subscribed && Notification.permission === 'granted'),
  };
}

export async function enableBrowserPush(publicKey) {
  if (!supportsBrowserPush()) throw new Error("browser_push_unsupported");
  if (!publicKey) throw new Error("web_push_unavailable");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("browser_push_permission_denied");

  const registration = await navigator.serviceWorker.register("/push-service-worker.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
  try {
    await apiCaller.post("/api/v1/web-push/subscriptions", subscription.toJSON());
  } catch (error) {
    if (!existing) await subscription.unsubscribe();
    throw error;
  }
  return getBrowserPushState();
}

export async function disableBrowserPush() {
  if (!supportsBrowserPush()) return getBrowserPushState();
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = registration ? await registration.pushManager.getSubscription() : null;
  if (subscription) {
    try {
      await apiCaller.post("/api/v1/web-push/subscriptions/unsubscribe", { endpoint: subscription.endpoint });
    } finally {
      await subscription.unsubscribe();
    }
  }
  return getBrowserPushState();
}

export async function clearLocalBrowserPush() {
  if (!supportsBrowserPush()) return;
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = registration ? await registration.pushManager.getSubscription() : null;
  if (subscription) await subscription.unsubscribe();
  const notifications = registration ? await registration.getNotifications() : [];
  notifications.forEach((notification) => notification.close());
}

export async function reconcileBrowserPushUser(user) {
  if (!supportsBrowserPush()) return;
  if (!user || user.status !== 'ACTIVE') return clearLocalBrowserPush();
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = registration ? await registration.pushManager.getSubscription() : null;
  if (!subscription) return;
  const { data } = await apiCaller.post('/api/v1/web-push/subscriptions/state', { endpoint: subscription.endpoint });
  if (!data.subscribed) await subscription.unsubscribe();
}
