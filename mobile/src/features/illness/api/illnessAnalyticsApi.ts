import type { MobileAuthSession } from "../../auth/api/authApi";

type RawIllnessAnalyticsSeriesPoint = {
  label: string;
  value: number;
};

type RawIllnessAnalyticsDurationBucket = {
  label: string;
  value: number;
};

type RawIllnessHistorySummaryResponse = {
  period: string;
  total_closed_episodes: number;
  episode_count: number;
  last_episode_started_at: string | null;
  days_since_last_episode: number | null;
  most_active_period_label: string | null;
  average_duration_days: number;
  longest_duration_days: number;
  episodes_with_temperature_38_plus: number;
  episodes_with_temperature_39_plus: number;
  episodes_with_administrations: number;
  observation_only_episodes: number;
  guided_episodes: number;
  total_temperature_entries: number;
  timeline: RawIllnessAnalyticsSeriesPoint[];
  duration_buckets: RawIllnessAnalyticsDurationBucket[];
};

type RawIllnessEpisodeResponse = {
  id: string;
  child_id: string;
  started_at: string;
  title: string | null;
  status: string;
  medication_mode: string;
  note: string | null;
  member_account_ids: string[];
  created_by_account_id: string | null;
  closed_at: string | null;
};

type RawEpisodeTemperaturePoint = {
  measured_at: string;
  value_celsius: number;
};

type RawIllnessEpisodeInsightsResponse = {
  episode_id: string;
  duration_days: number;
  peak_temperature_celsius: number | null;
  peak_temperature_at: string | null;
  last_temperature_celsius: number | null;
  last_event_at: string | null;
  temperature_count: number;
  administration_count: number;
  comment_count: number;
  medication_mode: string;
  medicine_names: string[];
  total_events: number;
  first_temperature_at: string | null;
  last_administration_at: string | null;
  temperature_points: RawEpisodeTemperaturePoint[];
};

export type MobileIllnessHistorySummary = {
  period: string;
  totalClosedEpisodes: number;
  episodeCount: number;
  lastEpisodeStartedAt: string | null;
  daysSinceLastEpisode: number | null;
  mostActivePeriodLabel: string | null;
  averageDurationDays: number;
  longestDurationDays: number;
  episodesWithTemperature38Plus: number;
  episodesWithTemperature39Plus: number;
  episodesWithAdministrations: number;
  observationOnlyEpisodes: number;
  guidedEpisodes: number;
  totalTemperatureEntries: number;
  timeline: Array<{ label: string; value: number }>;
  durationBuckets: Array<{ label: string; value: number }>;
};

export type MobileIllnessEpisode = {
  id: string;
  childId: string;
  startedAt: string;
  title: string | null;
  status: string;
  medicationMode: string;
  note: string | null;
  createdByAccountId: string | null;
  closedAt: string | null;
};

export type MobileIllnessEpisodeInsights = {
  episodeId: string;
  durationDays: number;
  peakTemperatureCelsius: number | null;
  peakTemperatureAt: string | null;
  lastTemperatureCelsius: number | null;
  lastEventAt: string | null;
  temperatureCount: number;
  administrationCount: number;
  commentCount: number;
  medicationMode: string;
  medicineNames: string[];
  totalEvents: number;
  firstTemperatureAt: string | null;
  lastAdministrationAt: string | null;
  temperaturePoints: Array<{ measuredAt: string; valueCelsius: number }>;
};

export class MobileIllnessAnalyticsApiError extends Error {
  code?: string;
  detail?: string;

  constructor(message: string, options?: { code?: string; detail?: string }) {
    super(message);
    this.name = "MobileIllnessAnalyticsApiError";
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
    throw new MobileIllnessAnalyticsApiError(detail ?? "Request failed", {
      code,
      detail,
    });
  }

  return payload as T;
}

