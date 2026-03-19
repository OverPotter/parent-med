import { apiClient } from "./client";
import type { PushNotificationConfig, PushNotificationPreferences } from "@shared/types/api";

interface RawPushNotificationConfig {
  enabled: boolean;
  vapid_public_key: string | null;
}

interface RawPushNotificationPreferences {
  before_reminder_minutes: number;
  due_reminder_enabled: boolean;
}

export async function fetchPushNotificationConfig(): Promise<PushNotificationConfig> {
  const res = await apiClient.get<RawPushNotificationConfig>("/push-notifications/config");
  return {
    enabled: res.data.enabled,
    vapidPublicKey: res.data.vapid_public_key ?? null,
  };
}

export async function fetchPushNotificationPreferences(): Promise<PushNotificationPreferences> {
  const res = await apiClient.get<RawPushNotificationPreferences>(
    "/push-notifications/preferences"
  );
  return {
    beforeReminderMinutes: res.data.before_reminder_minutes,
    dueReminderEnabled: res.data.due_reminder_enabled,
  };
}

export async function updatePushNotificationPreferences(body: {
  before_reminder_minutes: number;
}): Promise<PushNotificationPreferences> {
  const res = await apiClient.patch<RawPushNotificationPreferences>(
    "/push-notifications/preferences",
    body
  );
  return {
    beforeReminderMinutes: res.data.before_reminder_minutes,
    dueReminderEnabled: res.data.due_reminder_enabled,
  };
}

export async function upsertPushSubscription(body: {
  endpoint: string;
  expiration_time?: string | null;
  keys: { p256dh: string; auth: string };
  user_agent?: string | null;
  device_label?: string | null;
}): Promise<void> {
  await apiClient.post("/push-notifications/subscriptions", body);
}

export async function deletePushSubscription(body: { endpoint: string }): Promise<void> {
  await apiClient.delete("/push-notifications/subscriptions", { data: body });
}
