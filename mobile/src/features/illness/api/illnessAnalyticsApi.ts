import type { MobileAuthSession } from "../../auth/api/authApi";
import {
  requestIllnessAuthedJson,
  type MobileIllnessApiErrorOptions,
} from "./illnessApiClient";

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

type RawIllnessEpisodeCreateRequest = {
  child_id: string;
  started_at: string;
  title: string | null;
  medication_mode: string;
  note: string | null;
  member_account_ids: string[];
};

type RawIllnessEpisodeUpdateRequest = {
  started_at?: string;
  title?: string | null;
  status?: string;
  medication_mode?: string;
  note?: string | null;
  member_account_ids?: string[];
  closed_at?: string | null;
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
  memberAccountIds: string[];
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

  constructor(message: string, options?: MobileIllnessApiErrorOptions) {
    super(message);
    this.name = "MobileIllnessAnalyticsApiError";
    this.code = options?.code;
    this.detail = options?.detail;
  }
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
    memberAccountIds: raw.member_account_ids,
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
  const response = await requestIllnessAuthedJson<RawIllnessHistorySummaryResponse>(
    `/illness-episodes/child/${encodeURIComponent(childId)}/history-summary?period=${encodeURIComponent(period)}`,
    { method: "GET" },
    session.accessToken,
    (message, options) => new MobileIllnessAnalyticsApiError(message, options),
  );

  return toMobileIllnessHistorySummary(response);
}

export async function fetchMobileIllnessEpisodes(
  session: Pick<MobileAuthSession, "accessToken">,
  childId: string,
): Promise<MobileIllnessEpisode[]> {
  const response = await requestIllnessAuthedJson<RawIllnessEpisodeResponse[]>(
    `/illness-episodes?child_id=${encodeURIComponent(childId)}`,
    { method: "GET" },
    session.accessToken,
    (message, options) => new MobileIllnessAnalyticsApiError(message, options),
  );

  return response.map(toMobileIllnessEpisode);
}

export async function fetchMobileActiveIllnessEpisode(
  session: Pick<MobileAuthSession, "accessToken">,
  childId: string,
): Promise<MobileIllnessEpisode | null> {
  const response = await requestIllnessAuthedJson<RawIllnessEpisodeResponse | null>(
    `/illness-episodes/child/${encodeURIComponent(childId)}/active`,
    { method: "GET" },
    session.accessToken,
    (message, options) => new MobileIllnessAnalyticsApiError(message, options),
  );

  return response ? toMobileIllnessEpisode(response) : null;
}

export async function createMobileIllnessEpisode(
  session: Pick<MobileAuthSession, "accessToken">,
  payload: {
    childId: string;
    startedAt: string;
    title?: string | null;
    medicationMode?: string;
    note?: string | null;
    memberAccountIds?: string[];
  },
): Promise<MobileIllnessEpisode> {
  const body: RawIllnessEpisodeCreateRequest = {
    child_id: payload.childId,
    started_at: payload.startedAt,
    title: payload.title ?? null,
    medication_mode: payload.medicationMode ?? "manual",
    note: payload.note ?? null,
    member_account_ids: payload.memberAccountIds ?? [],
  };

  const response = await requestIllnessAuthedJson<RawIllnessEpisodeResponse>(
    "/illness-episodes",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    session.accessToken,
    (message, options) => new MobileIllnessAnalyticsApiError(message, options),
  );

  return toMobileIllnessEpisode(response);
}

export async function updateMobileIllnessEpisode(
  session: Pick<MobileAuthSession, "accessToken">,
  episodeId: string,
  patch: {
    startedAt?: string;
    title?: string | null;
    status?: string;
    medicationMode?: string;
    note?: string | null;
    memberAccountIds?: string[];
    closedAt?: string | null;
  },
): Promise<MobileIllnessEpisode> {
  const body: RawIllnessEpisodeUpdateRequest = {};

  if (patch.startedAt !== undefined) {
    body.started_at = patch.startedAt;
  }
  if (patch.title !== undefined) {
    body.title = patch.title;
  }
  if (patch.status !== undefined) {
    body.status = patch.status;
  }
  if (patch.medicationMode !== undefined) {
    body.medication_mode = patch.medicationMode;
  }
  if (patch.note !== undefined) {
    body.note = patch.note;
  }
  if (patch.memberAccountIds !== undefined) {
    body.member_account_ids = patch.memberAccountIds;
  }
  if (patch.closedAt !== undefined) {
    body.closed_at = patch.closedAt;
  }

  const response = await requestIllnessAuthedJson<RawIllnessEpisodeResponse>(
    `/illness-episodes/${encodeURIComponent(episodeId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
    session.accessToken,
    (message, options) => new MobileIllnessAnalyticsApiError(message, options),
  );

  return toMobileIllnessEpisode(response);
}

export async function fetchMobileIllnessEpisodeInsights(
  session: Pick<MobileAuthSession, "accessToken">,
  episodeId: string,
): Promise<MobileIllnessEpisodeInsights> {
  const response = await requestIllnessAuthedJson<RawIllnessEpisodeInsightsResponse>(
    `/illness-episodes/${encodeURIComponent(episodeId)}/insights`,
    { method: "GET" },
    session.accessToken,
    (message, options) => new MobileIllnessAnalyticsApiError(message, options),
  );

  return toMobileIllnessEpisodeInsights(response);
}

export async function deleteMobileIllnessEpisode(
  session: Pick<MobileAuthSession, "accessToken">,
  episodeId: string,
): Promise<void> {
  await requestIllnessAuthedJson<null>(
    `/illness-episodes/${encodeURIComponent(episodeId)}`,
    { method: "DELETE" },
    session.accessToken,
    (message, options) => new MobileIllnessAnalyticsApiError(message, options),
  );
}