function toMobileIllnessHistorySummary(
  raw: RawIllnessHistorySummaryResponse,
): MobileIllnessHistorySummary {
  return {
    period: raw.period,
    totalClosedEpisodes: raw.total_closed_episodes,
    episodeCount: raw.episode_count,
    lastEpisodeStartedAt: raw.last_episode_started_at,
    daysSinceLastEpisode: raw.days_since_last_episode,
    mostActivePeriodLabel: raw.most_active_period_label,
    averageDurationDays: raw.average_duration_days,
    longestDurationDays: raw.longest_duration_days,
    episodesWithTemperature38Plus: raw.episodes_with_temperature_38_plus,
    episodesWithTemperature39Plus: raw.episodes_with_temperature_39_plus,
    episodesWithAdministrations: raw.episodes_with_administrations,
    observationOnlyEpisodes: raw.observation_only_episodes,
    guidedEpisodes: raw.guided_episodes,
    totalTemperatureEntries: raw.total_temperature_entries,
    timeline: raw.timeline.map((item) => ({ label: item.label, value: item.value })),
    durationBuckets: raw.duration_buckets.map((item) => ({
      label: item.label,
      value: item.value,
    })),
  };
}

function toMobileIllnessEpisode(raw: RawIllnessEpisodeResponse): MobileIllnessEpisode {
  return {
    id: raw.id,
    childId: raw.child_id,
    startedAt: raw.started_at,
    title: raw.title,
    status: raw.status,
    medicationMode: raw.medication_mode,
    note: raw.note,
    createdByAccountId: raw.created_by_account_id,
    closedAt: raw.closed_at,
  };
}

function toMobileIllnessEpisodeInsights(
  raw: RawIllnessEpisodeInsightsResponse,
): MobileIllnessEpisodeInsights {
  return {
    episodeId: raw.episode_id,
    durationDays: raw.duration_days,
    peakTemperatureCelsius: raw.peak_temperature_celsius,
    peakTemperatureAt: raw.peak_temperature_at,
    lastTemperatureCelsius: raw.last_temperature_celsius,
    lastEventAt: raw.last_event_at,
    temperatureCount: raw.temperature_count,
    administrationCount: raw.administration_count,
    commentCount: raw.comment_count,
    medicationMode: raw.medication_mode,
    medicineNames: raw.medicine_names,
    totalEvents: raw.total_events,
    firstTemperatureAt: raw.first_temperature_at,
    lastAdministrationAt: raw.last_administration_at,
    temperaturePoints: raw.temperature_points.map((item) => ({
      measuredAt: item.measured_at,
      valueCelsius: item.value_celsius,
    })),
  };
}

export async function fetchMobileIllnessHistorySummary(
  session: Pick<MobileAuthSession, "accessToken">,
  childId: string,
  period: "month" | "quarter" | "half_year" | "year" | "all",
): Promise<MobileIllnessHistorySummary> {
  const response = await requestAuthedJson<RawIllnessHistorySummaryResponse>(
    `/illness-episodes/child/${encodeURIComponent(childId)}/history-summary?period=${encodeURIComponent(period)}`,
    { method: "GET" },
    session.accessToken,
  );

  return toMobileIllnessHistorySummary(response);
}

export async function fetchMobileIllnessEpisodes(
  session: Pick<MobileAuthSession, "accessToken">,
  childId: string,
): Promise<MobileIllnessEpisode[]> {
  const response = await requestAuthedJson<RawIllnessEpisodeResponse[]>(
    `/illness-episodes?child_id=${encodeURIComponent(childId)}`,
    { method: "GET" },
    session.accessToken,
  );

  return response.map(toMobileIllnessEpisode);
}

export async function fetchMobileIllnessEpisodeInsights(
  session: Pick<MobileAuthSession, "accessToken">,
  episodeId: string,
): Promise<MobileIllnessEpisodeInsights> {
  const response = await requestAuthedJson<RawIllnessEpisodeInsightsResponse>(
    `/illness-episodes/${encodeURIComponent(episodeId)}/insights`,
    { method: "GET" },
    session.accessToken,
  );

  return toMobileIllnessEpisodeInsights(response);
}

export async function deleteMobileIllnessEpisode(
  session: Pick<MobileAuthSession, "accessToken">,
  episodeId: string,
): Promise<void> {
  await requestAuthedJson<null>(
    `/illness-episodes/${encodeURIComponent(episodeId)}`,
    { method: "DELETE" },
    session.accessToken,
  );
}
