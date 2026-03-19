import { apiClient } from "./client";
import type { PushNotificationConfig, PushNotificationPreferences } from "@shared/types/api";

interface RawPushNotificationConfig {
  enabled: boolean;
  vapid_public_key: string | null;
}

interface RawPushNotificationPreferences {
  before_reminder_minutes: number;
  due_reminder_enabled: boolean;
  cabinet_notify_30_days: boolean;
  cabinet_notify_15_days: boolean;
  cabinet_notify_7_days: boolean;
  cabinet_notify_1_day: boolean;
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
    cabinetNotify30Days: res.data.cabinet_notify_30_days,
    cabinetNotify15Days: res.data.cabinet_notify_15_days,
    cabinetNotify7Days: res.data.cabinet_notify_7_days,
    cabinetNotify1Day: res.data.cabinet_notify_1_day,
  };
}

export async function updatePushNotificationPreferences(body: {
  before_reminder_minutes?: number;
  cabinet_notify_30_days?: boolean;
  cabinet_notify_15_days?: boolean;
  cabinet_notify_7_days?: boolean;
  cabinet_notify_1_day?: boolean;
}): Promise<PushNotificationPreferences> {
  const res = await apiClient.patch<RawPushNotificationPreferences>(
    "/push-notifications/preferences",
    body
  );
  return {
    beforeReminderMinutes: res.data.before_reminder_minutes,
    dueReminderEnabled: res.data.due_reminder_enabled,
    cabinetNotify30Days: res.data.cabinet_notify_30_days,
    cabinetNotify15Days: res.data.cabinet_notify_15_days,
    cabinetNotify7Days: res.data.cabinet_notify_7_days,
    cabinetNotify1Day: res.data.cabinet_notify_1_day,
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
