import type { MobileAuthSession } from "../../auth/api/authApi";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";

type BackendPreferredLanguage = "ru" | "en";

type RawAccountResponse = {
  id: string;
  email: string | null;
  family_id: string;
  display_name: string;
  relationship_label?: string | null;
  phone?: string | null;
  preferred_language: BackendPreferredLanguage;
  family_role: string;
  has_recovery_code?: boolean | null;
};

type RawFamilyResponse = {
  id: string;
  name: string;
  owner_account_id?: string | null;
  plan_code?: "free" | "plus" | "pro" | null;
  subscription_status?:
    | "inactive"
    | "trialing"
    | "active"
    | "grace"
    | "canceled"
    | "expired"
    | null;
  subscription_expires_at?: string | null;
  premium_active?: boolean | null;
};

type RawFamilyAccessResponse = {
  plan_code?: "free" | "plus" | "pro" | null;
  subscription_status?:
    | "inactive"
    | "trialing"
    | "active"
    | "grace"
    | "canceled"
    | "expired"
    | null;
  premium_active?: boolean | null;
  can_manage_subscription?: boolean | null;
  can_use_live_activities?: boolean | null;
  current_children_count?: number | null;
  current_adults_count?: number | null;
  current_pillbox_plan_count?: number | null;
};

type RawPushNotificationPreferencesResponse = {
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
};

type RawPushNotificationConfigResponse = {
  enabled: boolean;
  vapid_public_key: string | null;
};

export type MobilePushPreferences = {
  childrenEnabled: boolean;
  beforeReminderMinutes: number;
  pillboxEnabled: boolean;
  pillboxBeforeReminderMinutes: number;
  cabinetNotify10Days: boolean;
  cabinetNotify7Days: boolean;
  cabinetNotify3Days: boolean;
  liveActivitySleepEnabled: boolean;
  liveActivityFeedingEnabled: boolean;
  liveActivityIllnessEnabled: boolean;
};

export type MobilePushConfig = {
  enabled: boolean;
};

export type MobileFamilySettingsSummary = {
  id: string;
  name: string;
  ownerAccountId: string | null;
  planCode: "free" | "plus" | "pro";
  subscriptionStatus:
    | "inactive"
    | "trialing"
    | "active"
    | "grace"
    | "canceled"
    | "expired";
  subscriptionExpiresAt: string | null;
  premiumActive: boolean;
};

export type MobileFamilyAccessSummary = {
  planCode: "free" | "plus" | "pro";
  subscriptionStatus:
    | "inactive"
    | "trialing"
    | "active"
    | "grace"
    | "canceled"
    | "expired";
  premiumActive: boolean;
  canManageSubscription: boolean;
  canUseLiveActivities: boolean;
  currentChildrenCount: number;
  currentAdultsCount: number;
  currentPillboxPlanCount: number;
};

export class MobileSettingsApiError extends Error {
  code?: string;
  detail?: string;

  constructor(message: string, options?: { code?: string; detail?: string }) {
    super(message);
    this.name = "MobileSettingsApiError";
    this.code = options?.code;
    this.detail = options?.detail;
  }
}

const PROD_API_ORIGIN = "https://parent-med-production.up.railway.app";
const DEV_API_ORIGIN = "http://localhost:8000";

function normalizeApiOrigin(raw: string | undefined) {
  const value = raw?.trim().replace(/\/+$/, "") ?? "";

  if (!value) {
    return __DEV__ ? DEV_API_ORIGIN : PROD_API_ORIGIN;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

const API_BASE_URL = `${normalizeApiOrigin(process.env.EXPO_PUBLIC_API_URL)}/api/v1`;

function parseErrorPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const candidate = payload as {
    code?: unknown;
    detail?: unknown;
    message?: unknown;
  };

  return {
    code: typeof candidate.code === "string" ? candidate.code : undefined,
    detail:
      typeof candidate.detail === "string"
        ? candidate.detail
        : typeof candidate.message === "string"
          ? candidate.message
          : undefined,
  };
}

async function requestAuthedJson<T>(
  path: string,
  init: RequestInit,
  accessToken: string | null,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const { code, detail } = parseErrorPayload(payload);
    throw new MobileSettingsApiError(detail ?? "Request failed", {
      code,
      detail,
    });
  }

  return payload as T;
}

export async function updatePreferredLanguage(payload: {
  accessToken: string | null;
  preferredLanguage: BackendPreferredLanguage;
}) {
  const response = await requestAuthedJson<RawAccountResponse>(
    "/auth/language",
    {
      method: "PATCH",
      body: JSON.stringify({
        preferred_language: payload.preferredLanguage,
      }),
    },
    payload.accessToken,
  );

  return {
    preferredLanguage: response.preferred_language,
  };
}

export async function fetchPushPreferences(payload: {
  accessToken: string | null;
}): Promise<MobilePushPreferences> {
  const response = await requestAuthedJson<RawPushNotificationPreferencesResponse>(
    "/push-notifications/preferences",
    {
      method: "GET",
    },
    payload.accessToken,
  );

  return {
    childrenEnabled: response.children_enabled,
    beforeReminderMinutes: response.before_reminder_minutes,
    pillboxEnabled: response.pillbox_enabled,
    pillboxBeforeReminderMinutes: response.pillbox_before_reminder_minutes,
    cabinetNotify10Days: response.cabinet_notify_10_days,
    cabinetNotify7Days: response.cabinet_notify_7_days,
    cabinetNotify3Days: response.cabinet_notify_3_days,
    liveActivitySleepEnabled: response.live_activity_sleep_enabled,
    liveActivityFeedingEnabled: response.live_activity_feeding_enabled,
    liveActivityIllnessEnabled: response.live_activity_illness_enabled,
  };
}

