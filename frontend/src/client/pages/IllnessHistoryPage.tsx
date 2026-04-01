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
import { PageIntro } from "@shared/components/PageIntro";
import { EmptyState, RowSurface, Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useAppStore } from "@shared/store/useAppStore";
import type { Child, IllnessEpisode } from "@shared/types/api";
import { formatDate, formatDateTime } from "@shared/utils/date";
import { formatChildAgeLabel, getChildrenCopy } from "@client/i18n/children";

export function IllnessHistoryPage() {
  const { language, t } = useI18n();
  const copy = getChildrenCopy(language).illnessHistory;
  const common = getChildrenCopy(language).common;
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
        <h1 className="app-title text-xl sm:text-2xl">{copy.title}</h1>
        <p className="mt-2 text-muted">{common.familyRequired}</p>
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
    <div className="space-y-7">
      <PageIntro title={copy.title} subtitle={copy.subtitle} hideOnMobile />

      {(isLoading || isEpisodesLoading) && <p className="text-muted">{common.loading}</p>}

      {!isLoading && !isEpisodesLoading && childHistory.length === 0 && (
        <EmptyState>{copy.empty}</EmptyState>
      )}

      {!isLoading && !isEpisodesLoading && childHistory.length > 0 && (
        <ul className="grid gap-4">
          {childHistory.map(({ child, episodes, activeEpisode }) => (
            <HistoryCard
              key={child.id}
              child={child}
              episodes={episodes}
              hasActiveEpisode={!!activeEpisode}
              copy={copy}
              t={t}
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
  copy,
  t,
}: {
  child: Child;
  episodes: IllnessEpisode[];
  hasActiveEpisode: boolean;
  copy: ReturnType<typeof getChildrenCopy>["illnessHistory"];
  t: (text: string, variables?: Record<string, string | number>) => string;
}) {
  const { language } = useI18n();
  const lastEpisode = episodes[0] ?? null;
  const ageLabel = formatChildAgeLabel(child.birthDate, child.ageLabel, language);

  return (
    <li>
      <RowSurface>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="app-card-title text-[1.08rem]">{child.name}</h2>
              <span className="soft-pill rounded-full px-3 py-1.5 text-xs">
                {episodes.length} {copy.inArchive}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">
              {ageLabel ? `${ageLabel} • ` : ""}
              {lastEpisode
                ? t(copy.latestStarted, { date: formatDate(lastEpisode.startedAt) })
                : copy.historyEmpty}
            </p>
            {hasActiveEpisode && (
              <p className="soft-text-success mt-1 text-sm">{copy.activeOutsideArchive}</p>
            )}
            {lastEpisode?.closedAt && (
              <p className="mt-1 text-sm text-muted">
                {t(copy.closedAt, { date: formatDateTime(lastEpisode.closedAt) })}
              </p>
            )}
          </div>

          <Link
            to={`/children/${child.id}/illness?view=history`}
            className="soft-button-secondary inline-flex min-h-[2.85rem] items-center justify-center px-3.5 text-[0.84rem] tracking-[-0.025em] sm:min-h-[3.05rem] sm:px-4 sm:text-[0.89rem]"
          >
            {copy.historyLink}
          </Link>
        </div>
      </RowSurface>
    </li>
  );
}
