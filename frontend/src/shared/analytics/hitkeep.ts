/** HitKeep: first-party transport, sanitize props. */

import { Capacitor } from "@capacitor/core";
import { hashIdentifierForAnalytics, type AnalyticsHashKind } from "@shared/api/analytics";
import { AnalyticsEvents } from "./events";

const SESSION_KEY = "hk_session_v1";
const SESSION_TTL_MS = 30 * 60 * 1000;

export function isHitKeepConfigured(): boolean {
  return Boolean(import.meta.env.VITE_HITKEEP_SCRIPT_URL?.trim());
}

function isNativeRuntime(): boolean {
  return Capacitor.isNativePlatform();
}

function getHitKeepOrigin(): string | null {
  const raw = import.meta.env.VITE_HITKEEP_SCRIPT_URL?.trim();
  if (!raw) {
    return null;
  }
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
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

export function flushHitKeepQueue(): void {
  // No-op: events are posted directly without a client-side queue.
}

export function trackEvent(name: string, props?: Record<string, unknown>): void {
  if (!isHitKeepConfigured()) {
    return;
  }
  const payload = sanitizeProps(props);
  if (typeof window === "undefined") {
    return;
  }
  void postHitKeepEvent(name, payload);
}

function randomUuid(): string {
  const runtimeCrypto = typeof globalThis.crypto !== "undefined" ? globalThis.crypto : null;
  if (runtimeCrypto && typeof runtimeCrypto.randomUUID === "function") {
    return runtimeCrypto.randomUUID();
  }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) =>
    (
      Number(char) ^
      (((runtimeCrypto?.getRandomValues(new Uint8Array(1))[0] ?? 0) & 15) >> (Number(char) / 4))
    ).toString(16)
  );
}

function getSessionId(): string {
  const now = Date.now();
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const [sessionId, timestampRaw] = raw.split("|");
      const timestamp = Number.parseInt(timestampRaw ?? "", 10);
      if (sessionId && Number.isFinite(timestamp) && now - timestamp < SESSION_TTL_MS) {
        window.sessionStorage.setItem(SESSION_KEY, `${sessionId}|${now}`);
        return sessionId;
      }
    }
  } catch {
    // Ignore sessionStorage failures and regenerate a transient session id.
  }

  const sessionId = randomUuid();
  try {
    window.sessionStorage.setItem(SESSION_KEY, `${sessionId}|${now}`);
  } catch {
    // Ignore storage failures for transient analytics state.
  }
  return sessionId;
}

async function postHitKeepEvent(name: string, props?: Record<string, unknown>): Promise<void> {
  const origin = getHitKeepOrigin();
  if (!origin || typeof window === "undefined") {
    return;
  }

  const sessionId = getSessionId();
  try {
    await fetch(`${origin}/ingest/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        n: name,
        p: props ?? {},
        sid: sessionId,
      }),
      keepalive: true,
      credentials: "omit",
    });
  } catch {
    // Best-effort analytics only.
  }
}

export async function trackNativePageView(args: {
  path: string;
  isAuthenticated: boolean;
  role: string;
}): Promise<void> {
  const origin = getHitKeepOrigin();
  if (!origin || typeof window === "undefined" || !isNativeRuntime()) {
    return;
  }

  const sessionId = getSessionId();
  const viewportWidth = typeof window.innerWidth === "number" ? window.innerWidth : null;
  const viewportHeight = typeof window.innerHeight === "number" ? window.innerHeight : null;
  const screenWidth = typeof window.screen?.width === "number" ? window.screen.width : null;
  const screenHeight = typeof window.screen?.height === "number" ? window.screen.height : null;

  try {
    await fetch(`${origin}/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: args.path,
        referrer: null,
        ua: navigator.userAgent,
        vp_w: viewportWidth,
        vp_h: viewportHeight,
        sc_w: screenWidth,
        sc_h: screenHeight,
        lang: navigator.language,
        unique: false,
        session_id: sessionId,
        page_id: randomUuid(),
        is_authenticated: args.isAuthenticated,
        role: args.role,
      }),
      keepalive: true,
      credentials: "omit",
    });
  } catch {
    // Best-effort analytics only.
  }
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

export async function hashForAnalytics(
  kind: AnalyticsHashKind,
  value: string
): Promise<string | null> {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  try {
    return await hashIdentifierForAnalytics(kind, normalized);
  } catch {
    return null;
  }
}

export async function trackSessionIdentify(
  accountId: string,
  familyRole: string | null
): Promise<void> {
  const user_hash = await hashForAnalytics("account", accountId);
  if (!user_hash) {
    return;
  }
  trackEvent(AnalyticsEvents.SESSION_IDENTIFY, {
    user_hash,
    family_role: familyRole ?? "unknown",
  });
}

export async function trackChildCreated(childId: string): Promise<void> {
  const child_id_hash = await hashForAnalytics("child", childId);
  if (!child_id_hash) {
    return;
  }
  trackEvent(AnalyticsEvents.CHILD_CREATED, { child_id_hash });
}

export async function trackIllnessEpisodeStarted(episodeId: string): Promise<void> {
  const episode_id_hash = await hashForAnalytics("episode", episodeId);
  if (!episode_id_hash) {
    return;
  }
  trackEvent(AnalyticsEvents.ILLNESS_EPISODE_STARTED, { episode_id_hash });
}

export async function trackTemperatureLogged(episodeId: string): Promise<void> {
  const episode_id_hash = await hashForAnalytics("episode", episodeId);
  if (!episode_id_hash) {
    return;
  }
  trackEvent(AnalyticsEvents.TEMPERATURE_LOGGED, { episode_id_hash });
}

export function trackHouseholdMedicineAdded(source: "catalog" | "manual"): void {
  trackEvent(AnalyticsEvents.HOUSEHOLD_MEDICINE_ADDED, { source });
}

export function trackMedicationAdministered(context: "active_illnesses" | "episode_detail"): void {
  trackEvent(AnalyticsEvents.MEDICATION_ADMINISTERED, { context });
}
