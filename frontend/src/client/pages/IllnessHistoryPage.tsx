/**
 * История болезней: обзор по детям с переходом в детальную историю.
 */

import { Link } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { fetchChildrenByFamilyId } from "@shared/api/children";
import {
  fetchActiveIllnessEpisodeByChildId,
  fetchIllnessEpisodesByChildId,
} from "@shared/api/illnessEpisodes";
import { EmptyState, RowSurface, Surface } from "@shared/components/Surface";
import { useAppStore } from "@shared/store/useAppStore";
import type { Child, IllnessEpisode } from "@shared/types/api";
import { formatDate, formatDateTime } from "@shared/utils/date";

export function IllnessHistoryPage() {
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);

  const { data: children = [], isLoading } = useQuery({
    queryKey: ["children", currentFamilyId],
    queryFn: () => fetchChildrenByFamilyId(currentFamilyId!),
    enabled: !!currentFamilyId,
  });

  const historyQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["illness-episodes", child.id],
      queryFn: () => fetchIllnessEpisodesByChildId(child.id),
      enabled: !!child.id,
    })),
  });

  const activeQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["illness-episode-active", child.id],
      queryFn: () => fetchActiveIllnessEpisodeByChildId(child.id),
      enabled: !!child.id,
    })),
  });

  const isEpisodesLoading =
    children.length > 0 &&
    [...historyQueries, ...activeQueries].some((query) => query.isLoading || query.isPending);

  if (!currentFamilyId) {
    return (
      <Surface className="p-5">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">История болезней</h1>
        <p className="mt-2 text-muted">Сначала выбери семью в разделе «Семья».</p>
      </Surface>
    );
  }

  const childHistory = children
    .map((child, index) => {
      const allEpisodes = historyQueries[index]?.data ?? [];
      const activeEpisode = activeQueries[index]?.data ?? null;
      const historyEpisodes = allEpisodes.filter((episode) => episode.status === "closed");

      return {
        child,
        episodes: historyEpisodes,
        activeEpisode,
      };
    })
    .filter((item) => item.episodes.length > 0)
    .sort((left, right) => right.episodes.length - left.episodes.length);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">История болезней</h1>
        <p className="mt-1 text-sm text-muted">
          Краткий обзор по детям и переход в историю ребёнка.
        </p>
      </div>

      {(isLoading || isEpisodesLoading) && <p className="text-muted">Загрузка…</p>}

      {!isLoading && !isEpisodesLoading && childHistory.length === 0 && (
        <EmptyState>Завершённой истории болезней пока нет.</EmptyState>
      )}

      {!isLoading && !isEpisodesLoading && childHistory.length > 0 && (
        <ul className="grid gap-3">
          {childHistory.map(({ child, episodes, activeEpisode }) => (
            <HistoryCard
              key={child.id}
              child={child}
              episodes={episodes}
              hasActiveEpisode={!!activeEpisode}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function HistoryCard({
  child,
  episodes,
  hasActiveEpisode,
}: {
  child: Child;
  episodes: IllnessEpisode[];
  hasActiveEpisode: boolean;
}) {
  const lastEpisode = episodes[0] ?? null;

  return (
    <li>
      <RowSurface>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">{child.name}</h2>
            <p className="mt-1 text-sm text-muted">
              {child.ageLabel ? `${child.ageLabel} • ` : ""}
              Завершённых эпизодов: {episodes.length}
              {lastEpisode
                ? ` • Последний: ${formatDate(lastEpisode.startedAt)}`
                : " • История пуста"}
            </p>
            {hasActiveEpisode && (
              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                Сейчас есть активный эпизод, он не входит в историю
              </p>
            )}
            {lastEpisode?.closedAt && (
              <p className="mt-1 text-sm text-muted">
                Закрыт: {formatDateTime(lastEpisode.closedAt)}
              </p>
            )}
          </div>

          <Link
            to={`/children/${child.id}/illness?view=history`}
            className="rounded-xl border border-border px-4 py-2 text-sm text-foreground hover:bg-muted/30"
          >
            История
          </Link>
        </div>
      </RowSurface>
    </li>
  );
}
