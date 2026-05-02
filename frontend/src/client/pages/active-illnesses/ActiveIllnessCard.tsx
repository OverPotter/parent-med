import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAdministrationEvent } from "@shared/api/administrationEvents";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { requestLiveActivityRefresh } from "@shared/utils/liveActivityRuntimeEvents";
import { closeIllnessEpisodeResilient } from "@shared/utils/offlineCareSync";
import { getCurrentDeviceTimestampIso, formatDate } from "@shared/utils/date";
import type {
  AdministrationEvent,
  Child,
  EpisodeMedicationPlan,
  HouseholdMedicine,
  IllnessEpisode,
} from "@shared/types/api";
import { formatChildAgeLabel, getChildrenCopy } from "@client/i18n/children";
import { useIllnessLiveWidgetState } from "@client/hooks/useIllnessLiveWidgetState";
import { formatIllnessDuration } from "../children/shared";
import { DoseTimeSheet, useDoseLoggingFlow } from "../child-illness/doseLogging";
import {
  invalidateIllnessQueriesForChild,
  setIllnessEpisodesForChild,
  upsertIllnessEpisodeForChild,
} from "../child-illness/episodeCache";
import {
  formatDoseStatusLabel,
  type MedicationPlanPriorityItem,
  getPrioritizedMedicationPlanItems,
} from "../../utils/medicationPlans";

const appBtnPrimaryClass =
  "soft-pill-primary app-profile-action app-profile-action--selected inline-flex min-h-[2.72rem] items-center justify-center px-3.75 text-[0.82rem] tracking-[-0.025em] shadow-[0_16px_34px_rgba(15,23,42,0.16)] transition hover:-translate-y-[1px] hover:shadow-[0_20px_40px_rgba(15,23,42,0.2)] sm:min-h-[2.82rem] sm:text-[0.84rem]";
const appGridPillActionClass =
  "soft-pill app-profile-action inline-flex min-h-[2.65rem] w-full items-center justify-center px-3.5 text-center text-[0.82rem] font-semibold leading-4 tracking-[-0.025em] text-foreground transition hover:opacity-90 sm:min-h-[2.75rem] sm:text-[0.84rem]";
const appWidePillActionClass =
  "soft-pill app-profile-action inline-flex min-h-[2.65rem] w-full items-center justify-center px-3.5 text-center text-[0.82rem] font-semibold leading-4 tracking-[-0.025em] text-foreground transition hover:opacity-90 sm:min-h-[2.75rem] sm:text-[0.84rem]";
const appHeaderDangerPillActionClass =
  "soft-pill-danger app-profile-action inline-flex min-h-[2.4rem] items-center justify-center rounded-full px-3 py-1.5 text-center text-xs font-semibold tracking-[-0.015em] transition hover:opacity-90 whitespace-nowrap";

