/**
 * Запросы к API: guided-планы лекарства внутри эпизода.
 */

import { apiClient } from "./client";
import type { EpisodeMedicationPlan } from "@shared/types/api";
import { toEpisodeMedicationPlan } from "@shared/types/transform";

interface RawEpisodeMedicationPlan {
  id: string;
  episode_id: string;
  household_medicine_id: string;
  dose_amount: string;
  min_interval_minutes: number;
  max_doses_per_day: number | null;
  weight_kg: number | null;
  dose_mg_per_kg: number | null;
  notes: string | null;
  created_at: string;
}

export async function fetchEpisodeMedicationPlansByEpisodeId(
  episodeId: string
): Promise<EpisodeMedicationPlan[]> {
  const res = await apiClient.get<RawEpisodeMedicationPlan[]>("/episode-medication-plans", {
    params: { episode_id: episodeId },
  });
  return (res.data ?? []).map(toEpisodeMedicationPlan);
}

export async function createEpisodeMedicationPlan(body: {
  episode_id: string;
  household_medicine_id: string;
  dose_amount: string;
  min_interval_minutes: number;
  max_doses_per_day?: number | null;
  weight_kg?: number | null;
  dose_mg_per_kg?: number | null;
  notes?: string | null;
}): Promise<EpisodeMedicationPlan> {
  const res = await apiClient.post<RawEpisodeMedicationPlan>("/episode-medication-plans", body);
  return toEpisodeMedicationPlan(res.data);
}

export async function updateEpisodeMedicationPlan(
  id: string,
  body: {
    household_medicine_id?: string;
    dose_amount?: string;
    min_interval_minutes?: number;
    max_doses_per_day?: number | null;
    weight_kg?: number | null;
    dose_mg_per_kg?: number | null;
    notes?: string | null;
  }
): Promise<EpisodeMedicationPlan> {
  const res = await apiClient.patch<RawEpisodeMedicationPlan>(
    `/episode-medication-plans/${id}`,
    body
  );
  return toEpisodeMedicationPlan(res.data);
}

export async function deleteEpisodeMedicationPlan(id: string): Promise<void> {
  await apiClient.delete(`/episode-medication-plans/${id}`);
}
