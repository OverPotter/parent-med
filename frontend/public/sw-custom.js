self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {
      body: event.data ? event.data.text() : "",
    };
  }

  const title = payload.title || "PillPath";
  const options = {
    body: payload.body || "",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: payload.tag,
    actions: Array.isArray(payload.actions) ? payload.actions : [],
    data: {
      url: payload.url || "/",
      ...(payload.data || {}),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

async function markPillboxDoseTaken(data) {
  if (!data?.takeDoseUrl) {
    return false;
  }

  try {
    const response = await fetch(data.takeDoseUrl, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source: "reminder" }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    (async () => {
      if (event.action === "take-dose") {
        await markPillboxDoseTaken(event.notification.data);
      }

      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })()
  );
});
