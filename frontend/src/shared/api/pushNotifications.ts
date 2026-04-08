import { apiClient } from "./client";
import type { PushNotificationConfig, PushNotificationPreferences } from "@shared/types/api";

interface RawPushNotificationConfig {
  enabled: boolean;
  vapid_public_key: string | null;
}

interface RawPushNotificationPreferences {
  before_reminder_minutes: number;
  pillbox_before_reminder_minutes: number;
  due_reminder_enabled: boolean;
  cabinet_notify_10_days: boolean;
  cabinet_notify_7_days: boolean;
  cabinet_notify_3_days: boolean;
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
    pillboxBeforeReminderMinutes: res.data.pillbox_before_reminder_minutes,
    dueReminderEnabled: res.data.due_reminder_enabled,
    cabinetNotify10Days: res.data.cabinet_notify_10_days,
    cabinetNotify7Days: res.data.cabinet_notify_7_days,
    cabinetNotify3Days: res.data.cabinet_notify_3_days,
  };
}

export async function updatePushNotificationPreferences(body: {
  before_reminder_minutes?: number;
  pillbox_before_reminder_minutes?: number;
  cabinet_notify_10_days?: boolean;
  cabinet_notify_7_days?: boolean;
  cabinet_notify_3_days?: boolean;
}): Promise<PushNotificationPreferences> {
  const res = await apiClient.patch<RawPushNotificationPreferences>(
    "/push-notifications/preferences",
    body
  );
  return {
    beforeReminderMinutes: res.data.before_reminder_minutes,
    pillboxBeforeReminderMinutes: res.data.pillbox_before_reminder_minutes,
    dueReminderEnabled: res.data.due_reminder_enabled,
    cabinetNotify10Days: res.data.cabinet_notify_10_days,
    cabinetNotify7Days: res.data.cabinet_notify_7_days,
    cabinetNotify3Days: res.data.cabinet_notify_3_days,
  };
}

export async function upsertPushSubscription(body: {
  channel?: "web" | "native";
  endpoint: string;
  native_token?: string | null;
  platform?: "ios" | "android";
  expiration_time?: string | null;
  keys?: { p256dh: string; auth: string } | null;
  user_agent?: string | null;
  device_label?: string | null;
}): Promise<void> {
  await apiClient.post("/push-notifications/subscriptions", body);
}

export async function deletePushSubscription(body: { endpoint: string }): Promise<void> {
  await apiClient.delete("/push-notifications/subscriptions", { data: body });
}
