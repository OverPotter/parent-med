import type { MobileAuthSession } from "../../auth/api/authApi";
import { fetchMobileAdministrationEventsByEpisodeId } from "../api/administrationEventsApi";
import { fetchMobileEpisodeMedicationPlansByEpisodeId } from "../api/episodeMedicationPlansApi";
import { fetchMobileIllnessCommentsByEpisodeId } from "../api/illnessCommentsApi";
import {
  fetchMobileTemperatureEntriesByEpisodeId,
} from "../api/temperatureEntriesApi";
import type { MobileIllnessEpisode } from "../api/illnessAnalyticsApi";
import type { MobileLocale } from "../../../shared/i18n/mobileI18n";
import {
  createMobileIllnessObservationFromEpisode,
  mergeIllnessObservationAdministrationEntries,
  mergeIllnessObservationCommentEntries,
  mergeIllnessObservationMedicationPlanEntries,
  mergeIllnessObservationTemperatureEntries,
  type MobileIllnessObservation,
} from "./illnessObservation";

export function resolveActiveIllnessChildId(
  observationsByChildId: Record<string, MobileIllnessObservation | undefined>,
  preferredChildId: string,
) {
  if (observationsByChildId[preferredChildId]) {
    return preferredChildId;
  }

  return (
    Object.entries(observationsByChildId).find(([, observation]) =>
      Boolean(observation),
    )?.[0] ?? null
  );
}

export function hasActiveIllnessObservation(
  observationsByChildId: Record<string, MobileIllnessObservation | undefined>,
) {
  return Object.values(observationsByChildId).some(Boolean);
}

export function toIllnessEpisodeDate(value: string) {
  return value.slice(0, 10);
}

export async function hydrateObservationFromEpisode(
  session: MobileAuthSession,
  episode: MobileIllnessEpisode,
  locale: MobileLocale,
) {
  const observation = createMobileIllnessObservationFromEpisode(episode, locale);
  const [temperatureEntries, commentEntries, administrationEntries, medicationPlans] =
    await Promise.all([
    fetchMobileTemperatureEntriesByEpisodeId(session, episode.id),
    fetchMobileIllnessCommentsByEpisodeId(session, episode.id),
    fetchMobileAdministrationEventsByEpisodeId(session, episode.id),
    fetchMobileEpisodeMedicationPlansByEpisodeId(session, episode.id),
  ]);

  return mergeIllnessObservationCommentEntries(
    mergeIllnessObservationMedicationPlanEntries(
      mergeIllnessObservationAdministrationEntries(
        mergeIllnessObservationTemperatureEntries(
          observation,
          temperatureEntries,
          locale,
        ),
        administrationEntries,
        locale,
      ),
      medicationPlans,
      locale,
    ),
    commentEntries,
    locale,
  );
}
