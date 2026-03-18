/**
 * Активные болезни: текущие эпизоды по всем детям семьи.
 */

import { Link } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { fetchChildrenByFamilyId } from "@shared/api/children";
import { fetchIllnessEpisodesByChildId } from "@shared/api/illnessEpisodes";
import { EmptyState, RowSurface, Surface } from "@shared/components/Surface";
import { useAppStore } from "@shared/store/useAppStore";
import type { Child, IllnessEpisode } from "@shared/types/api";
import { formatDate } from "@shared/utils/date";

export function ActiveIllnessesPage() {
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);

  const { data: children = [], isLoading } = useQuery({
    queryKey: ["children", currentFamilyId],
    queryFn: () => fetchChildrenByFamilyId(currentFamilyId!),
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

  if (!currentFamilyId) {
    return (
      <Surface className="p-5">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Активные болезни</h1>
        <p className="mt-2 text-muted">Сначала выбери семью в разделе «Семья».</p>
      </Surface>
    );
  }

  const activeChildren = children
    .map((child, index) => ({
      child,
      episode:
        (episodeQueries[index]?.data ?? []).find((episode) => episode.status === "active") ?? null,
    }))
    .filter((item) => item.episode);

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
          {activeChildren.map(({ child, episode }) => (
            <ActiveIllnessCard key={child.id} child={child} episode={episode!} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ActiveIllnessCard({ child, episode }: { child: Child; episode: IllnessEpisode }) {
  return (
    <li>
      <Link
        to={`/children/${child.id}/illness`}
        className="block transition-transform duration-200 hover:-translate-y-0.5"
      >
        <RowSurface>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">{child.name}</h2>
                <span className="soft-pill-success rounded-full px-2.5 py-1 text-xs">
                  Сейчас болеет
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                {child.ageLabel ? `${child.ageLabel} • ` : ""}С {formatDate(episode.startedAt)}
              </p>
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