export async function updatePushPreferences(payload: {
  accessToken: string | null;
  childrenEnabled?: boolean;
  beforeReminderMinutes?: number;
  pillboxEnabled?: boolean;
  pillboxBeforeReminderMinutes?: number;
  cabinetNotify10Days?: boolean;
  cabinetNotify7Days?: boolean;
  cabinetNotify3Days?: boolean;
  liveActivitySleepEnabled?: boolean;
  liveActivityFeedingEnabled?: boolean;
  liveActivityIllnessEnabled?: boolean;
}): Promise<MobilePushPreferences> {
  const response = await requestAuthedJson<RawPushNotificationPreferencesResponse>(
    "/push-notifications/preferences",
    {
      method: "PATCH",
      body: JSON.stringify({
        children_enabled: payload.childrenEnabled,
        before_reminder_minutes: payload.beforeReminderMinutes,
        pillbox_enabled: payload.pillboxEnabled,
        pillbox_before_reminder_minutes: payload.pillboxBeforeReminderMinutes,
        cabinet_notify_10_days: payload.cabinetNotify10Days,
        cabinet_notify_7_days: payload.cabinetNotify7Days,
        cabinet_notify_3_days: payload.cabinetNotify3Days,
        live_activity_sleep_enabled: payload.liveActivitySleepEnabled,
        live_activity_feeding_enabled: payload.liveActivityFeedingEnabled,
        live_activity_illness_enabled: payload.liveActivityIllnessEnabled,
      }),
    },
    payload.accessToken,
  );

  return {
    childrenEnabled: response.children_enabled,
    beforeReminderMinutes: response.before_reminder_minutes,
    pillboxEnabled: response.pillbox_enabled,
    pillboxBeforeReminderMinutes: response.pillbox_before_reminder_minutes,
    cabinetNotify10Days: response.cabinet_notify_10_days,
    cabinetNotify7Days: response.cabinet_notify_7_days,
    cabinetNotify3Days: response.cabinet_notify_3_days,
    liveActivitySleepEnabled: response.live_activity_sleep_enabled,
    liveActivityFeedingEnabled: response.live_activity_feeding_enabled,
    liveActivityIllnessEnabled: response.live_activity_illness_enabled,
  };
}

export async function fetchPushConfig(payload: {
  accessToken: string | null;
}): Promise<MobilePushConfig> {
  const response = await requestAuthedJson<RawPushNotificationConfigResponse>(
    "/push-notifications/config",
    {
      method: "GET",
    },
    payload.accessToken,
  );

  return {
    enabled: response.enabled,
  };
}

export async function fetchMyFamilySettingsSummary(payload: {
  accessToken: string | null;
}): Promise<MobileFamilySettingsSummary> {
  const response = await requestAuthedJson<RawFamilyResponse>(
    "/families/me",
    {
      method: "GET",
    },
    payload.accessToken,
  );

  return {
    id: response.id,
    name: response.name,
    ownerAccountId: response.owner_account_id ?? null,
    planCode: response.plan_code ?? "free",
    subscriptionStatus: response.subscription_status ?? "inactive",
    subscriptionExpiresAt: response.subscription_expires_at ?? null,
    premiumActive: Boolean(response.premium_active),
  };
}

export async function fetchMyFamilyAccessSummary(payload: {
  accessToken: string | null;
}): Promise<MobileFamilyAccessSummary> {
  const response = await requestAuthedJson<RawFamilyAccessResponse>(
    "/families/me/access",
    {
      method: "GET",
    },
    payload.accessToken,
  );

  return {
    planCode: response.plan_code ?? "free",
    subscriptionStatus: response.subscription_status ?? "inactive",
    premiumActive: Boolean(response.premium_active),
    canManageSubscription: Boolean(response.can_manage_subscription),
    canUseLiveActivities: Boolean(response.can_use_live_activities),
    currentChildrenCount: response.current_children_count ?? 0,
    currentAdultsCount: response.current_adults_count ?? 0,
    currentPillboxPlanCount: response.current_pillbox_plan_count ?? 0,
  };
}

export async function changePassword(payload: {
  accessToken: string | null;
  currentPassword: string;
  newPassword: string;
}) {
  await requestAuthedJson<void>(
    "/auth/password",
    {
      method: "PATCH",
      body: JSON.stringify({
        current_password: payload.currentPassword,
        new_password: payload.newPassword,
      }),
    },
    payload.accessToken,
  );
}

export async function updateRecoveryCode(payload: {
  accessToken: string | null;
  recoveryCode: string;
}) {
  await requestAuthedJson<void>(
    "/auth/recovery-code",
    {
      method: "PATCH",
      body: JSON.stringify({
        recovery_code: payload.recoveryCode,
      }),
    },
    payload.accessToken,
  );
}

export async function deleteMyAccount(payload: {
  accessToken: string | null;
}) {
  await requestAuthedJson<void>(
    "/auth/me",
    {
      method: "DELETE",
    },
    payload.accessToken,
  );
}

export async function deleteMyFamily(payload: {
  accessToken: string | null;
}) {
  await requestAuthedJson<void>(
    "/auth/family",
    {
      method: "DELETE",
    },
    payload.accessToken,
  );
}

export function applyPreferredLanguageToSession(
  session: MobileAuthSession,
  preferredLanguage: MobileLocale,
): MobileAuthSession {
  return {
    ...session,
    account: {
      ...session.account,
      preferredLanguage,
    },
  };
}
