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
import { MedicalDisclaimer } from "@shared/components/MedicalDisclaimer";
import { EmptyState, RowSurface, Surface } from "@shared/components/Surface";
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
  "app-btn-primary-md soft-button-primary inline-flex items-center justify-center px-4";
const appBtnSecondaryClass =
  "app-btn-secondary-md soft-button-secondary inline-flex items-center justify-center px-3.5";
const appBtnDangerClass =
  "app-btn-danger-md soft-button-danger inline-flex items-center justify-center px-4";

export function ActiveIllnessesPage() {
  const { language, t } = useI18n();
  const copy = getChildrenCopy(language).activeIllnesses;
  const common = getChildrenCopy(language).common;
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
        <h1 className="app-title text-[1.9rem] sm:text-[2.2rem]">{copy.title}</h1>
        <p className="mt-2 text-muted">{common.familyRequired}</p>
      </Surface>
    );
  }

  return (
    <div className="space-y-7">
      <PageIntro title={copy.title} subtitle={copy.subtitle} compactOnMobile hideOnMobile />
      <MedicalDisclaimer />

      {(isLoading || isActiveEpisodesLoading) && <p className="text-muted">{common.loading}</p>}

      {!isLoading && !isActiveEpisodesLoading && activeChildren.length === 0 && (
        <EmptyState>{copy.empty}</EmptyState>
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
      <RowSurface className="soft-card-status-warning rounded-[24px] px-4 py-3.5 sm:px-5 sm:py-4.5">
        <div className="space-y-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="app-card-title">{child.name}</h2>
              <span className="soft-pill-warning rounded-full px-2.5 py-1 text-[11px]">
                {copy.observationBadge}
              </span>
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
              <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--color-warning)_24%,transparent)] bg-[color:color-mix(in_srgb,var(--color-warning-soft)_36%,transparent)] px-3 py-1.5 text-xs text-foreground">
                <span className="soft-text-warning font-medium">{copy.scheduled}</span>
                <span className="truncate">
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
                  <div className="rounded-[22px] bg-[color:color-mix(in_srgb,var(--color-success-soft)_58%,transparent)] px-3.5 py-3">
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm leading-5 text-foreground">
                          <span className="soft-pill-success rounded-full px-2.5 py-1 text-[11px]">
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
                        className={`${appBtnPrimaryClass} min-h-[2.95rem] w-full disabled:opacity-50 md:w-auto md:min-h-[3.15rem] md:px-5`}
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

          <div className="grid gap-2 pt-0 sm:grid-cols-2 xl:grid-cols-4">
            <Link
              to={`/children/${child.id}/illness?focus=temperature`}
              className={`${appBtnSecondaryClass} min-h-[2.85rem] text-center sm:min-h-[3.05rem]`}
            >
              {copy.logTemperature}
            </Link>
            {!availableNowLead && (
              <Link
                to={`/children/${child.id}/illness?focus=administration`}
                className={`${appBtnSecondaryClass} min-h-[2.85rem] text-center sm:min-h-[3.05rem]`}
              >
                {copy.logDose}
              </Link>
            )}
            <Link
              to={`/children/${child.id}/illness?focus=comment`}
              className={`${appBtnSecondaryClass} min-h-[2.85rem] text-center sm:min-h-[3.05rem]`}
            >
              {copy.addNote}
            </Link>
            <Link
              to={`/children/${child.id}/illness?focus=timeline`}
              className={`${appBtnSecondaryClass} min-h-[2.85rem] text-center sm:min-h-[3.05rem]`}
            >
              {copy.timeline}
            </Link>
            <Link
              to={`/children/${child.id}/illness?focus=reminders`}
              className={`${appBtnSecondaryClass} min-h-[2.85rem] text-center sm:min-h-[3.05rem]`}
            >
              {plans.length > 0 ? copy.reminders : copy.addReminder}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsCloseConfirmOpen(true)}
            disabled={closeEpisodeMutation.isPending}
            className={`${appBtnDangerClass} min-h-[2.95rem] w-full disabled:opacity-50 sm:min-h-[3.1rem]`}
          >
            {closeEpisodeMutation.isPending ? copy.closing : copy.closeConfirm}
          </button>
        </div>
      </RowSurface>
    </li>
  );
}

function getPlanDisplayName(item: MedicationPlanPriorityItem) {
  return item.plan.customMedicineName ?? item.medicine?.medicineName ?? "Medicine";
}

function getPlanDose(item: MedicationPlanPriorityItem) {
  return item.plan.doseAmount?.trim() ?? "";
}
