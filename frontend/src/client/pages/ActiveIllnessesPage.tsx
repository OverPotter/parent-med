/**
 * Активные болезни: текущие эпизоды по всем детям семьи.
 */

import { Link } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { fetchAdministrationEventsByEpisodeId } from "@shared/api/administrationEvents";
import { fetchChildrenByFamilyId } from "@shared/api/children";
import { fetchEpisodeMedicationPlansByEpisodeId } from "@shared/api/episodeMedicationPlans";
import { fetchHouseholdMedicines } from "@shared/api/householdMedicines";
import { fetchIllnessEpisodesByChildId } from "@shared/api/illnessEpisodes";
import { EmptyState, RowSurface, Surface } from "@shared/components/Surface";
import { useNow } from "@shared/hooks/useNow";
import { useAppStore } from "@shared/store/useAppStore";
import type { Child, IllnessEpisode } from "@shared/types/api";
import { getEpisodeMedicationReminder } from "../utils/medicationPlans";
import { formatDate } from "@shared/utils/date";

export function ActiveIllnessesPage() {
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const now = useNow();

  const { data: children = [], isLoading } = useQuery({
    queryKey: ["children", currentFamilyId],
    queryFn: () => fetchChildrenByFamilyId(currentFamilyId!),
    enabled: !!currentFamilyId,
  });

  const { data: householdMedicines = [] } = useQuery({
    queryKey: ["household-medicines", currentFamilyId],
    queryFn: fetchHouseholdMedicines,
    enabled: !!currentFamilyId,
  });

  const episodeQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["illness-episodes", child.id],
      queryFn: () => fetchIllnessEpisodesByChildId(child.id),
      enabled: !!child.id,
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
    })),
  });

  const administrationQueries = useQueries({
    queries: activeChildren.map(({ episode }) => ({
      queryKey: ["administration-events", episode!.id],
      queryFn: () => fetchAdministrationEventsByEpisodeId(episode!.id),
      enabled: !!episode?.id,
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
      <div>
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Активные болезни</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Только текущие эпизоды без архивной информации.
        </p>
      </div>

      {(isLoading || isActiveEpisodesLoading) && <p className="text-muted">Загрузка…</p>}

      {!isLoading && !isActiveEpisodesLoading && activeChildren.length === 0 && (
        <EmptyState>Активных эпизодов сейчас нет.</EmptyState>
      )}

      {!isLoading && !isActiveEpisodesLoading && activeChildren.length > 0 && (
        <ul className="grid gap-3">
          {activeChildren.map(({ child, episode }, index) => (
            <ActiveIllnessCard
              key={child.id}
              child={child}
              episode={episode!}
              medicationReminder={getEpisodeMedicationReminder(
                medicationPlanQueries[index]?.data ?? [],
                administrationQueries[index]?.data ?? [],
                householdMedicines,
                new Date(now)
              )}
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
  medicationReminder,
}: {
  child: Child;
  episode: IllnessEpisode;
  medicationReminder: { tone: "success" | "warning" | "danger" | "muted"; text: string } | null;
}) {
  return (
    <li>
      <Link
        to={`/children/${child.id}/illness`}
        className="block transition-transform duration-200 hover:-translate-y-0.5"
      >
        <RowSurface className="soft-card-status-danger">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">{child.name}</h2>
                <span className="soft-pill-danger rounded-full px-2.5 py-1 text-xs">
                  Идёт наблюдение
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                {child.ageLabel ? `${child.ageLabel} • ` : ""}
                Эпизод с {formatDate(episode.startedAt)}
              </p>
              {medicationReminder && (
                <p
                  className={[
                    "mt-2 text-sm",
                    medicationReminder.tone === "success"
                      ? "text-[color:var(--color-success)]"
                      : medicationReminder.tone === "warning"
                        ? "text-[color:var(--color-warning)]"
                        : medicationReminder.tone === "danger"
                          ? "text-[color:var(--color-danger)]"
                          : "text-muted",
                  ].join(" ")}
                >
                  {medicationReminder.text}
                </p>
              )}
              {episode.title && (
                <p className="mt-3 text-sm leading-7 text-foreground">{episode.title}</p>
              )}
            </div>
            <span className="soft-pill-primary rounded-full px-3 py-1 text-xs">Открыть</span>
          </div>
        </RowSurface>
      </Link>
    </li>
  );
}
