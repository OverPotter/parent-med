/**
 * Активные болезни: текущие эпизоды по всем детям семьи.
 */

import { Link } from "react-router-dom";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdministrationEvent,
  fetchAdministrationEventsByEpisodeId,
} from "@shared/api/administrationEvents";
import { fetchChildrenByFamilyId } from "@shared/api/children";
import { fetchEpisodeMedicationPlansByEpisodeId } from "@shared/api/episodeMedicationPlans";
import { fetchHouseholdMedicines } from "@shared/api/householdMedicines";
import { fetchIllnessEpisodesByChildId } from "@shared/api/illnessEpisodes";
import { trackMedicationAdministered } from "@shared/analytics";
import { PageIntro } from "@shared/components/PageIntro";
import { EmptyState, RowSurface, Surface } from "@shared/components/Surface";
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

export function ActiveIllnessesPage() {
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
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Активные болезни</h1>
        <p className="mt-2 text-muted">Сначала выбери семью в разделе «Семья».</p>
      </Surface>
    );
  }

  return (
    <div className="space-y-7">
      <PageIntro
        title="Активные болезни"
        subtitle="Только текущие наблюдения, где важны ближайшие действия и лекарства, а не архив."
        compactOnMobile
        hideOnMobile
      />

      {(isLoading || isActiveEpisodesLoading) && <p className="text-muted">Загрузка…</p>}

      {!isLoading && !isActiveEpisodesLoading && activeChildren.length === 0 && (
        <EmptyState>Сейчас нет активных наблюдений.</EmptyState>
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
}: {
  child: Child;
  episode: IllnessEpisode;
  medicines: HouseholdMedicine[];
  plans: EpisodeMedicationPlan[];
  administrations: AdministrationEvent[];
  now: Date;
}) {
  const queryClient = useQueryClient();
  const prioritizedItems = getPrioritizedMedicationPlanItems(
    plans,
    administrations,
    medicines,
    now
  );
  const availableNowItems = prioritizedItems.filter(
    (item) => !item.isUnavailable && !item.stats.isBlocked
  );
  const visibleAvailableItems = availableNowItems.slice(0, 3);
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
  const hasDailyLimitItems = prioritizedItems.some((item) => item.stats.blockedByDailyLimit);
  const takeDoseMutation = useMutation({
    mutationFn: (plan: EpisodeMedicationPlan) => {
      if (!plan) {
        throw new Error("Нет доступного плана.");
      }
      return createAdministrationEvent({
        episode_id: episode.id,
        household_medicine_id: plan.householdMedicineId,
        custom_medicine_name: plan.customMedicineName ?? undefined,
        amount: plan.doseAmount,
        reason: "Дали по плану",
      });
    },
    onSuccess: () => {
      trackMedicationAdministered("active_illnesses");
      queryClient.invalidateQueries({ queryKey: ["administration-events", episode.id] });
      queryClient.invalidateQueries({ queryKey: ["episode-medication-plans", episode.id] });
    },
  });

  return (
    <li>
      <RowSurface className="soft-card-status-danger rounded-[24px] px-4 py-3.5 sm:px-5 sm:py-4.5">
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-foreground sm:text-lg">{child.name}</h2>
                <span className="soft-pill-danger rounded-full px-2 py-1 text-[11px]">
                  Наблюдение
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-muted">
                {child.ageLabel ? `${child.ageLabel} • ` : ""}
                Наблюдение с {formatDate(episode.startedAt)}
              </p>
              {episode.title && (
                <p className="mt-1 line-clamp-1 text-sm leading-5 text-foreground/80">
                  {episode.title}
                </p>
              )}
            </div>
            <Link
              to={`/children/${child.id}/illness`}
              className="soft-pill-primary rounded-full px-3 py-1 text-[11px]"
            >
              Открыть
            </Link>
          </div>

          {(availableNowItems.length > 0 ||
            upcomingItems.length > 0 ||
            hasUnavailableItems ||
            hasDailyLimitItems) && (
            <div className="space-y-3">
              {availableNowItems.length > 0 && (
                <div className="soft-panel-muted rounded-[20px] px-3.5 py-3 sm:px-4 sm:py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="soft-pill-success rounded-full px-2 py-1 text-[11px]">
                      Сейчас
                    </span>
                    <p className="text-sm font-semibold text-foreground sm:text-base">Можно дать</p>
                  </div>
                  <div className="mt-2 space-y-2">
                    {visibleAvailableItems.map((item) => {
                      const itemName = getPlanDisplayName(item);
                      const itemDose = getPlanDose(item);
                      return (
                        <div
                          key={item.plan.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[color:var(--color-surface)]/75 px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{itemName}</p>
                            {itemDose && <p className="mt-0.5 text-xs text-muted">{itemDose}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => takeDoseMutation.mutate(item.plan)}
                            disabled={takeDoseMutation.isPending}
                            className="soft-button-primary rounded-2xl px-3 py-2 text-sm disabled:opacity-50"
                          >
                            {takeDoseMutation.isPending ? "..." : "Дать"}
                          </button>
                        </div>
                      );
                    })}
                    {availableNowItems.length > visibleAvailableItems.length && (
                      <span className="soft-pill inline-flex rounded-full px-2.5 py-1.5 text-[11px] text-muted">
                        + ещё {availableNowItems.length - visibleAvailableItems.length}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {upcomingItems.length > 0 && (
                <div className="space-y-3">
                  {availableNowItems.length > 0 && (
                    <div className="mx-1 h-px rounded-full bg-border/45" aria-hidden="true" />
                  )}

                  <div className="soft-panel-muted rounded-[20px] bg-[color:var(--color-surface)]/58 px-3.5 py-3 sm:px-4 sm:py-3.5">
                    <span className="soft-pill rounded-full px-2 py-1 text-[11px] text-muted">
                      Позже
                    </span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {upcomingItems.map((item) => {
                        const itemName = getPlanDisplayName(item);
                        const itemDose = getPlanDose(item);
                        return (
                          <div
                            key={item.plan.id}
                            className="soft-pill inline-flex flex-wrap items-center gap-1.5 rounded-full bg-background/55 px-3 py-2 text-xs text-muted"
                          >
                            <span className="font-medium text-foreground">{itemName}</span>
                            {itemDose && <span>{itemDose}</span>}
                            {item.stats.nextAllowedAt && (
                              <span className="soft-pill-warning rounded-full px-2 py-0.5 text-[11px]">
                                {formatRelativeDateTime(item.stats.nextAllowedAt, now)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {availableNowItems.length === 0 &&
                upcomingItems.length === 0 &&
                hasUnavailableItems && (
                  <div className="soft-panel-muted rounded-[20px] px-3.5 py-3 sm:px-4 sm:py-3.5">
                    <p className="soft-text-danger text-sm">
                      Есть план, но упаковку нужно проверить.
                    </p>
                  </div>
                )}

              {availableNowItems.length === 0 &&
                upcomingItems.length === 0 &&
                !hasUnavailableItems &&
                hasDailyLimitItems && (
                  <div className="soft-panel-muted rounded-[20px] px-3.5 py-3 sm:px-4 sm:py-3.5">
                    <p className="text-sm text-muted">На сегодня лимит уже достигнут.</p>
                  </div>
                )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Link
              to={`/children/${child.id}/illness?focus=administration`}
              className="soft-button-secondary rounded-2xl px-4 py-2.5 text-sm"
            >
              Быстрая запись
            </Link>
            <Link
              to={`/children/${child.id}/illness?focus=timeline`}
              className="soft-pill rounded-full px-3 py-2 text-xs text-muted"
            >
              Лента
            </Link>
          </div>
        </div>
      </RowSurface>
    </li>
  );
}

function getPlanDisplayName(item: MedicationPlanPriorityItem) {
  return item.plan.customMedicineName ?? item.medicine?.medicineName ?? "Лекарство";
}

function getPlanDose(item: MedicationPlanPriorityItem) {
  return item.plan.doseAmount?.trim() ?? "";
}
