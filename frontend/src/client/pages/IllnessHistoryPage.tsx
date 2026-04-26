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
import { EmptyState, Surface } from "@shared/components/Surface";
import { useI18n } from "@shared/hooks/useI18n";
import { useIsIosShell } from "@shared/hooks/useIsIosShell";
import { useLiveQueryOptions } from "@shared/hooks/useLiveQueryOptions";
import { useAppStore } from "@shared/store/useAppStore";
import type { Child, IllnessEpisode } from "@shared/types/api";
import { formatDate, formatDateTime } from "@shared/utils/date";
import { formatChildAgeLabel, getChildrenCopy } from "@client/i18n/children";

const appBtnSecondaryClass =
  "soft-pill app-profile-action inline-flex min-h-[2.65rem] items-center justify-center px-3.5 text-[0.82rem] tracking-[-0.025em] sm:min-h-[2.75rem] sm:text-[0.84rem]";

export function IllnessHistoryPage() {
  const { language, t } = useI18n();
  const copy = getChildrenCopy(language).illnessHistory;
  const common = getChildrenCopy(language).common;
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const isIosShell = useIsIosShell();
  const illnessStatusQueryOptions = useLiveQueryOptions(isIosShell ? 10000 : 5000);

  const { data: children = [], isLoading } = useQuery({
    queryKey: ["children", currentFamilyId],
    queryFn: () => fetchChildrenByFamilyId(currentFamilyId!),
    enabled: !!currentFamilyId,
    ...illnessStatusQueryOptions,
  });

  const historyQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["illness-episodes", child.id],
      queryFn: () => fetchIllnessEpisodesByChildId(child.id),
      enabled: !!child.id,
      ...illnessStatusQueryOptions,
    })),
  });

  const activeQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ["illness-episode-active", child.id],
      queryFn: () => fetchActiveIllnessEpisodeByChildId(child.id),
      enabled: !!child.id,
      ...illnessStatusQueryOptions,
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
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <PageIntro title={copy.title} subtitle={copy.subtitle} compactOnMobile hideOnMobile />

      <div className="app-root-mobile-header app-root-mobile-header--after-hidden-intro sm:hidden">
        <div className="app-mobile-section-intro">
          <h1 className="app-mobile-section-intro__title">{copy.title}</h1>
          <p className="app-mobile-section-intro__hint">
            {language === "ru"
              ? "Завершённые наблюдения по детям семьи."
              : "Completed tracking sessions for the children in your family."}
          </p>
        </div>
      </div>

      {(isLoading || isEpisodesLoading) && <p className="text-muted">{common.loading}</p>}

      {!isLoading && !isEpisodesLoading && childHistory.length === 0 && (
        <EmptyState>
          <div className="space-y-2">
            <p>{copy.empty}</p>
            <p>
              {language === "ru"
                ? "Завершённые наблюдения появятся здесь после закрытия эпизода."
                : "Completed tracking sessions will appear here after an episode is closed."}
            </p>
          </div>
        </EmptyState>
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
      <Surface className="rounded-[24px] px-4 py-4 sm:px-5 sm:py-4.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500" />
              <h2 className="app-card-title">{child.name}</h2>
              <span className="soft-pill px-3 py-1.5 text-xs">
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
              <p className="mt-1 text-sm text-muted">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                {copy.activeOutsideArchive}
              </p>
            )}
            {lastEpisode?.closedAt && (
              <p className="mt-1 text-sm text-muted">
                {t(copy.closedAt, { date: formatDateTime(lastEpisode.closedAt) })}
              </p>
            )}
          </div>

          <Link to={`/children/${child.id}/illness?view=history`} className={appBtnSecondaryClass}>
            {copy.historyLink}
          </Link>
        </div>
      </Surface>
    </li>
  );
}
