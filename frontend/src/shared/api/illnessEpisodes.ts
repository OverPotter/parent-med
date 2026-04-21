/**
 * Запросы к API: эпизоды болезни.
 */

import { apiClient } from "./client";
import type {
  IllnessAnalyticsDurationBucket,
  IllnessAnalyticsSeriesPoint,
  IllnessEpisode,
  IllnessEpisodeInsights,
  IllnessHistorySummary,
} from "@shared/types/api";
import { toIllnessEpisode } from "@shared/types/transform";

interface RawIllnessEpisode {
  id: string;
  child_id: string;
  started_at: string;
  title: string | null;
  status: string;
  medication_mode: string;
  note: string | null;
  member_account_ids: string[] | null;
  closed_at: string | null;
}

interface RawIllnessAnalyticsSeriesPoint {
  label: string;
  value: number;
}

interface RawIllnessAnalyticsDurationBucket {
  label: string;
  value: number;
}

interface RawIllnessHistorySummary {
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
}

interface RawEpisodeTemperaturePoint {
  measured_at: string;
  value_celsius: number;
}

interface RawIllnessEpisodeInsights {
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
}

function toSeriesPoint(point: RawIllnessAnalyticsSeriesPoint): IllnessAnalyticsSeriesPoint {
  return {
    label: point.label,
    value: point.value,
  };
}

function toDurationBucket(
  bucket: RawIllnessAnalyticsDurationBucket
): IllnessAnalyticsDurationBucket {
  return {
    label: bucket.label,
    value: bucket.value,
  };
}

function toHistorySummary(raw: RawIllnessHistorySummary): IllnessHistorySummary {
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
    timeline: (raw.timeline ?? []).map(toSeriesPoint),
    durationBuckets: (raw.duration_buckets ?? []).map(toDurationBucket),
  };
}

function toEpisodeInsights(raw: RawIllnessEpisodeInsights): IllnessEpisodeInsights {
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
    medicineNames: raw.medicine_names ?? [],
    totalEvents: raw.total_events,
    firstTemperatureAt: raw.first_temperature_at,
    lastAdministrationAt: raw.last_administration_at,
    temperaturePoints: (raw.temperature_points ?? []).map((point) => ({
      measuredAt: point.measured_at,
      valueCelsius: point.value_celsius,
    })),
  };
}

export async function fetchIllnessEpisodesByChildId(childId: string): Promise<IllnessEpisode[]> {
  const res = await apiClient.get<RawIllnessEpisode[]>("/illness-episodes", {
    params: { child_id: childId },
  });
  return (res.data ?? []).map(toIllnessEpisode);
}

export async function fetchActiveIllnessEpisodeByChildId(
  childId: string
): Promise<IllnessEpisode | null> {
  const res = await apiClient.get<RawIllnessEpisode | null>(
    `/illness-episodes/child/${childId}/active`
  );
  return res.data ? toIllnessEpisode(res.data) : null;
}

export async function fetchIllnessEpisode(id: string): Promise<IllnessEpisode> {
  const res = await apiClient.get<RawIllnessEpisode>(`/illness-episodes/${id}`);
  return toIllnessEpisode(res.data);
}

export async function fetchIllnessHistorySummary(
  childId: string,
  period: "month" | "quarter" | "half_year" | "year" | "all"
): Promise<IllnessHistorySummary> {
  const res = await apiClient.get<RawIllnessHistorySummary>(
    `/illness-episodes/child/${childId}/history-summary`,
    {
      params: { period },
    }
  );
  return toHistorySummary(res.data);
}

export async function fetchIllnessEpisodeInsights(
  episodeId: string
): Promise<IllnessEpisodeInsights> {
  const res = await apiClient.get<RawIllnessEpisodeInsights>(
    `/illness-episodes/${episodeId}/insights`
  );
  return toEpisodeInsights(res.data);
}

export async function createIllnessEpisode(body: {
  child_id: string;
  started_at: string;
  title?: string | null;
  medication_mode?: string;
  note?: string | null;
  member_account_ids?: string[];
}): Promise<IllnessEpisode> {
  const res = await apiClient.post<RawIllnessEpisode>("/illness-episodes", body);
  return toIllnessEpisode(res.data);
}

export async function updateIllnessEpisode(
  id: string,
  body: {
    started_at?: string;
    title?: string | null;
    status?: string;
    medication_mode?: string;
    note?: string | null;
    member_account_ids?: string[];
    closed_at?: string | null;
  }
): Promise<IllnessEpisode> {
  const res = await apiClient.patch<RawIllnessEpisode>(`/illness-episodes/${id}`, body);
  return toIllnessEpisode(res.data);
}

export async function deleteIllnessEpisode(id: string): Promise<void> {
  await apiClient.delete(`/illness-episodes/${id}`);
}
