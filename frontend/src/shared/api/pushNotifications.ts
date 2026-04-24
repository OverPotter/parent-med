import { apiClient } from "./client";
import type { PushNotificationConfig, PushNotificationPreferences } from "@shared/types/api";

interface RawPushNotificationConfig {
  enabled: boolean;
  vapid_public_key: string | null;
}

interface RawPushNotificationPreferences {
  children_enabled: boolean;
  before_reminder_minutes: number;
  pillbox_enabled: boolean;
  pillbox_before_reminder_minutes: number;
  cabinet_notify_10_days: boolean;
  cabinet_notify_7_days: boolean;
  cabinet_notify_3_days: boolean;
  live_activity_sleep_enabled: boolean;
  live_activity_feeding_enabled: boolean;
  live_activity_illness_enabled: boolean;
}

interface RawPushNotificationTestResponse {
  sent: boolean;
  subscription_count: number;
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
    childrenEnabled: res.data.children_enabled,
    beforeReminderMinutes: res.data.before_reminder_minutes,
    pillboxEnabled: res.data.pillbox_enabled,
    pillboxBeforeReminderMinutes: res.data.pillbox_before_reminder_minutes,
    cabinetNotify10Days: res.data.cabinet_notify_10_days,
    cabinetNotify7Days: res.data.cabinet_notify_7_days,
    cabinetNotify3Days: res.data.cabinet_notify_3_days,
    liveActivitySleepEnabled: res.data.live_activity_sleep_enabled,
    liveActivityFeedingEnabled: res.data.live_activity_feeding_enabled,
    liveActivityIllnessEnabled: res.data.live_activity_illness_enabled,
  };
}

export async function updatePushNotificationPreferences(body: {
  children_enabled?: boolean;
  before_reminder_minutes?: number;
  pillbox_enabled?: boolean;
  pillbox_before_reminder_minutes?: number;
  cabinet_notify_10_days?: boolean;
  cabinet_notify_7_days?: boolean;
  cabinet_notify_3_days?: boolean;
  live_activity_sleep_enabled?: boolean;
  live_activity_feeding_enabled?: boolean;
  live_activity_illness_enabled?: boolean;
}): Promise<PushNotificationPreferences> {
  const res = await apiClient.patch<RawPushNotificationPreferences>(
    "/push-notifications/preferences",
    body
  );
  return {
    childrenEnabled: res.data.children_enabled,
    beforeReminderMinutes: res.data.before_reminder_minutes,
    pillboxEnabled: res.data.pillbox_enabled,
    pillboxBeforeReminderMinutes: res.data.pillbox_before_reminder_minutes,
    cabinetNotify10Days: res.data.cabinet_notify_10_days,
    cabinetNotify7Days: res.data.cabinet_notify_7_days,
    cabinetNotify3Days: res.data.cabinet_notify_3_days,
    liveActivitySleepEnabled: res.data.live_activity_sleep_enabled,
    liveActivityFeedingEnabled: res.data.live_activity_feeding_enabled,
    liveActivityIllnessEnabled: res.data.live_activity_illness_enabled,
  };
}

export async function upsertPushSubscription(body: {
  channel?: "web" | "native";
  endpoint: string;
  native_token?: string | null;
  platform?: "ios" | "android";
  device_id?: string | null;
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

export async function sendTestPushNotification(): Promise<{
  sent: boolean;
  subscriptionCount: number;
}> {
  const res = await apiClient.post<RawPushNotificationTestResponse>("/push-notifications/test");
  return {
    sent: res.data.sent,
    subscriptionCount: res.data.subscription_count,
  };
}

export async function sendPillboxTestPushNotification(): Promise<{
  sent: boolean;
  subscriptionCount: number;
}> {
  const res = await apiClient.post<RawPushNotificationTestResponse>("/push-notifications/test/pillbox");
  return {
    sent: res.data.sent,
    subscriptionCount: res.data.subscription_count,
  };
}