export function ActiveIllnessCard({
  child,
  episode,
  medicines,
  plans,
  administrations,
  now,
  accountId,
  canUseLiveActivities,
  isTogglingLiveObservation,
  onToggleLiveObservation,
  copy,
  t,
}: {
  child: Child;
  episode: IllnessEpisode;
  medicines: HouseholdMedicine[];
  plans: EpisodeMedicationPlan[];
  administrations: AdministrationEvent[];
  now: Date;
  accountId: string | null;
  canUseLiveActivities: boolean;
  isTogglingLiveObservation: boolean;
  onToggleLiveObservation: () => void;
  copy: ReturnType<typeof getChildrenCopy>["activeIllnesses"];
  t: (text: string, variables?: Record<string, string | number>) => string;
}) {
  const { language } = useI18n();
  const isLiveObservationEnabled = useIllnessLiveWidgetState(episode, accountId);
  const queryClient = useQueryClient();
  const [justSaved, setJustSaved] = useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const ageLabel = formatChildAgeLabel(child.birthDate, child.ageLabel, language);
  const illnessDurationLabel = formatIllnessDuration(episode.startedAt, now.getTime(), language);
  const prioritizedItems = getPrioritizedMedicationPlanItems(
    plans,
    administrations,
    medicines,
    now
  );
  const availableNowItems = prioritizedItems.filter(
    (item) => !item.isUnavailable && !item.stats.isBlocked
  );
  const upcomingItems = prioritizedItems
    .filter(
      (item) =>
        !item.isUnavailable &&
        !item.stats.blockedByDailyLimit &&
        !!item.stats.nextAllowedAt &&
        item.stats.nextAllowedAt > now
    )
    .slice(0, 2);
  const hasUnavailableItems = prioritizedItems.some((item) => item.isUnavailable);
  const availableNowLead = availableNowItems[0] ?? null;
  const availableNowOverflowCount = Math.max(0, availableNowItems.length - 1);
  const upcomingLead = upcomingItems[0] ?? null;

  const takeDoseMutation = useMutation({
    mutationFn: ({
      plan,
      administeredAt,
    }: {
      plan: EpisodeMedicationPlan;
      administeredAt?: string | null;
    }) => {
      if (!plan) {
        throw new Error(copy.noReminder);
      }
      return createAdministrationEvent({
        episode_id: episode.id,
        household_medicine_id: plan.householdMedicineId,
        custom_medicine_name: plan.customMedicineName ?? undefined,
        administered_at: administeredAt ?? getCurrentDeviceTimestampIso(),
        amount: plan.doseAmount,
        reason: copy.reminderReason,
      });
    },
    onSuccess: () => {
      requestLiveActivityRefresh();
      queryClient.invalidateQueries({ queryKey: ["administration-events", episode.id] });
      queryClient.invalidateQueries({ queryKey: ["episode-medication-plans", episode.id] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-insights", episode.id] });
      setJustSaved(true);
      doseLogging.close();
    },
  });

  const doseLogging = useDoseLoggingFlow<MedicationPlanPriorityItem<EpisodeMedicationPlan>>({
    language,
    now,
    onSubmit: (item, administeredAt) =>
      takeDoseMutation.mutate({
        plan: item.plan,
        administeredAt,
      }),
  });

  const closeEpisodeMutation = useMutation({
    mutationFn: () => closeIllnessEpisodeResilient({ childId: child.id, episodeId: episode.id }),
    onSuccess: (closedEpisode) => {
      requestLiveActivityRefresh();
      if (closedEpisode) {
        upsertIllnessEpisodeForChild(queryClient, child.id, closedEpisode);
      } else {
        setIllnessEpisodesForChild(queryClient, child.id, (current) =>
          current.map((item) =>
            item.status === "active" ? { ...item, status: "closed" as const } : item
          )
        );
      }
      invalidateIllnessQueriesForChild(queryClient, child.id);
    },
  });

  useEffect(() => {
    if (!justSaved) {
      return;
    }
    const timeoutId = window.setTimeout(() => setJustSaved(false), 1400);
    return () => window.clearTimeout(timeoutId);
  }, [justSaved]);

  return (
    <li>
      <ConfirmDialog
        isOpen={isCloseConfirmOpen}
        title={t(copy.closeTitle, { name: child.name })}
        description={copy.closeDescription}
        confirmLabel={closeEpisodeMutation.isPending ? copy.closing : copy.closeConfirm}
        confirmTone="danger"
        isPending={closeEpisodeMutation.isPending}
        onCancel={() => setIsCloseConfirmOpen(false)}
        onConfirm={() => {
          setIsCloseConfirmOpen(false);
          closeEpisodeMutation.mutate();
        }}
      />
      <Surface className="rounded-[24px] px-4 py-3.5 sm:px-5 sm:py-4.5">
        <div className="space-y-3">
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500" />
                  <h2 className="app-card-title">{child.name}</h2>
                  <span className="inline-flex items-center rounded-full bg-[color:color-mix(in_srgb,var(--color-danger)_12%,transparent)] px-2.5 py-1 text-[0.72rem] font-semibold tracking-[0.01em] text-[color:color-mix(in_srgb,var(--color-danger)_72%,var(--color-foreground))]">
                    {language === "ru"
                      ? `Болеет ${illnessDurationLabel}`
                      : `Ill for ${illnessDurationLabel}`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCloseConfirmOpen(true)}
                disabled={closeEpisodeMutation.isPending}
                className={`${appHeaderDangerPillActionClass} shrink-0 disabled:opacity-50`}
              >
                {closeEpisodeMutation.isPending
                  ? copy.closing
                  : language === "ru"
                    ? "Завершить"
                    : "Finish"}
              </button>
            </div>
            <p className="mt-1 text-sm leading-6 text-muted">{ageLabel || "—"}</p>
            <p className="mt-1 text-sm leading-5 text-muted">
              {t(copy.observationSince, { date: formatDate(episode.startedAt) })}
            </p>
            {canUseLiveActivities ? (
              <div className="mt-3 flex items-center justify-between gap-4 border-t border-[color:color-mix(in_srgb,var(--color-border)_42%,transparent)] pt-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">Live</p>
                  <p className="text-xs leading-5 text-muted">
                    {language === "ru" ? "На этом устройстве" : "On this device"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    {isTogglingLiveObservation ? "..." : isLiveObservationEnabled ? "On" : "Off"}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isLiveObservationEnabled}
                    aria-label={language === "ru" ? "Показывать Live" : "Show Live"}
                    onClick={onToggleLiveObservation}
                    disabled={isTogglingLiveObservation}
                    className={[
                      "baby-mode-switch relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isLiveObservationEnabled ? "baby-mode-switch--active" : "",
                      isTogglingLiveObservation ? "cursor-not-allowed opacity-60" : "",
                    ].join(" ")}
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        "baby-mode-switch__thumb absolute left-1 inline-block h-6 w-6 rounded-full transition-transform",
                        isLiveObservationEnabled ? "translate-x-6" : "translate-x-0",
                      ].join(" ")}
                    />
                  </button>
                </div>
              </div>
            ) : null}
            {episode.title && (
              <p className="mt-1 line-clamp-1 text-sm leading-5 text-foreground/80">
                {episode.title}
              </p>
            )}
            {upcomingLead && !availableNowLead ? (
              <div className="soft-pill-info mt-3 inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-xs">
                <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                <span className="font-medium">{copy.scheduled}</span>
                <span className="truncate text-muted">
                  {getPlanDisplayName(upcomingLead)}
                  {upcomingLead.stats.nextAllowedAt
                    ? ` · ${formatDoseStatusLabel(upcomingLead.stats.nextAllowedAt, language, now)}`
                    : ""}
                </span>
              </div>
            ) : null}
          </div>

          {(availableNowItems.length > 0 || upcomingItems.length > 0 || hasUnavailableItems) && (
            <div className={availableNowLead ? "pt-1" : "pt-0"}>
              {availableNowLead ? (
                <div className="space-y-3">
                  <div className="soft-panel-muted rounded-[22px] px-3.5 py-3">
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm leading-5 text-foreground">
                          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                          <span className="font-medium text-emerald-700 dark:text-emerald-300">
                            {copy.availableNow}
                          </span>
                          <span className="font-medium">{getPlanDisplayName(availableNowLead)}</span>
                          {getPlanDose(availableNowLead) ? (
                            <span className="text-muted"> • {getPlanDose(availableNowLead)}</span>
                          ) : null}
                        </p>
                        {availableNowOverflowCount > 0 ? (
                          <p className="mt-1 text-xs text-muted">
                            {t(copy.moreAvailableNow, { count: availableNowOverflowCount })}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          doseLogging.open({
                            item: availableNowLead,
                            nextAllowedAt: availableNowLead.stats.nextAllowedAt,
                            planName: getPlanDisplayName(availableNowLead),
                          })
                        }
                        disabled={takeDoseMutation.isPending}
                        className={`${appBtnPrimaryClass} w-full disabled:opacity-50 md:w-auto md:px-4`}
                      >
                        {takeDoseMutation.isPending ? copy.saving : copy.logDose}
                      </button>
                    </div>
                  </div>
                  {justSaved ? <p className="text-xs soft-text-success">{copy.doseSaved}</p> : null}
                </div>
              ) : upcomingLead ? null : (
                <p className="soft-text-danger text-sm">{copy.packNeedsReview}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-0">
            <Link
              to={`/children/${child.id}/illness?focus=temperature`}
              className={appGridPillActionClass}
            >
              {language === "ru" ? "+ Температура" : "+ Temperature"}
            </Link>
            <Link
              to={`/children/${child.id}/illness?focus=administration`}
              className={appGridPillActionClass}
            >
              {language === "ru" ? "+ Приём" : "+ Dose"}
            </Link>
            <Link
              to={`/children/${child.id}/illness?focus=comment`}
              className={appGridPillActionClass}
            >
              {language === "ru" ? "+ Заметка" : "+ Note"}
            </Link>
            <Link
              to={
                plans.length > 0
                  ? `/children/${child.id}/illness?focus=reminders`
                  : `/children/${child.id}/illness?focus=reminder-create`
              }
              className={appGridPillActionClass}
            >
              {plans.length > 0
                ? copy.reminders
                : language === "ru"
                  ? "+ Напоминание"
                  : "+ Reminder"}
            </Link>
          </div>

          <Link
            to={`/children/${child.id}/illness?focus=timeline`}
            className={appWidePillActionClass}
          >
            {copy.timeline}
          </Link>
        </div>
      </Surface>
      <DoseTimeSheet
        language={language}
        isOpen={doseLogging.isOpen}
        closeDisabled={takeDoseMutation.isPending}
        hint={doseLogging.hint}
        pendingDate={doseLogging.pendingDate}
        pendingTime={doseLogging.pendingTime}
        hasFuturePendingDoseSelection={doseLogging.hasFuturePendingDoseSelection}
        isPending={takeDoseMutation.isPending || !doseLogging.pendingDoseAt}
        submitLabel={takeDoseMutation.isPending ? copy.saving : copy.logDose}
        onClose={() => {
          if (takeDoseMutation.isPending) {
            return;
          }
          doseLogging.close();
        }}
        onDateChange={doseLogging.setPendingDate}
        onTimeChange={doseLogging.setPendingTime}
        onSubmit={doseLogging.submitPending}
      />
    </li>
  );
}

function getPlanDisplayName(item: MedicationPlanPriorityItem) {
  return item.plan.customMedicineName ?? item.medicine?.medicineName ?? "Medicine";
}

function getPlanDose(item: MedicationPlanPriorityItem) {
  return item.plan.doseAmount?.trim() ?? "";
}
