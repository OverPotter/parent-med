/**
 * Активные наблюдения: текущие эпизоды по всем детям семьи.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdministrationEvent,
  fetchAdministrationEventsByEpisodeId,
} from "@shared/api/administrationEvents";
import { fetchChildrenByFamilyId } from "@shared/api/children";
import { fetchEpisodeMedicationPlansByEpisodeId } from "@shared/api/episodeMedicationPlans";
import { fetchHouseholdMedicines } from "@shared/api/householdMedicines";
import { fetchIllnessEpisodesByChildId, updateIllnessEpisode } from "@shared/api/illnessEpisodes";
import { trackMedicationAdministered } from "@shared/analytics";
import { PageIntro } from "@shared/components/PageIntro";
import { ConfirmDialog } from "@shared/components/ConfirmDialog";
import { EmptyState, Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import { useNow } from "@shared/hooks/useNow";
import { useAppStore } from "@shared/store/useAppStore";
import type {
  AdministrationEvent,
  Child,
  EpisodeMedicationPlan,
  HouseholdMedicine,
  IllnessEpisode,
} from "@shared/types/api";
import {
  formatRelativeDateTime,
  type MedicationPlanPriorityItem,
  getPrioritizedMedicationPlanItems,
} from "../utils/medicationPlans";
import { formatDate } from "@shared/utils/date";
import { formatChildAgeLabel, getChildrenCopy } from "@client/i18n/children";

const appBtnPrimaryClass =
  "soft-pill-primary app-profile-action app-profile-action--selected inline-flex min-h-[2.65rem] items-center justify-center px-3.5 text-[0.82rem] tracking-[-0.025em] sm:min-h-[2.75rem] sm:text-[0.84rem]";
const appGridPillActionClass =
  "soft-pill app-profile-action inline-flex min-h-[2.65rem] w-full items-center justify-center px-3.5 text-center text-[0.82rem] font-semibold leading-4 tracking-[-0.025em] text-foreground transition hover:opacity-90 sm:min-h-[2.75rem] sm:text-[0.84rem]";
const appWidePillActionClass =
  "soft-pill app-profile-action inline-flex min-h-[2.65rem] w-full items-center justify-center px-3.5 text-center text-[0.82rem] font-semibold leading-4 tracking-[-0.025em] text-foreground transition hover:opacity-90 sm:min-h-[2.75rem] sm:text-[0.84rem]";
const appHeaderDangerPillActionClass =
  "soft-pill-danger app-profile-action inline-flex min-h-[2.4rem] items-center justify-center rounded-full px-3 py-1.5 text-center text-xs font-semibold tracking-[-0.015em] transition hover:opacity-90 whitespace-nowrap";

export function ActiveIllnessesPage() {
  const { language, t } = useI18n();
  const copy = getChildrenCopy(language).activeIllnesses;
  const common = getChildrenCopy(language).common;
  const pageTitle = language === "ru" ? "Журнал" : "Health";
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const now = useNow();
  const currentTime = new Date(now);
  const liveQueryOptions = useLiveQueryOptions(3000);

  const { data: children = [], isLoading } = useQuery({
    queryKey: ["children", currentFamilyId],
    queryFn: () => fetchChildrenByFamilyId(currentFamilyId!),
    enabled: !!currentFamilyId,
    ...liveQueryOptions,
  });

  const { data: householdMedicines = [] } = useQuery({
    queryKey: ["household-medicines", currentFamilyId],
    queryFn: fetchHouseholdMedicines,
    enabled: !!currentFamilyId,
    ...liveQueryOptions,
  });

  const episodeQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["illness-episodes", child.id],
      queryFn: () => fetchIllnessEpisodesByChildId(child.id),
      enabled: !!child.id,
      ...liveQueryOptions,
    })),
  });

  const isActiveEpisodesLoading =
    children.length > 0 && episodeQueries.some((query) => query.isLoading || query.isPending);

  const activeChildren = children
    .map((child, index) => ({
      child,
      episode:
        (episodeQueries[index]?.data ?? []).find((episode) => episode.status === "active") ?? null,
    }))
    .filter((item) => item.episode);

  const medicationPlanQueries = useQueries({
    queries: activeChildren.map(({ episode }) => ({
      queryKey: ["episode-medication-plans", episode!.id],
      queryFn: () => fetchEpisodeMedicationPlansByEpisodeId(episode!.id),
      enabled: !!episode?.id,
      ...liveQueryOptions,
    })),
  });

  const administrationQueries = useQueries({
    queries: activeChildren.map(({ episode }) => ({
      queryKey: ["administration-events", episode!.id],
      queryFn: () => fetchAdministrationEventsByEpisodeId(episode!.id),
      enabled: !!episode?.id,
      ...liveQueryOptions,
    })),
  });

  if (!currentFamilyId) {
    return (
      <Surface className="p-5">
        <h1 className="app-title text-[1.9rem] sm:text-[2.2rem]">{pageTitle}</h1>
        <p className="mt-2 text-muted">{common.familyRequired}</p>
      </Surface>
    );
  }

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <PageIntro title={pageTitle} subtitle={copy.subtitle} compactOnMobile hideOnMobile />

      <div className="app-mobile-section-intro sm:hidden">
        <h1 className="app-mobile-section-intro__title">{pageTitle}</h1>
        <p className="app-mobile-section-intro__hint">{copy.mobileHint}</p>
      </div>

      {(isLoading || isActiveEpisodesLoading) && <p className="text-muted">{common.loading}</p>}

      {!isLoading && !isActiveEpisodesLoading && activeChildren.length === 0 && (
        <EmptyState>
          <div className="space-y-2">
            <p>{copy.empty}</p>
            <p>
              {language === "ru"
                ? "Откройте раздел «Дети», чтобы начать новое наблюдение."
                : "Open the Children section to start a new tracking session."}
            </p>
          </div>
        </EmptyState>
      )}

      {!isLoading && !isActiveEpisodesLoading && activeChildren.length > 0 && (
        <ul className="grid gap-3">
          {activeChildren.map(({ child, episode }, index) => (
            <ActiveIllnessCard
              key={child.id}
              child={child}
              episode={episode!}
              medicines={householdMedicines}
              plans={medicationPlanQueries[index]?.data ?? []}
              administrations={administrationQueries[index]?.data ?? []}
              now={currentTime}
              copy={copy}
              t={t}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ActiveIllnessCard({
  child,
  episode,
  medicines,
  plans,
  administrations,
  now,
  copy,
  t,
}: {
  child: Child;
  episode: IllnessEpisode;
  medicines: HouseholdMedicine[];
  plans: EpisodeMedicationPlan[];
  administrations: AdministrationEvent[];
  now: Date;
  copy: ReturnType<typeof getChildrenCopy>["activeIllnesses"];
  t: (text: string, variables?: Record<string, string | number>) => string;
}) {
  const { language } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [justSaved, setJustSaved] = useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false);
  const ageLabel = formatChildAgeLabel(child.birthDate, child.ageLabel, language);
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
    mutationFn: (plan: EpisodeMedicationPlan) => {
      if (!plan) {
        throw new Error(copy.noReminder);
      }
      return createAdministrationEvent({
        episode_id: episode.id,
        household_medicine_id: plan.householdMedicineId,
        custom_medicine_name: plan.customMedicineName ?? undefined,
        amount: plan.doseAmount,
        reason: copy.reminderReason,
      });
    },
    onSuccess: () => {
      trackMedicationAdministered("active_illnesses");
      queryClient.invalidateQueries({ queryKey: ["administration-events", episode.id] });
      queryClient.invalidateQueries({ queryKey: ["episode-medication-plans", episode.id] });
      setJustSaved(true);
    },
  });

  const closeEpisodeMutation = useMutation({
    mutationFn: () => updateIllnessEpisode(episode.id, { status: "closed" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["illness-episodes", child.id] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active", child.id] });
      queryClient.invalidateQueries({ queryKey: ["illness-episodes"] });
      queryClient.invalidateQueries({ queryKey: ["illness-episode-active"] });
      queryClient.invalidateQueries({ queryKey: ["children"] });
      navigate("/children");
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
            <p className="mt-1 text-sm leading-6 text-muted">
              {ageLabel ? `${ageLabel} • ` : ""}
              {t(copy.observationSince, { date: formatDate(episode.startedAt) })}
            </p>
            {episode.title && (
              <p className="mt-1 line-clamp-1 text-sm leading-5 text-foreground/80">
                {episode.title}
              </p>
            )}
            {upcomingLead && !availableNowLead && (
              <div className="soft-pill-info mt-3 inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-xs">
                <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                <span className="font-medium">{copy.scheduled}</span>
                <span className="truncate text-muted">
                  {getPlanDisplayName(upcomingLead)}
                  {upcomingLead.stats.nextAllowedAt
                    ? ` · ${formatRelativeDateTime(upcomingLead.stats.nextAllowedAt, now)}`
                    : ""}
                </span>
              </div>
            )}
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
                          <span className="font-medium">
                            {getPlanDisplayName(availableNowLead)}
                          </span>
                          {getPlanDose(availableNowLead) && (
                            <span className="text-muted"> • {getPlanDose(availableNowLead)}</span>
                          )}
                        </p>
                        {availableNowOverflowCount > 0 && (
                          <p className="mt-1 text-xs text-muted">
                            {t(copy.moreAvailableNow, { count: availableNowOverflowCount })}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => takeDoseMutation.mutate(availableNowLead.plan)}
                        disabled={takeDoseMutation.isPending}
                        className={`${appBtnPrimaryClass} w-full disabled:opacity-50 md:w-auto md:px-4`}
                      >
                        {takeDoseMutation.isPending ? copy.saving : copy.logDose}
                      </button>
                    </div>
                  </div>
                  {justSaved && <p className="text-xs soft-text-success">{copy.doseSaved}</p>}
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
              to={`/children/${child.id}/illness?focus=reminders`}
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
    </li>
  );
}

function getPlanDisplayName(item: MedicationPlanPriorityItem) {
  return item.plan.customMedicineName ?? item.medicine?.medicineName ?? "Medicine";
}

function getPlanDose(item: MedicationPlanPriorityItem) {
  return item.plan.doseAmount?.trim() ?? "";
}
