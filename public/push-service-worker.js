self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  event.waitUntil(self.registration.showNotification(payload.title || "BOJOGAE", {
    body: payload.body || "새로운 알림이 도착했습니다.",
    icon: "/bojogae-icon.png",
    badge: "/favicon-32.png",
    tag: payload.tag || "bojogae-notification",
    renotify: false,
    data: { url: payload.url || "/home" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requested = new URL(event.notification.data?.url || "/home", self.location.origin);
  const target = requested.origin === self.location.origin ? requested.href : `${self.location.origin}/home`;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      await existing.navigate(target);
      return existing.focus();
    }
    return self.clients.openWindow(target);
  })());
});

