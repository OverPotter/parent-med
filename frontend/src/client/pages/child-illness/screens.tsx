import type { UseMutationResult } from "@tanstack/react-query";
import type { Dispatch, SetStateAction } from "react";
import type { NavigateFunction } from "react-router-dom";
import { getLocalIsoDate, isFutureDeviceDate } from "@shared/utils/date";
import type { FamilyMember, IllnessEpisode, WeightEntry } from "@shared/types/api";
import { EpisodeActivationCard } from "./forms";
import {
  HistoryEpisodeCard,
  HistoryEpisodeInsightsScreen,
  HistoryInsightsPreview,
} from "./history";
import { EpisodeBlock } from "./EpisodeBlock";
import { illnessFlatPanelClass } from "./shared";

export type CreateIllnessEpisodePayload = {
  started_at: string;
  title?: string | null;
  medication_mode: string;
  note?: string | null;
  notification_recipient_account_ids?: string[];
  temperatures: Array<{ value_celsius: number }>;
  administrations: Array<{
    household_medicine_id?: string | null;
    custom_medicine_name?: string | null;
    amount: string;
  }>;
  comments: Array<{ text: string }>;
  medication_plans: Array<{
    household_medicine_id?: string | null;
    custom_medicine_name?: string | null;
    dose_amount: string;
    min_interval_minutes: number;
    max_doses_per_day?: number | null;
    weight_kg?: number | null;
    dose_mg_per_kg?: number | null;
    notes?: string | null;
  }>;
};

export function ChildIllnessActiveScreen({
  activeEpisode,
  child,
  currentFamilyId,
  eligibleIllnessRecipients,
  initialComposerMode,
  latestWeight,
  onClose,
  quickComposeMode,
  quickReminderCreateMode,
  quickReminderDetailMode,
  quickReminderMode,
  quickTimelineMode,
  reminderPlanId,
  planLocksChildActions,
  onLockedActionAttempt,
}: {
  activeEpisode: IllnessEpisode;
  child: { id: string; name: string };
  currentFamilyId: string | null;
  eligibleIllnessRecipients: FamilyMember[];
  initialComposerMode: "temperature" | "administration" | "comment";
  latestWeight: WeightEntry | null;
  onClose: () => void;
  quickComposeMode: "temperature" | "administration" | "comment" | null;
  quickReminderCreateMode: boolean;
  quickReminderDetailMode: boolean;
  quickReminderMode: boolean;
  quickTimelineMode: boolean;
  reminderPlanId: string | null;
  planLocksChildActions: boolean;
  onLockedActionAttempt: () => void;
}) {
  return (
    <section className="space-y-3">
      <EpisodeBlock
        childName={child.name}
        childId={child.id}
        episode={activeEpisode}
        familyMembers={eligibleIllnessRecipients}
        onClose={onClose}
        familyId={currentFamilyId}
        latestWeight={latestWeight}
        initialComposerMode={initialComposerMode}
        quickComposeMode={quickComposeMode}
        quickTimelineMode={quickTimelineMode}
        quickReminderMode={quickReminderMode}
        quickReminderCreateMode={quickReminderCreateMode}
        quickReminderDetailMode={quickReminderDetailMode}
        reminderPlanId={reminderPlanId}
        planLocksChildActions={planLocksChildActions}
        onLockedActionAttempt={onLockedActionAttempt}
      />
    </section>
  );
}

export function ChildIllnessCreateScreen({
  createEpisodeMutation,
  createEpisodeValidationError,
  language,
  navigate,
  setCreateEpisodeValidationError,
}: {
  createEpisodeMutation: UseMutationResult<
    IllnessEpisode,
    Error,
    CreateIllnessEpisodePayload,
    unknown
  >;
  createEpisodeValidationError: string | null;
  language: "ru" | "en";
  navigate: NavigateFunction;
  setCreateEpisodeValidationError: Dispatch<SetStateAction<string | null>>;
}) {
  return (
    <section className="space-y-3">
      <EpisodeActivationCard
        isPending={createEpisodeMutation.isPending}
        errorMessage={
          createEpisodeValidationError ??
          (
            createEpisodeMutation.error as {
              response?: { data?: { detail?: string } };
            }
          )?.response?.data?.detail ??
          null
        }
        onActivate={(payload) => {
          if (isFutureDeviceDate(payload.started_at)) {
            setCreateEpisodeValidationError(
              language === "ru"
                ? `Дата начала не может быть позже даты на устройстве (${getLocalIsoDate()}).`
                : `Start date cannot be later than the device date (${getLocalIsoDate()}).`
            );
            return;
          }
          setCreateEpisodeValidationError(null);
          createEpisodeMutation.mutate(payload);
        }}
        onCancel={() => navigate("/children")}
      />
    </section>
  );
}

export function ChildIllnessHistoryScreen({
  childId,
  historyEpisodeInsightsMode,
  historyEpisodes,
  focusedHistoryEpisode,
  language,
}: {
  childId: string;
  historyEpisodeInsightsMode: boolean;
  historyEpisodes: IllnessEpisode[];
  focusedHistoryEpisode: IllnessEpisode | null;
  language: "ru" | "en";
}) {
  return (
    <section className="space-y-3">
      {historyEpisodeInsightsMode && focusedHistoryEpisode ? (
        <HistoryEpisodeInsightsScreen episode={focusedHistoryEpisode} />
      ) : null}

      {!historyEpisodeInsightsMode && <HistoryInsightsPreview childId={childId} />}

      {!historyEpisodeInsightsMode && historyEpisodes.length > 0 ? (
        <ul className="grid gap-2.5">
          {historyEpisodes.map((episode) => (
            <HistoryEpisodeCard
              key={episode.id}
              childId={childId}
              episode={episode}
              episodeNumber={
                historyEpisodes.length - historyEpisodes.findIndex((item) => item.id === episode.id)
              }
            />
          ))}
        </ul>
      ) : !historyEpisodeInsightsMode ? (
        <div className={`${illnessFlatPanelClass} px-5 py-8 text-sm text-muted`}>
          {language === "ru" ? "История пока пустая." : "History is still empty."}
        </div>
      ) : null}
    </section>
  );
}
