/**
 * Активные болезни: текущие эпизоды по всем детям семьи.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
        subtitle="Только текущие наблюдения, где важны ближайшие действия, приёмы и комментарии."
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
  const [justSaved, setJustSaved] = useState(false);
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
        throw new Error("Нет доступного напоминания.");
      }
      return createAdministrationEvent({
        episode_id: episode.id,
        household_medicine_id: plan.householdMedicineId,
        custom_medicine_name: plan.customMedicineName ?? undefined,
        amount: plan.doseAmount,
        reason: "Отмечено по напоминанию",
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
      <RowSurface className="soft-card-status-danger rounded-[24px] px-4 py-3.5 sm:px-5 sm:py-4.5">
        <div className="space-y-3">
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
            {upcomingLead && !availableNowLead && (
              <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--color-warning)_24%,transparent)] bg-[color:color-mix(in_srgb,var(--color-warning-soft)_36%,transparent)] px-3 py-1.5 text-xs text-foreground">
                <span className="soft-text-warning font-medium">По графику</span>
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
                            Можно дать
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
                            Ещё доступно сейчас: {availableNowOverflowCount}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => takeDoseMutation.mutate(availableNowLead.plan)}
                        disabled={takeDoseMutation.isPending}
                        className="soft-button-primary w-full rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50 md:w-auto"
                      >
                        {takeDoseMutation.isPending ? "Сохраняем…" : "Записать приём"}
                      </button>
                    </div>
                  </div>
                  {justSaved && <p className="text-xs soft-text-success">Приём сохранён</p>}
                </div>
              ) : upcomingLead ? (
                getPlanDose(upcomingLead) ? (
                  <p className="text-xs text-muted">Доза: {getPlanDose(upcomingLead)}</p>
                ) : null
              ) : (
                <p className="soft-text-danger text-sm">
                  Есть напоминание, но упаковку нужно проверить.
                </p>
              )}
            </div>
          )}

          <div className="grid gap-2 pt-0 sm:grid-cols-2 xl:grid-cols-4">
            <Link
              to={`/children/${child.id}/illness?focus=temperature`}
              className="soft-button-secondary rounded-2xl px-4 py-3 text-center text-sm"
            >
              Записать температуру
            </Link>
            {!availableNowLead && (
              <Link
                to={`/children/${child.id}/illness?focus=administration`}
                className="soft-button-secondary rounded-2xl px-4 py-3 text-center text-sm"
              >
                Записать приём
              </Link>
            )}
            <Link
              to={`/children/${child.id}/illness?focus=comment`}
              className="soft-button-secondary rounded-2xl px-4 py-3 text-center text-sm"
            >
              Добавить заметку
            </Link>
            <Link
              to={`/children/${child.id}/illness?focus=timeline`}
              className="soft-button-secondary rounded-2xl px-4 py-3 text-center text-sm"
            >
              Лента
            </Link>
            <Link
              to={`/children/${child.id}/illness?focus=reminders`}
              className="soft-button-secondary rounded-2xl px-4 py-3 text-center text-sm"
            >
              График приёма
            </Link>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!window.confirm("Закрыть текущее наблюдение?")) {
                return;
              }
              closeEpisodeMutation.mutate();
            }}
            disabled={closeEpisodeMutation.isPending}
            className="soft-button-danger w-full rounded-2xl px-4 py-2.5 text-sm disabled:opacity-50"
          >
            {closeEpisodeMutation.isPending ? "Закрываем…" : "Закрыть наблюдение"}
          </button>
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
