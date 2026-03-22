/** HitKeep: очередь до hk.js, sanitize props. */

import { AnalyticsEvents } from "./events";

const queue: Array<[string, Record<string, unknown> | undefined]> = [];

export function isHitKeepConfigured(): boolean {
  return Boolean(import.meta.env.VITE_HITKEEP_SCRIPT_URL?.trim());
}

function sanitizeProps(props?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!props) {
    return undefined;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null) {
      continue;
    }
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush(): void {
  if (typeof window === "undefined" || flushTimer !== null) {
    return;
  }
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    flushHitKeepQueue();
  }, 0);
}

export function flushHitKeepQueue(): void {
  while (queue.length > 0 && window.hk?.event) {
    const [name, props] = queue.shift()!;
    try {
      window.hk.event(name, props);
    } catch {
      queue.unshift([name, props]);
      break;
    }
  }
}

export function trackEvent(name: string, props?: Record<string, unknown>): void {
  if (!isHitKeepConfigured()) {
    return;
  }
  const payload = sanitizeProps(props);
  if (typeof window === "undefined") {
    return;
  }
  if (window.hk?.event) {
    try {
      window.hk.event(name, payload);
    } catch {
      void 0;
    }
    return;
  }
  queue.push([name, payload]);
  scheduleFlush();
}

export function normalizeClientError(err: unknown): string {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail.trim().slice(0, 160);
  }
  if (err instanceof Error && err.message) {
    return err.message.slice(0, 160);
  }
  return "unknown";
}

export async function hashForAnalytics(value: string): Promise<string> {
  const salt = import.meta.env.VITE_HITKEEP_USER_HASH_SALT ?? "";
  const input = `${value}\0${salt || "parent-med-dev"}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function trackSessionIdentify(
  accountId: string,
  familyRole: string | null
): Promise<void> {
  const user_hash = await hashForAnalytics(accountId);
  trackEvent(AnalyticsEvents.SESSION_IDENTIFY, {
    user_hash,
    family_role: familyRole ?? "unknown",
  });
}

export async function trackChildCreated(childId: string): Promise<void> {
  const child_id_hash = await hashForAnalytics(childId);
  trackEvent(AnalyticsEvents.CHILD_CREATED, { child_id_hash });
}

export async function trackIllnessEpisodeStarted(episodeId: string): Promise<void> {
  const episode_id_hash = await hashForAnalytics(episodeId);
  trackEvent(AnalyticsEvents.ILLNESS_EPISODE_STARTED, { episode_id_hash });
}

export async function trackTemperatureLogged(episodeId: string): Promise<void> {
  const episode_id_hash = await hashForAnalytics(episodeId);
  trackEvent(AnalyticsEvents.TEMPERATURE_LOGGED, { episode_id_hash });
}

export function trackHouseholdMedicineAdded(source: "catalog" | "manual"): void {
  trackEvent(AnalyticsEvents.HOUSEHOLD_MEDICINE_ADDED, { source });
}

export function trackMedicationAdministered(context: "active_illnesses" | "episode_detail"): void {
  trackEvent(AnalyticsEvents.MEDICATION_ADMINISTERED, { context });
}
