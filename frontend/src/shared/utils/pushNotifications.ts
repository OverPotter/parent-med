export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getPushSupportIssue() {
  if (typeof window === "undefined") {
    return "Клиентская среда ещё не готова.";
  }
  if (!window.isSecureContext) {
    return "Нужно открыть приложение в защищённом режиме HTTPS.";
  }
  if (!("serviceWorker" in navigator)) {
    return "На этом устройстве нет поддержки service worker.";
  }
  if (!("PushManager" in window)) {
    return "На этом устройстве нет поддержки push-уведомлений.";
  }
  if (!("Notification" in window)) {
    return "Браузер не поддерживает уведомления.";
  }
  return null;
}

export async function getExistingPushSubscription() {
  if (!isPushSupported()) {
    return null;
  }
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function subscribeToPushNotifications(vapidPublicKey: string) {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported on this device.");
  }

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing && hasMatchingVapidKey(existing.options?.applicationServerKey, vapidPublicKey)) {
    return existing;
  }
  if (existing) {
    await existing.unsubscribe();
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: vapidKeyToUint8Array(vapidPublicKey),
  });
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeoutId: number | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  }
}

export async function unsubscribeFromPushNotifications() {
  const subscription = await getExistingPushSubscription();
  if (!subscription) {
    return null;
  }
  await subscription.unsubscribe();
  return subscription;
}

export function toPushSubscriptionPayload(subscription: PushSubscription) {
  const keys = subscription.toJSON().keys;
  if (!keys?.p256dh || !keys.auth) {
    throw new Error("Push subscription keys are missing.");
  }

  return {
    endpoint: subscription.endpoint,
    expiration_time: subscription.expirationTime
      ? new Date(subscription.expirationTime).toISOString()
      : null,
    keys: {
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    user_agent: navigator.userAgent,
    device_label: buildDeviceLabel(),
  };
}

function buildDeviceLabel() {
  const userAgentData = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platform = userAgentData.userAgentData?.platform ?? navigator.platform ?? "Устройство";
  return `PWA · ${platform}`;
}

export function hasMatchingVapidKey(
  applicationServerKey: ArrayBuffer | null | undefined,
  vapidPublicKey: string
) {
  if (!applicationServerKey) {
    return false;
  }
  const currentKey = new Uint8Array(applicationServerKey);
  const expectedKey = vapidKeyToUint8Array(vapidPublicKey);
  if (currentKey.length !== expectedKey.length) {
    return false;
  }
  return currentKey.every((value, index) => value === expectedKey[index]);
}

export function vapidKeyToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}
